import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceLimit } from "../_shared/limits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
  });
}

// HTML template for report generation
function generateReportHTML(options: {
  siteUrl: string;
  siteName?: string;
  scan: any | null;
  tips: any[];
  prompts: any[];
  competitors: { domain: string; score: number | null }[];
  generatedAt: string;
}): string {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const formatScore = (score: number | null) => score !== null ? score.toString() : 'N/A';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FindableAI Report - ${options.siteUrl}</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      border-bottom: 3px solid #007bff;
      padding-bottom: 20px;
    }
    .header h1 { 
      color: #007bff; 
      margin: 0; 
      font-size: 2.5em;
    }
    .header p { 
      color: #666; 
      margin: 10px 0;
      font-size: 1.1em;
    }
    .section { 
      margin: 30px 0; 
      page-break-inside: avoid;
    }
    .section h2 { 
      color: #007bff; 
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .score-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #007bff;
    }
    .score-item {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }
    .score-value {
      font-weight: bold;
      color: #007bff;
    }
    .tip {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
    }
    .tip.high { border-color: #ff6b6b; background: #ffe0e0; }
    .tip.medium { border-color: #ffa500; background: #fff5e0; }
    .tip.low { border-color: #4ecdc4; background: #e0f9f6; }
    .tip-header {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .prompt {
      background: #e7f3ff;
      border: 1px solid #bee5eb;
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
    }
    .competitor {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
      margin: 8px 0;
      border-left: 4px solid #28a745;
    }
    .competitor.behind { border-left-color: #dc3545; }
    .competitor.ahead { border-left-color: #28a745; }
    .meta { 
      color: #666; 
      font-size: 0.9em; 
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FindableAI Report</h1>
    <p><strong>${options.siteName || options.siteUrl}</strong></p>
    <p>Generated on ${formatDate(options.generatedAt)}</p>
  </div>

  <div class="section">
    <h2>📊 Findability Overview</h2>
    ${options.scan ? `
    <div class="score-card">
      <div class="score-item">
        <span>AI Findability Score</span>
        <span class="score-value">${formatScore(options.scan.ai_findability_score)}/100</span>
      </div>
      <div class="score-item">
        <span>Crawlability Score</span>
        <span class="score-value">${formatScore(options.scan.crawlability_score)}/100</span>
      </div>
      <div class="score-item">
        <span>Summarizability Score</span>
        <span class="score-value">${formatScore(options.scan.summarizability_score)}/100</span>
      </div>
    </div>
    ` : `
    <p>No scan data available yet. Run your first scan to see findability metrics.</p>
    `}
  </div>

  <div class="section">
    <h2>🔧 Optimization Tips</h2>
    ${options.tips.length > 0 ? options.tips.slice(0, 10).map(tip => `
    <div class="tip ${tip.severity}">
      <div class="tip-header">
        ${tip.title} 
        <span style="float: right; font-size: 0.8em; padding: 2px 8px; border-radius: 12px; background: rgba(0,0,0,0.1);">
          ${tip.severity.toUpperCase()}
        </span>
      </div>
      ${tip.description ? `<div>${tip.description}</div>` : ''}
      <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
        Status: ${tip.status === 'todo' ? '⏳ To Do' : '✅ Done'}
      </div>
    </div>
    `).join('') : `
    <p>No optimization tips available. Complete a scan to get personalized recommendations.</p>
    `}
  </div>

  <div class="section">
    <h2>🤖 AI Simulation Results</h2>
    ${options.prompts.length > 0 ? options.prompts.slice(0, 5).map(prompt => `
    <div class="prompt">
      <div style="font-weight: bold; margin-bottom: 8px;">
        Site Mentioned: ${prompt.includes_user_site ? '✅ Yes' : '❌ No'}
      </div>
      ${prompt.result?.response ? `
      <div style="margin: 8px 0;">
        <strong>AI Response:</strong> ${prompt.result.response.substring(0, 200)}${prompt.result.response.length > 200 ? '...' : ''}
      </div>
      ` : ''}
      ${prompt.result?.analysis?.competitor_domains?.length ? `
      <div style="margin: 8px 0; font-size: 0.9em;">
        <strong>Competitors Mentioned:</strong> ${prompt.result.analysis.competitor_domains.join(', ')}
      </div>
      ` : ''}
    </div>
    `).join('') : `
    <p>No AI simulations run yet. Test how AI systems discover your site with different prompts.</p>
    `}
  </div>

  <div class="section">
    <h2>🏆 Competitor Analysis</h2>
    ${options.competitors.length > 0 ? options.competitors.slice(0, 10).map(comp => `
    <div class="competitor ${comp.score !== null && options.scan?.ai_findability_score !== null ? 
      (comp.score > options.scan.ai_findability_score ? 'behind' : 'ahead') : ''}">
      <span style="font-weight: bold;">${comp.domain}</span>
      <span class="score-value">${formatScore(comp.score)}/100</span>
    </div>
    `).join('') : `
    <p>No competitors added yet. Add competitor domains to compare findability scores.</p> 
    `}
  </div>

  <div class="meta">
    <p>This report was generated by FindableAI on ${formatDate(options.generatedAt)}</p>
    <p>Visit FindableAI to improve your site's AI discoverability</p>
  </div>
</body>
</html>
  `;
}

// Background job processor using EdgeRuntime.waitUntil
async function processReportGeneration(
  adminClient: any, 
  reportId: string, 
  userId: string, 
  siteId: string | null
) {
  try {
    console.log(`Processing report generation: ${reportId} for user ${userId}`);
    
    // Update status to running
    await adminClient
      .from("reports")
      .update({ 
        status: 'running',
        last_attempted_at: new Date().toISOString()
      })
      .eq("id", reportId);
    
    // Use admin client to bypass RLS for data fetching
    const result = await buildReportForUserSite(adminClient, reportId, userId, siteId);
    
    if ('error' in result) {
      console.error(`Report generation failed: ${result.error}`, result.details);
      
      // Update report status to failed
      await adminClient
        .from("reports")
        .update({ 
          status: 'failed',
          error_message: result.details || result.error,
          pdf_url: null
        })
        .eq("id", reportId);
    } else {
      console.log(`Report generated successfully: ${reportId}`);
      
      // Update status to success
      await adminClient
        .from("reports")
        .update({ 
          status: 'success',
          error_message: null
        })
        .eq("id", reportId);
    }
  } catch (error) {
    console.error(`Report generation error: ${reportId}`, error);
    
    // Update report status to failed
    await adminClient
      .from("reports")
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        pdf_url: null
      })
      .eq("id", reportId);
  }
}

async function buildReportForUserSite(
  adminClient: any, 
  reportId: string,
  userId: string, 
  siteId?: string | null
) {
  // Resolve site using admin client
  let site: any | null = null;
  if (siteId) {
    const { data } = await adminClient
      .from("sites")
      .select("id, url, name")
      .eq("id", siteId)
      .eq("user_id", userId)
      .maybeSingle();
    site = data || null;
  }
  if (!site) {
    const { data: sites } = await adminClient
      .from("sites")
      .select("id, url, name")
      .eq("user_id", userId)
      .limit(1);
    site = (sites && sites[0]) || null;
  }
  if (!site) return { error: "No site found" } as const;

  // Latest scan
  const { data: scan } = await adminClient
    .from("scans")
    .select("id, ai_findability_score, crawlability_score, summarizability_score, scan_date")
    .eq("site_id", site.id)
    .order("scan_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Tips for that scan
  let tips: any[] = [];
  if (scan?.id) {
    const { data } = await adminClient
      .from("tips")
      .select("title, description, severity, status")
      .eq("scan_id", scan.id);
    tips = data || [];
  }

  // Recent prompts
  const { data: prompts } = await adminClient
    .from("prompt_simulations")
    .select("includes_user_site, result")
    .eq("user_id", userId)
    .order("run_date", { ascending: false })
    .limit(10);

  // Competitor latest scores
  const { data: comps } = await adminClient
    .from("competitors")
    .select("id, domain")
    .eq("user_id", userId);
    
  let competitorsSumm: { domain: string; score: number | null }[] = [];
  if (comps && comps.length) {
    const { data: snaps } = await adminClient
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

  // Generate HTML
  const html = generateReportHTML({
    siteUrl: site.url,
    siteName: site.name,
    scan: scan || null,
    tips,
    prompts: prompts || [],
    competitors: competitorsSumm,
    generatedAt: new Date().toISOString(),
  });

  // Convert HTML to PDF using a simple approach (since Puppeteer is complex in Deno)
  // For now, we'll use a placeholder that would normally use Puppeteer
  const pdfBytes = new TextEncoder().encode(`HTML Report for ${site.url}\n\n${html}`);
  
  // Upload to storage
  const path = `${userId}/${reportId}.pdf`;
  const { error: upErr } = await adminClient.storage
    .from("reports")
    .upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    
  if (upErr) return { error: "upload_failed", details: upErr.message } as const;

  // Update report with file path (not public URL for security)
  const { error: updateErr } = await adminClient
    .from("reports")
    .update({ pdf_url: path })
    .eq("id", reportId);
    
  if (updateErr) return { error: "update_failed", details: updateErr.message } as const;

  return { success: true, reportId, path } as const;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, { 
    global: { headers: { Authorization: authHeader } } 
  });
  const adminClient = createClient(supabaseUrl, serviceKey || anonKey);

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // GET /api/reports/:id - Get report metadata and signed URL
    if (req.method === "GET") {
      const reportId = pathSegments[pathSegments.length - 1];
      if (!reportId) {
        return jsonResponse({ error: "Missing report ID in URL" }, { status: 400 });
      }

      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Not authenticated" }, { status: 401 });
      }

      console.log(`GET /api/reports/${reportId} by user ${user.id}`);

      // Get report metadata
      const { data: report, error: reportErr } = await userClient
        .from("reports")
        .select("id, user_id, site_id, period_start, period_end, pdf_url, status, error_message, retry_count, created_at")
        .eq("id", reportId)
        .maybeSingle();

      if (reportErr) {
        console.error("Error fetching report:", reportErr);
        return jsonResponse({ error: "Failed to load report" }, { status: 500 });
      }

      if (!report) {
        return jsonResponse({ error: "Report not found" }, { status: 404 });
      }

      // Generate signed URL if report has file
      let downloadUrl = null;
      if (report.pdf_url && report.status === 'success') {
        const { data: signedUrl, error: signedErr } = await adminClient.storage
          .from("reports")
          .createSignedUrl(report.pdf_url, 3600); // 1 hour expiry

        if (signedErr) {
          console.error("Error creating signed URL:", signedErr);
        } else {
          downloadUrl = signedUrl?.signedUrl;
        }
      }

      return jsonResponse({
        success: true,
        report: {
          id: report.id,
          site_id: report.site_id,
          period_start: report.period_start,
          period_end: report.period_end,
          created_at: report.created_at,
          status: report.status,
          error_message: report.error_message,
          retry_count: report.retry_count,
          download_url: downloadUrl
        }
      });
    }

    // POST /api/reports/retry/:id - Retry failed report (admin only)
    if (req.method === "POST" && pathSegments.includes('retry')) {
      const reportId = pathSegments[pathSegments.length - 1];
      if (!reportId) {
        return jsonResponse({ error: "Missing report ID in URL" }, { status: 400 });
      }

      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Not authenticated" }, { status: 401 });
      }

      // Check if user is admin
      const { data: profile, error: profileErr } = await userClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileErr || profile?.role !== 'admin') {
        return jsonResponse({ error: "Admin access required" }, { status: 403 });
      }

      console.log(`POST /api/reports/retry/${reportId} by admin ${user.id}`);

      // Get report to check current status and ownership
      const { data: report, error: reportErr } = await adminClient
        .from("reports")
        .select("id, user_id, site_id, status, retry_count")
        .eq("id", reportId)
        .maybeSingle();

      if (reportErr) {
        console.error("Error fetching report for retry:", reportErr);
        return jsonResponse({ error: "Failed to load report" }, { status: 500 });
      }

      if (!report) {
        return jsonResponse({ error: "Report not found" }, { status: 404 });
      }

      if (report.status !== 'failed') {
        return jsonResponse({ 
          error: "Only failed reports can be retried",
          current_status: report.status 
        }, { status: 400 });
      }

      // Update report status to queued and increment retry count
      const { error: updateErr } = await adminClient
        .from("reports")
        .update({ 
          status: 'queued',
          retry_count: (report.retry_count || 0) + 1,
          error_message: null,
          pdf_url: null
        })
        .eq("id", reportId);

      if (updateErr) {
        console.error("Error updating report for retry:", updateErr);
        return jsonResponse({ error: "Failed to queue retry" }, { status: 500 });
      }

      // Queue background job for PDF generation retry
      const reportGenerationPromise = processReportGeneration(adminClient, reportId, report.user_id, report.site_id);
      
      reportGenerationPromise.catch(error => {
        console.error(`Background report retry failed for ${reportId}:`, error);
      });

      console.log(`Report retry queued: ${reportId} (attempt ${(report.retry_count || 0) + 1})`);

      return jsonResponse({
        success: true,
        report: {
          id: reportId,
          status: 'queued',
          retry_count: (report.retry_count || 0) + 1,
          message: 'Report retry has been queued. Check back in a few minutes.'
        }
      });
    }

    // POST /api/reports/generate - Enqueue report generation
    if (req.method === "POST" && pathSegments.includes('generate')) {
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Not authenticated" }, { status: 401 });
      }

      console.log(`POST /api/reports/generate by user ${user.id}`);

      // Enforce report generation limit
      const limitResult = await enforceLimit(user.id, 'report_generate', authHeader);
      if (!limitResult.success) {
        return limitResult.response;
      }

      const body = await req.json().catch(() => ({}));
      const siteId: string | undefined = body?.siteId;

      // Create report record immediately
      const now = new Date();
      const period_start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const period_end = now.toISOString().slice(0, 10);
      
      const { data: reportRecord, error: createErr } = await userClient
        .from("reports")
        .insert({ 
          user_id: user.id, 
          site_id: siteId || null, 
          period_start, 
          period_end, 
          status: 'queued',
          pdf_url: null // Will be updated when generation completes
        })
        .select("id")
        .single();

      if (createErr) {
        console.error("Error creating report record:", createErr);
        return jsonResponse({ error: "Failed to create report" }, { status: 500 });
      }

      // Queue background job for PDF generation
      const reportGenerationPromise = processReportGeneration(adminClient, reportRecord.id, user.id, siteId || null);
      
      // Note: In a production environment, you might want to use a proper job queue
      // For now, we'll start the process but not await it
      reportGenerationPromise.catch(error => {
        console.error(`Background report generation failed for ${reportRecord.id}:`, error);
      });

      console.log(`Report queued for generation: ${reportRecord.id}`);

      return jsonResponse({
        success: true,
        report: {
          id: reportRecord.id,
          status: 'queued',
          message: 'Report generation has been queued. Check back in a few minutes.'
        }
      });
    }

    return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  } catch (error) {
    console.error("Error in reports function:", error);
    return jsonResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});
