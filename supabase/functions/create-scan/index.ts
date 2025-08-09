import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

function jsonResponse(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function normalizeUrl(input: string): string | null {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.toString();
  } catch (_) {
    return null;
  }
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; text?: string }> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (_) {
    return { ok: false, status: 0 };
  }
}

function parseRobots(robotsTxt: string, path: string): boolean {
  // Very small robots.txt allow/disallow parser (User-agent: * rules only)
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.trim());
  let applies = false;
  const disallows: string[] = [];
  const allows: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [keyRaw, valueRaw] = line.split(":");
    if (!keyRaw || valueRaw === undefined) continue;
    const key = keyRaw.toLowerCase().trim();
    const value = valueRaw.trim();
    if (key === "user-agent") {
      applies = value === "*";
    } else if (applies && key === "disallow") {
      disallows.push(value);
    } else if (applies && key === "allow") {
      allows.push(value);
    }
  }
  const isAllowed = (p: string) => {
    // If a specific allow matches, allow wins over disallow by longest match
    const allowMatch = allows.filter((a) => a && p.startsWith(a)).sort((a, b) => b.length - a.length)[0];
    const disallowMatch = disallows.filter((d) => d && p.startsWith(d)).sort((a, b) => b.length - a.length)[0];
    if (!allowMatch && !disallowMatch) return true;
    if (!disallowMatch) return true;
    if (!allowMatch) return disallowMatch === "" ? false : !p.startsWith(disallowMatch);
    return allowMatch.length >= (disallowMatch?.length || 0);
  };
  return isAllowed(path);
}

function extractBetween(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  return m && m[1] ? m[1].trim() : null;
}

