import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceLimit } from "../_shared/limits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
  });
}

function normalizeDomain(input: string): string | null {
  try {
    const hasProtocol = /^https?:\/\//i.test(input);
    const u = new URL(hasProtocol ? input : `https://${input}`);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch (_) {
    return null;
  }
}

function extractMeta(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().slice(0, 300) : null;

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim().slice(0, 500) : null;

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim().slice(0, 300) : null;

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim().slice(0, 500) : null;

  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;

  const schemaBlocks: any[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      schemaBlocks.push(parsed);
    } catch (_) {
      // ignore invalid blocks
    }
  }

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    canonical,
    schemaBlocks,
  };
}

function computeScore(meta: ReturnType<typeof extractMeta>): number {
  let score = 0;
  if (meta.title) score += 20;
  if (meta.description) score += 20;
  if (meta.ogTitle) score += 10;
  if (meta.ogDescription) score += 10;
  if (meta.canonical) score += 10;
  if (meta.schemaBlocks.length > 0) score += 30;
  return Math.max(0, Math.min(100, score));
}

async function createSnapshotForDomain(supabase: any, competitorId: string, domain: string) {
  const url = `https://${domain}`;
  let html = "";
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "FindableAI/1.0" } });
    html = await res.text();
  } catch (e) {
    console.error("fetch competitor page failed", domain, e);
    html = "";
  }

  const meta = extractMeta(html);
  const score = computeScore(meta);

  const metadata = {
    title: meta.title,
    description: meta.description,
    og: { title: meta.ogTitle, description: meta.ogDescription },
    canonical: meta.canonical,
    url,
  };

  const schema_data = meta.schemaBlocks;

  const { error: snapErr } = await supabase
    .from("competitor_snapshots")
    .insert({ competitor_id: competitorId, ai_findability_score: score, metadata, schema_data });

  if (snapErr) console.error("insert competitor_snapshot error", snapErr);

  return { score };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Missing Supabase env" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return jsonResponse({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "list");

    if (action === "add") {
      const domainRaw: string | undefined = body?.domain;
      const notes: string | undefined = body?.notes;
      const norm = domainRaw ? normalizeDomain(domainRaw) : null;
      if (!norm) {
        return jsonResponse({ error: "Invalid domain" }, { status: 400 });
      }

      // Enforce competitor quota using limits helper
      const limitResult = await enforceLimit(user.id, 'competitor_add', authHeader);
      if (!limitResult.success) {
        return limitResult.response;
      }

      // Insert competitor
      const { data: compRow, error: insErr } = await supabase
        .from("competitors")
        .insert({ user_id: user.id, domain: norm, notes: notes ?? null })
        .select("id, domain, notes, created_at")
        .single();

      if (insErr) {
        console.error("insert competitor error", insErr);
        return jsonResponse({ error: "Failed to add competitor" }, { status: 500 });
      }

      // Create snapshot (best-effort)
      const snapshot = await createSnapshotForDomain(supabase, compRow.id, compRow.domain);

      // Increment usage competitor_count if we track it as count of active competitors
      const { data: usageRow } = await supabase
        .from("usage_metrics")
        .select("competitor_count")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!usageRow) {
        const { error: insUsageErr } = await supabase
          .from("usage_metrics")
          .insert({ user_id: user.id, competitor_count: 1 });
        if (insUsageErr) console.error("usage_metrics insert error", insUsageErr);
      } else {
        const { error: updErr } = await supabase
          .from("usage_metrics")
          .update({ competitor_count: (usageRow.competitor_count ?? 0) + 1 })
          .eq("user_id", user.id);
        if (updErr) console.error("usage_metrics update error", updErr);
      }

      return jsonResponse({
        competitor: compRow,
        latestSnapshot: { score: snapshot.score },
      });
    }

    if (action === "delete") {
      const id: string | undefined = body?.id;
      if (!id) return jsonResponse({ error: "Missing id" }, { status: 400 });

      const { error: delErr } = await supabase.from("competitors").delete().eq("id", id);
      if (delErr) {
        console.error("delete competitor error", delErr);
        return jsonResponse({ error: "Failed to delete competitor" }, { status: 500 });
      }

      // Note: We do not decrement usage_metrics.competitor_count due to RLS non-decreasing policy.
      // Deleting a competitor only removes the record; usage metrics reflect historical usage.


      return jsonResponse({ success: true });
    }

    // action === "list" (default)
    // Load competitors
    const { data: competitors, error: listErr } = await supabase
      .from("competitors")
      .select("id, domain, notes, created_at")
      .order("created_at", { ascending: true });
    if (listErr) {
      console.error("list competitors error", listErr);
      return jsonResponse({ error: "Failed to load competitors" }, { status: 500 });
    }

    // Load latest snapshots for all
    const { data: snaps, error: snapListErr } = await supabase
      .from("competitor_snapshots")
      .select("competitor_id, ai_findability_score, snapshot_date")
      .order("snapshot_date", { ascending: false });
    if (snapListErr) {
      console.error("list snapshots error", snapListErr);
      return jsonResponse({ error: "Failed to load snapshots" }, { status: 500 });
    }

    const latestByCompetitor = new Map<string, { score: number | null; snapshot_date: string }>();
    for (const s of snaps || []) {
      if (!latestByCompetitor.has(s.competitor_id)) {
        latestByCompetitor.set(s.competitor_id, {
          score: s.ai_findability_score ?? null,
          snapshot_date: s.snapshot_date,
        });
      }
    }

    // Compute user's baseline score (average latest per site)
    const { data: sites, error: sitesErr } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id);
    let userBaseline: number | null = null;
    if (!sitesErr && sites && sites.length > 0) {
      const siteIds = sites.map((s: any) => s.id);
      const { data: scans, error: scansErr } = await supabase
        .from("scans")
        .select("site_id, ai_findability_score, scan_date")
        .in("site_id", siteIds)
        .order("scan_date", { ascending: false });
      if (!scansErr && scans) {
        const firstPerSite = new Map<string, number>();
        for (const sc of scans) {
          if (!firstPerSite.has(sc.site_id) && typeof sc.ai_findability_score === "number") {
            firstPerSite.set(sc.site_id, sc.ai_findability_score);
          }
        }
        const vals = Array.from(firstPerSite.values());
        if (vals.length > 0) {
          userBaseline = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }
    }

    const items = (competitors || []).map((c: any) => {
      const latest = latestByCompetitor.get(c.id) || null;
      const score = latest?.score ?? null;
      const delta = userBaseline != null && score != null ? score - userBaseline : null;
      return {
        id: c.id,
        domain: c.domain,
        notes: c.notes,
        created_at: c.created_at,
        latestSnapshot: latest,
        comparison: { userBaseline, delta },
      };
    });

    return jsonResponse({ items });
  } catch (e) {
    console.error("competitors function unhandled", e);
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
});
