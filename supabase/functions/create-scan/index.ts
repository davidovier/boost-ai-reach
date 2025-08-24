import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceLimit } from "../_shared/limits.ts";
import { validateUrl, getBaseDomain } from "../_shared/url-validator.ts";
import { extractMetadata, checkRobotsTxt, checkSitemap, ScanResult } from "../_shared/metadata-extractor.ts";
import { logEvent, extractRequestMetadata } from "../_shared/event-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Missing Supabase environment configuration" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });

  // Authenticate user
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  console.log("create-scan invoked by user:", user.id);

  try {
    // Parse and validate input
    const body = await req.json();
    const { siteId, url } = body;
    
    let pageUrl: string;
    let targetSiteId: string;

    if (siteId) {
      // Get site URL from existing site
      const { data: site, error: siteErr } = await supabase
        .from("sites")
        .select("id, url")
        .eq("id", siteId)
        .eq("user_id", user.id)
        .single();
      
      if (siteErr || !site) {
        return jsonResponse({ error: "Site not found or not owned by user" }, 404);
      }
      
      pageUrl = site.url;
      targetSiteId = site.id;
    } else if (url) {
      // Validate and normalize the URL with SSRF protection
      const validation = validateUrl(url);
      if (!validation.valid) {
        return jsonResponse({ 
          error: "Invalid URL", 
          details: validation.error 
        }, 400);
      }
      
      pageUrl = validation.normalizedUrl!;
      
      // Find or create site
      const { data: existing, error: exErr } = await supabase
        .from("sites")
        .select("id")
        .eq("user_id", user.id)
        .eq("url", pageUrl)
        .maybeSingle();
        
      if (exErr) return jsonResponse({ error: exErr.message }, 500);

      if (existing?.id) {
        targetSiteId = existing.id as string;
      } else {
        // Enforce 'sites' limit when creating new site  
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
        targetSiteId = newSite.id as string;

        // Log site created event
        const requestMetadata = extractRequestMetadata(req);
        await logEvent(supabase, user.id, 'site_created', {
          ...requestMetadata,
          site_id: targetSiteId,
          url: pageUrl,
          name: name
        });
      }
    } else {
      return jsonResponse({ error: "Either 'siteId' or 'url' must be provided" }, 400);
    }

    // Enforce scan limit
    const limitResult = await enforceLimit(user.id, 'scan', authHeader);
    if (!limitResult.success) {
      return limitResult.response;
    }

    console.log("Starting comprehensive scan for:", pageUrl);
    
    // Perform the comprehensive scan
    const scanStartTime = Date.now();
    let scanData: ScanResult;
    
    try {
      // Fetch the webpage
      const response = await fetch(pageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'FindableAI-Scanner/1.0 (SEO Analysis Tool)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
      });
      
      if (!response.ok) {
        return jsonResponse({ 
          error: "Failed to fetch webpage", 
          details: `HTTP ${response.status}: ${response.statusText}` 
        }, 400);
      }
      
      const html = await response.text();
      const scanEndTime = Date.now();
      const baseDomain = getBaseDomain(pageUrl);
      
      // Extract metadata from HTML
      const metadata = extractMetadata(html, pageUrl);
      
      // Check robots.txt and sitemap in parallel for efficiency
      const [robotsTxt, sitemap] = await Promise.all([
        checkRobotsTxt(baseDomain),
        checkSitemap(baseDomain)
      ]);
      
      scanData = {
        url: pageUrl,
        metadata,
        robotsTxt,
        sitemap,
        performance: {
          loadTime: scanEndTime - scanStartTime,
          statusCode: response.status,
          contentLength: html.length
        },
        timestamp: new Date().toISOString()
      };
      
      console.log("Scan data collected:", {
        url: pageUrl,
        titleFound: !!metadata.title,
        descriptionFound: !!metadata.description,
        schemaCount: metadata.schema?.length || 0,
        robotsExists: robotsTxt.exists,
        sitemapExists: sitemap.exists
      });
      
    } catch (error) {
      console.error("Error during scan:", error);
      return jsonResponse({ 
        error: "Scan failed", 
        details: error instanceof Error ? error.message : String(error) 
      }, 500);
    }

    // Calculate AI Findability Score
    const findabilityScore = calculateFindabilityScore(scanData);
    
    // Save scan to database
    const { data: scanRecord, error: scanErr } = await supabase
      .from("scans")
      .insert({
        site_id: targetSiteId,
        metadata: {
          title: scanData.metadata.title,
          description: scanData.metadata.description,
          canonical: scanData.metadata.canonical,
          og_title: scanData.metadata.ogTitle,
          og_description: scanData.metadata.ogDescription,
          og_image: scanData.metadata.ogImage,
          robots_directives: scanData.metadata.robotsDirectives,
          robots_txt_exists: scanData.robotsTxt?.exists,
          sitemap_exists: scanData.sitemap?.exists,
          sitemap_url: scanData.sitemap?.url
        },
        schema_data: { 
          schemas: scanData.metadata.schema || [],
          count: scanData.metadata.schema?.length || 0
        },
        performance: {
          load_time: scanData.performance.loadTime,
          status_code: scanData.performance.statusCode,
          content_length: scanData.performance.contentLength
        },
        crawlability_score: calculateCrawlabilityScore(scanData),
        summarizability_score: calculateSummarizabilityScore(scanData),
        ai_findability_score: findabilityScore
      })
      .select()
      .single();

    if (scanErr) {
      console.error("Error saving scan:", scanErr);
      return jsonResponse({ error: "Failed to save scan results", details: scanErr.message }, 500);
    }

    // Generate actionable tips based on scan results
    const tips = generateScanTips(scanData, findabilityScore);
    
    // Save tips to database
    if (tips.length > 0) {
      const { error: tipsErr } = await supabase.from("tips").insert(
        tips.map(tip => ({
          scan_id: scanRecord.id,
          title: tip.title,
          description: tip.description,
          severity: tip.severity
        }))
      );
      
      if (tipsErr) {
        console.warn("Failed to save tips:", tipsErr);
      }
    }

    // Update usage metrics
    const { error: usageErr } = await supabase
      .from("usage_metrics")
      .update({ scan_count: supabase.raw("scan_count + 1") })
      .eq("user_id", user.id);
    
    if (usageErr) {
      console.warn("Failed to update usage metrics:", usageErr);
    }

    // Log scan completed event
    const requestMetadata = extractRequestMetadata(req);
    await logEvent(supabase, user.id, 'scan_completed', {
      ...requestMetadata,
      scan_id: scanRecord.id,
      site_id: targetSiteId,
      url: pageUrl,
      ai_findability_score: findabilityScore,
      crawlability_score: calculateCrawlabilityScore(scanData),
      summarizability_score: calculateSummarizabilityScore(scanData),
      tips_generated: tips.length,
      scan_duration: Date.now() - scanStartTime
    });

    console.log("Scan completed successfully:", scanRecord.id);

    // Return normalized scan result
    return jsonResponse({
      success: true,
      scan: {
        id: scanRecord.id,
        url: pageUrl,
        ai_findability_score: findabilityScore,
        metadata: {
          title: scanData.metadata.title,
          description: scanData.metadata.description,
          canonical: scanData.metadata.canonical,
          open_graph: {
            title: scanData.metadata.ogTitle,
            description: scanData.metadata.ogDescription,
            image: scanData.metadata.ogImage,
            url: scanData.metadata.ogUrl,
            type: scanData.metadata.ogType
          },
          twitter: {
            card: scanData.metadata.twitterCard,
            title: scanData.metadata.twitterTitle,
            description: scanData.metadata.twitterDescription,
            image: scanData.metadata.twitterImage
          },
          robots_directives: scanData.metadata.robotsDirectives
        },
        schema: scanData.metadata.schema || [],
        robots_txt: {
          exists: scanData.robotsTxt?.exists || false,
          accessible: !scanData.robotsTxt?.error,
          error: scanData.robotsTxt?.error
        },
        sitemap: {
          exists: scanData.sitemap?.exists || false,
          url: scanData.sitemap?.url,
          error: scanData.sitemap?.error
        },
        performance: scanData.performance,
        scores: {
          ai_findability: findabilityScore,
          crawlability: calculateCrawlabilityScore(scanData),
          summarizability: calculateSummarizabilityScore(scanData)
        },
        scan_date: scanRecord.scan_date,
        tips_count: tips.length
      }
    });
  } catch (error) {
    console.error("Error in create-scan function:", error);
    return jsonResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

/**
 * Calculate AI Findability Score based on scan data
 */
function calculateFindabilityScore(scanData: ScanResult): number {
  let score = 0;
  const { metadata } = scanData;
  
  // Title (20 points)
  if (metadata.title) {
    if (metadata.title.length >= 10 && metadata.title.length <= 60) {
      score += 20;
    } else {
      score += 10;
    }
  }
  
  // Description (20 points)
  if (metadata.description) {
    if (metadata.description.length >= 50 && metadata.description.length <= 160) {
      score += 20;
    } else {
      score += 10;
    }
  }
  
  // Schema markup (25 points)
  if (metadata.schema && metadata.schema.length > 0) {
    score += 25;
  }
  
  // Open Graph (15 points)
  if (metadata.ogTitle && metadata.ogDescription) {
    score += 15;
  } else if (metadata.ogTitle || metadata.ogDescription) {
    score += 7;
  }
  
  // Robots.txt (10 points)
  if (scanData.robotsTxt?.exists) {
    score += 10;
  }
  
  // Sitemap (10 points)
  if (scanData.sitemap?.exists) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate crawlability score
 */
function calculateCrawlabilityScore(scanData: ScanResult): number {
  let score = 50; // Base score
  
  // Performance scoring
  if (scanData.performance.loadTime < 2000) {
    score += 25;
  } else if (scanData.performance.loadTime < 3000) {
    score += 20;
  } else if (scanData.performance.loadTime < 5000) {
    score += 10;
  }
  
  // Robots.txt exists and accessible
  if (scanData.robotsTxt?.exists) {
    score += 15;
  }
  
  // Sitemap exists
  if (scanData.sitemap?.exists) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate summarizability score for AI understanding
 */
function calculateSummarizabilityScore(scanData: ScanResult): number {
  let score = 0;
  const { metadata } = scanData;
  
  // Has title (25 points)
  if (metadata.title) {
    score += 25;
  }
  
  // Has description (25 points)
  if (metadata.description) {
    score += 25;
  }
  
  // Has structured data (30 points)
  if (metadata.schema && metadata.schema.length > 0) {
    score += 30;
  }
  
  // Has Open Graph data (20 points)
  if (metadata.ogTitle && metadata.ogDescription) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

/**
 * Generate actionable tips based on scan results
 */
function generateScanTips(scanData: ScanResult, findabilityScore: number): Array<{
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}> {
  const tips = [];
  const { metadata } = scanData;
  
  // Title issues
  if (!metadata.title) {
    tips.push({
      title: "Missing Page Title",
      description: "Add a descriptive <title> tag to help search engines and AI understand your page content.",
      severity: 'high' as const
    });
  } else if (metadata.title.length > 60) {
    tips.push({
      title: "Title Too Long",
      description: `Your page title is ${metadata.title.length} characters long. Consider shortening it to under 60 characters for better search engine display.`,
      severity: 'medium' as const
    });
  } else if (metadata.title.length < 10) {
    tips.push({
      title: "Title Too Short",
      description: "Your page title is very short. Consider adding more descriptive content to help AI and search engines understand your page better.",
      severity: 'medium' as const
    });
  }
  
  // Meta description issues
  if (!metadata.description) {
    tips.push({
      title: "Missing Meta Description",
      description: "Add a meta description to provide a clear summary of your page content for search engines and AI systems.",
      severity: 'high' as const
    });
  } else if (metadata.description.length > 160) {
    tips.push({
      title: "Meta Description Too Long",
      description: "Your meta description exceeds 160 characters and may be truncated in search results.",
      severity: 'medium' as const
    });
  }
  
  // Schema markup
  if (!metadata.schema || metadata.schema.length === 0) {
    tips.push({
      title: "Add Structured Data",
      description: "Implement JSON-LD schema markup to help AI systems better understand and categorize your content.",
      severity: 'medium' as const
    });
  }
  
  // Open Graph
  if (!metadata.ogTitle && !metadata.ogDescription) {
    tips.push({
      title: "Add Open Graph Tags",
      description: "Add Open Graph meta tags (og:title, og:description) to control how your content appears when shared on social media.",
      severity: 'low' as const
    });
  }
  
  // Canonical URL
  if (!metadata.canonical) {
    tips.push({
      title: "Add Canonical URL",
      description: "Add a canonical link tag to help search engines understand the preferred version of your page.",
      severity: 'low' as const
    });
  }
  
  // Robots.txt
  if (!scanData.robotsTxt?.exists) {
    tips.push({
      title: "Create robots.txt",
      description: "Add a robots.txt file to guide search engine crawlers and improve your site's crawlability.",
      severity: 'low' as const
    });
  }
  
  // Sitemap
  if (!scanData.sitemap?.exists) {
    tips.push({
      title: "Add XML Sitemap",
      description: "Create and submit an XML sitemap to help search engines discover and index your pages more efficiently.",
      severity: 'medium' as const
    });
  }
  
  // Performance
  if (scanData.performance.loadTime > 3000) {
    tips.push({
      title: "Improve Page Load Speed",
      description: `Your page took ${Math.round(scanData.performance.loadTime / 1000)} seconds to load. Faster pages perform better in search results and provide better user experience.`,
      severity: 'medium' as const
    });
  }
  
  return tips;
}