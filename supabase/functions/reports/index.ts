import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
  });
}

function wrapText(text: string, maxChars = 90): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function ensureReportsBucket(admin: any) {
  try {
    const { data } = await admin.storage.getBucket("reports");
    if (!data) {
      await admin.storage.createBucket("reports", { public: true });
    }
  } catch (_) {
    // try create blindly
    await admin.storage.createBucket("reports", { public: true }).catch(() => {});
  }
}

async function generatePdf(options: {
  siteUrl: string;
  scan: any | null;
  tips: any[];
  prompts: any[];
  competitors: { domain: string; score: number | null }[];
  generatedAt: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  let y = page.getHeight() - margin;

  function drawText(txt: string, size = 12, bold = false) {
    const usedFont = bold ? fontBold : font;
    const lines = wrapText(txt, 95);
    for (const l of lines) {
      if (y < margin + 40) {
        // new page
        const p = pdfDoc.addPage([595.28, 841.89]);
        y = p.getHeight() - margin;
      }
      const p = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
      p.drawText(l, { x: margin, y, size, font: usedFont, color: rgb(0, 0, 0) });
      y -= size + 6;
    }
  }

  // Header
  drawText("FindableAI – Report", 18, true);
  drawText(`Site: ${options.siteUrl}`, 12);
  drawText(`Generated: ${options.generatedAt}`, 12);
  y -= 8;

  // Scan
  drawText("Scan Summary", 14, true);
  if (options.scan) {
    drawText(`Findability Score: ${options.scan.ai_findability_score ?? 'N/A'}`);
    drawText(`Crawlability: ${options.scan.crawlability_score ?? 'N/A'}`);
    drawText(`Summarizability: ${options.scan.summarizability_score ?? 'N/A'}`);
  } else {
    drawText("No scans available.");
  }
  y -= 6;

  // Tips
  drawText("Optimization Tips", 14, true);
  if (options.tips.length > 0) {
    for (const t of options.tips.slice(0, 10)) {
      drawText(`• ${t.title} [${t.severity}] - ${t.status}`);
      if (t.description) drawText(`  ${t.description}`);
    }
  } else {
    drawText("No tips available.");
  }
  y -= 6;

  // Prompts
  drawText("Prompt Simulations", 14, true);
  if (options.prompts.length > 0) {
    for (const p of options.prompts.slice(0, 5)) {
      const s = p.result?.summary || "";
      drawText(`• Mentioned site: ${p.includes_user_site ? 'Yes' : 'No'}`);
      if (p.result?.competitorHits?.length) drawText(`  Competitors: ${p.result.competitorHits.join(', ')}`);
      if (s) drawText(`  Summary: ${s}`);
    }
  } else {
    drawText("No prompt simulations available.");
  }
  y -= 6;

  // Competitors
  drawText("Competitor Comparison", 14, true);
  if (options.competitors.length > 0) {
    for (const c of options.competitors.slice(0, 10)) {
      drawText(`• ${c.domain} – Score: ${c.score ?? 'N/A'}`);
    }
  } else {
    drawText("No competitors added.");
  }

  const bytes = await pdfDoc.save();
  return bytes;
}

async function buildReportForUserSite(userClient: any, adminClient: any, userId: string, siteId?: string | null) {
  // Resolve site
  let site: any | null = null;
  if (siteId) {
    const { data } = await userClient.from("sites").select("id,url").eq("id", siteId).maybeSingle();
    site = data || null;
  }
  if (!site) {
    const { data: sites } = await userClient.from("sites").select("id,url").eq("user_id", userId).limit(1);
    site = (sites && sites[0]) || null;
  }
  if (!site) return { error: "No site found" } as const;

  // Latest scan
  const { data: scan } = await userClient
    .from("scans")
    .select("id, ai_findability_score, crawlability_score, summarizability_score, scan_date")
    .eq("site_id", site.id)
    .order("scan_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Tips for that scan
  let tips: any[] = [];
  if (scan?.id) {
    const { data } = await userClient
      .from("tips")
      .select("title, description, severity, status")
      .eq("scan_id", scan.id);
    tips = data || [];
  }

  // Recent prompts
  const { data: prompts } = await userClient
    .from("prompt_simulations")
    .select("includes_user_site, result")
    .eq("user_id", userId)
    .order("run_date", { ascending: false })
    .limit(10);

  // Competitor latest scores
  const { data: comps } = await userClient.from("competitors").select("id,domain");
  let competitorsSumm: { domain: string; score: number | null }[] = [];
  if (comps && comps.length) {
    const { data: snaps } = await userClient
      .from("competitor_snapshots")
      .select("competitor_id, ai_findability_score, snapshot_date")
      .in("competitor_id", comps.map((c: any) => c.id))
      .order("snapshot_date", { ascending: false });
    const latest = new Map<string, number | null>();
    for (const s of snaps || []) {
      if (!latest.has(s.competitor_id)) latest.set(s.competitor_id, s.ai_findability_score ?? null);
    }
    competitorsSumm = comps.map((c: any) => ({ domain: c.domain, score: latest.get(c.id) ?? null }));
  }

  // Generate PDF
  const bytes = await generatePdf({
    siteUrl: site.url,
    scan: scan || null,
    tips,
    prompts: prompts || [],
    competitors: competitorsSumm,
    generatedAt: new Date().toISOString(),
  });

  await ensureReportsBucket(adminClient);
  const reportId = crypto.randomUUID();
  const path = `${userId}/${reportId}.pdf`;
  const { error: upErr } = await adminClient.storage.from("reports").upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) return { error: "upload_failed", details: upErr.message } as const;

  const { data: pub } = adminClient.storage.from("reports").getPublicUrl(path);
  const url = pub?.publicUrl || null;

  // Insert into reports table (user client respects RLS)
  const now = new Date();
  const period_start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const period_end = now.toISOString().slice(0, 10);
  const { data: row, error: repErr } = await userClient
    .from("reports")
    .insert({ user_id: userId, site_id: site.id, period_start, period_end, pdf_url: url })
    .select("id")
    .single();
  if (repErr) return { error: "insert_failed", details: repErr.message } as const;

  return { id: row.id, url } as const;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey) return jsonResponse({ error: "Missing Supabase env" }, { status: 500 });

  const authHeader = req.headers.get("Authorization") ?? "";
  const isCron = req.headers.get("x-cron") === "1";

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(supabaseUrl, serviceKey || anonKey);

  try {
    if (req.method === "GET") {
      // GET /reports?id=...
      const urlObj = new URL(req.url);
      const id = urlObj.searchParams.get("id");
      if (!id) return jsonResponse({ error: "Missing id" }, { status: 400 });

      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return jsonResponse({ error: "Not authenticated" }, { status: 401 });

      const { data, error } = await userClient
        .from("reports")
        .select("id, user_id, site_id, period_start, period_end, pdf_url, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) return jsonResponse({ error: "Failed to load report" }, { status: 500 });
      if (!data) return jsonResponse({ error: "Not found" }, { status: 404 });
      return jsonResponse({ report: data });
    }

    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "generate");

    if (action === "generate") {
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) return jsonResponse({ error: "Not authenticated" }, { status: 401 });

      const siteId: string | undefined = body?.siteId;
      const res = await buildReportForUserSite(userClient, adminClient, user.id, siteId);
      if ((res as any).error) return jsonResponse(res, { status: 500 });
      return jsonResponse(res);
    }

    if (action === "cron" && isCron) {
      // Monthly cron: iterate all users with at least one site
      const { data: profiles, error: profErr } = await adminClient.from("profiles").select("id");
      if (profErr) return jsonResponse({ error: "profiles_failed" }, { status: 500 });

      const results: any[] = [];
      for (const p of profiles || []) {
        try {
          // Impersonate user by generating a JWT? Not available here; use admin to read data, but insert requires RLS.
          // Workaround: build report using admin for reads and also admin for insert (service role bypasses RLS).
          // We will create a lightweight userClientAdmin that uses service key for both read and write.
          const res = await buildReportForUserSite(adminClient, adminClient, p.id, undefined);
          results.push({ user: p.id, ok: !(res as any).error });
        } catch (e) {
          results.push({ user: p.id, ok: false, error: String(e) });
        }
      }
      return jsonResponse({ success: true, generated: results.length });
    }

    return jsonResponse({ error: "Bad action" }, { status: 400 });
  } catch (e) {
    console.error("reports function error", e);
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
});