function extractAllMeta(html: string) {
  const metaTagRegex = /<meta\s+([^>]*?)>/gi;
  const attrsRegex = /(\w+)(?:=(["'])(.*?)\2)?/g;
  const metas: Record<string, string>[] = [];
  const og: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = metaTagRegex.exec(html)) !== null) {
    const attrs = m[1];
    const obj: Record<string, string> = {};
    let a: RegExpExecArray | null;
    while ((a = attrsRegex.exec(attrs)) !== null) {
      const k = a[1].toLowerCase();
      const v = a[3] || "";
      obj[k] = v;
    }
    metas.push(obj);
    const prop = obj["property"] || obj["name"];
    if (prop && prop.toLowerCase().startsWith("og:")) {
      og[prop.toLowerCase()] = obj["content"] || "";
    }
  }
  const description = metas.find((m) => (m["name"] || "").toLowerCase() === "description")?.["content"] || null;
  return { metas, og, description };
}

function extractCanonical(html: string): string | null {
  const linkRegex = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  const hrefRegex = /href=["'](.*?)["']/i;
  const tag = html.match(linkRegex)?.[0];
  const href = tag?.match(hrefRegex)?.[1] || null;
  return href;
}

function extractJsonLd(html: string): unknown[] {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const results: unknown[] = [];
  for (const s of scripts) {
    const raw = s[1]?.trim();
    if (!raw) continue;
    try {
      results.push(JSON.parse(raw));
    } catch (_) {
      // ignore bad JSON-LD blocks
    }
  }
  return results;
}

function scoreCrawlability({ allowedByRobots, hasSitemap, hasCanonical, hasDescription }: { allowedByRobots: boolean; hasSitemap: boolean; hasCanonical: boolean; hasDescription: boolean; }): number {
  let score = 50;
  if (allowedByRobots) score += 15;
  if (hasSitemap) score += 10;
  if (hasCanonical) score += 10;
  if (hasDescription) score += 15;
  return Math.max(0, Math.min(100, score));
}

function scoreSummarizability(html: string): number {
  // naive approach: approximate content length after stripping tags
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const len = text.length;
  if (len < 200) return 30;
  if (len < 800) return 60;
  if (len < 2000) return 80;
  return 90;
}

function scoreFindability(crawlability: number, summarizability: number, og: Record<string, string>): number {
  let bonus = 0;
  if (og["og:title"]) bonus += 5;
  if (og["og:description"]) bonus += 5;
  return Math.max(0, Math.min(100, Math.round((crawlability + summarizability) / 2 + bonus)));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: "Missing Supabase environment configuration" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: { siteId?: string; url?: string };
  try {
    payload = await req.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload?.siteId && !payload?.url) {
    return jsonResponse({ error: "Provide siteId or url" }, 400);
  }

  // Resolve site and base URL
  let siteId: string | null = null;
  let pageUrl: string | null = null;

  if (payload.siteId) {
    const { data: site, error } = await supabase
      .from("sites")
      .select("id, url, user_id")
      .eq("id", payload.siteId)
      .maybeSingle();

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!site) return jsonResponse({ error: "Site not found" }, 404);
    if (site.user_id !== user.id) return jsonResponse({ error: "Forbidden" }, 403);

    siteId = site.id;
    pageUrl = site.url as string;
  } else if (payload.url) {
    const normalized = normalizeUrl(payload.url);
    if (!normalized) return jsonResponse({ error: "Invalid URL" }, 400);

    pageUrl = normalized;
    // Check if user's site already exists with this exact URL
    const { data: existing, error: exErr } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", pageUrl)
      .maybeSingle();
    if (exErr) return jsonResponse({ error: exErr.message }, 500);

    if (existing?.id) {
      siteId = existing.id as string;
    } else {
      // Enforce 'sites' limit
      const { data: allowedSites, error: limitErr } = await supabase.rpc("check_usage_limit", {
        user_id: user.id,
        limit_type: "sites",
      });
      if (limitErr) return jsonResponse({ error: limitErr.message }, 500);
      if (!allowedSites) return jsonResponse({ error: "Site limit reached for your plan" }, 403);

      // Create site
      const name = new URL(pageUrl).hostname;
      const { data: newSite, error: insErr } = await supabase
        .from("sites")
        .insert({ user_id: user.id, url: pageUrl, name })
        .select("id")
        .maybeSingle();
      if (insErr) return jsonResponse({ error: insErr.message }, 500);
      if (!newSite) return jsonResponse({ error: "Failed to create site" }, 500);
      siteId = newSite.id as string;
    }
  }

  if (!siteId || !pageUrl) {
    return jsonResponse({ error: "Unable to resolve site or URL" }, 400);
  }

  // Enforce 'scans' limit
  const { data: allowed, error: limitErr } = await supabase.rpc("check_usage_limit", {
    user_id: user.id,
    limit_type: "scans",
  });
  if (limitErr) return jsonResponse({ error: limitErr.message }, 500);
  if (!allowed) return jsonResponse({ error: "Scan limit reached for your plan" }, 403);

  // robots.txt check
  const urlObj = new URL(pageUrl);
  const robotsUrl = `${urlObj.origin}/robots.txt`;
  const robotsRes = await fetchText(robotsUrl);
  let allowedByRobots = true;
  if (robotsRes.ok && robotsRes.text) {
    allowedByRobots = parseRobots(robotsRes.text, urlObj.pathname || "/");
    if (!allowedByRobots) {
      return jsonResponse({ error: "Blocked by robots.txt" }, 403);
    }
  }

  // sitemap.xml presence
  const sitemapUrl = `${urlObj.origin}/sitemap.xml`;
  let hasSitemap = false;
  try {
    const sm = await fetch(sitemapUrl, { method: "HEAD" });
    hasSitemap = sm.ok;
    if (!hasSitemap) {
      const smGet = await fetch(sitemapUrl);
      hasSitemap = smGet.ok;
    }
  } catch (_) {
    hasSitemap = false;
  }

  // Fetch page and measure load time
  const started = Date.now();
  let html = "";
  let status = 0;
  let contentLength = 0;
  try {
    const res = await fetch(pageUrl, { redirect: "follow" });
    status = res.status;
    html = await res.text();
    const lenStr = res.headers.get("content-length");
    contentLength = lenStr ? parseInt(lenStr) || html.length : html.length;
  } catch (e) {
    return jsonResponse({ error: "Failed to fetch page" }, 502);
  }
  const loadTimeMs = Date.now() - started;

  // Extract signals
  const title = extractBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const { metas, og, description } = extractAllMeta(html);
  const canonical = extractCanonical(html);
  const jsonLd = extractJsonLd(html);

  const metadata = {
    url: pageUrl,
    title,
    description,
    canonical,
    meta: metas,
    og,
  } as Record<string, unknown>;

  const performance = {
    status,
    load_time_ms: loadTimeMs,
    content_length: contentLength,
    fetched_at: new Date().toISOString(),
  } as Record<string, unknown>;

  const crawlability_score = scoreCrawlability({
    allowedByRobots,
    hasSitemap,
    hasCanonical: !!canonical,
    hasDescription: !!description,
  });
  const summarizability_score = scoreSummarizability(html);
  const ai_findability_score = scoreFindability(crawlability_score, summarizability_score, og);

  // Insert scan row
  const { data: scan, error: scanErr } = await supabase
    .from("scans")
    .insert({
      site_id: siteId,
      metadata,
      schema_data: jsonLd as unknown as Json,
      performance,
      crawlability_score,
      summarizability_score,
      ai_findability_score,
    })
    .select("*")
    .maybeSingle();

  if (scanErr) return jsonResponse({ error: scanErr.message }, 500);
  if (!scan) return jsonResponse({ error: "Failed to create scan" }, 500);

  // Increment usage_metrics.scan_count (create if missing)
  const { data: usage, error: usageErr } = await supabase
    .from("usage_metrics")
    .select("scan_count")
    .eq("user_id", user.id)
    .maybeSingle();
  if (usageErr) return jsonResponse({ error: usageErr.message }, 500);

  if (!usage) {
    const { error: insUsageErr } = await supabase
      .from("usage_metrics")
      .insert({ user_id: user.id, scan_count: 1 });
    if (insUsageErr) return jsonResponse({ error: insUsageErr.message }, 500);
  } else {
    const { error: updErr } = await supabase
      .from("usage_metrics")
      .update({ scan_count: (usage.scan_count as number) + 1 })
      .eq("user_id", user.id);
    if (updErr) return jsonResponse({ error: updErr.message }, 500);
  }

  return jsonResponse({ scan, details: { metadata, performance } }, 200);
});