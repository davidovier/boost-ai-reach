import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
  });
}

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCacheKey(userId: string, siteId: string): string {
  return `compare_${userId}_${siteId}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL); // Clean up every 5 minutes

interface ScorePoint {
  date: string;
  score: number;
}

interface ComparisonData {
  site: {
    id: string;
    name: string | null;
    url: string;
    scores: ScorePoint[];
    latestScore: number | null;
  };
  competitors: Array<{
    id: string;
    domain: string;
    notes: string | null;
    scores: ScorePoint[];
    latestScore: number | null;
  }>;
  summary: {
    userAverage: number | null;
    competitorAverage: number | null;
    userRank: number;
    totalEntities: number;
    performanceDelta: number | null;
  };
}

async function fetchComparisonData(supabase: any, userId: string, siteId: string): Promise<ComparisonData> {
  // Get user's site information
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .select("id, name, url")
    .eq("id", siteId)
    .eq("user_id", userId)
    .single();

  if (siteErr || !site) {
    throw new Error("Site not found or access denied");
  }

  // Get site's scan history (last 30 days for trend)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: scans, error: scansErr } = await supabase
    .from("scans")
    .select("ai_findability_score, scan_date")
    .eq("site_id", siteId)
    .gte("scan_date", thirtyDaysAgo.toISOString())
    .order("scan_date", { ascending: true });

  if (scansErr) {
    console.error("Error fetching scans:", scansErr);
  }

  // Get user's competitors
  const { data: competitors, error: competitorsErr } = await supabase
    .from("competitors")
    .select("id, domain, notes")
    .eq("user_id", userId);

  if (competitorsErr) {
    console.error("Error fetching competitors:", competitorsErr);
  }

  // Get competitor snapshots (last 30 days)
  const competitorIds = (competitors || []).map(c => c.id);
  let competitorSnapshots: any[] = [];
  
  if (competitorIds.length > 0) {
    const { data: snapshots, error: snapshotsErr } = await supabase
      .from("competitor_snapshots")
      .select("competitor_id, ai_findability_score, snapshot_date")
      .in("competitor_id", competitorIds)
      .gte("snapshot_date", thirtyDaysAgo.toISOString())
      .order("snapshot_date", { ascending: true });

    if (snapshotsErr) {
      console.error("Error fetching competitor snapshots:", snapshotsErr);
    } else {
      competitorSnapshots = snapshots || [];
    }
  }

  // Process site scores
  const siteScores: ScorePoint[] = (scans || [])
    .filter(scan => scan.ai_findability_score !== null)
    .map(scan => ({
      date: scan.scan_date,
      score: scan.ai_findability_score
    }));

  const latestSiteScore = siteScores.length > 0 ? siteScores[siteScores.length - 1].score : null;

  // Process competitor scores
  const competitorData = (competitors || []).map(competitor => {
    const snapshots = competitorSnapshots
      .filter(snap => snap.competitor_id === competitor.id && snap.ai_findability_score !== null)
      .map(snap => ({
        date: snap.snapshot_date,
        score: snap.ai_findability_score
      }));

    const latestScore = snapshots.length > 0 ? snapshots[snapshots.length - 1].score : null;

    return {
      id: competitor.id,
      domain: competitor.domain,
      notes: competitor.notes,
      scores: snapshots,
      latestScore
    };
  });

  // Calculate summary statistics
  const allLatestScores = [
    ...(latestSiteScore !== null ? [latestSiteScore] : []),
    ...competitorData.map(c => c.latestScore).filter(score => score !== null)
  ] as number[];

  const userAverage = latestSiteScore;
  const competitorLatestScores = competitorData
    .map(c => c.latestScore)
    .filter(score => score !== null) as number[];
  
  const competitorAverage = competitorLatestScores.length > 0 
    ? competitorLatestScores.reduce((sum, score) => sum + score, 0) / competitorLatestScores.length
    : null;

  // Calculate user's rank (1 = best)
  const sortedScores = [...allLatestScores].sort((a, b) => b - a); // Descending
  const userRank = latestSiteScore !== null 
    ? sortedScores.indexOf(latestSiteScore) + 1 
    : allLatestScores.length + 1;

  const performanceDelta = userAverage !== null && competitorAverage !== null 
    ? userAverage - competitorAverage 
    : null;

  return {
    site: {
      id: site.id,
      name: site.name,
      url: site.url,
      scores: siteScores,
      latestScore: latestSiteScore
    },
    competitors: competitorData,
    summary: {
      userAverage,
      competitorAverage: competitorAverage !== null ? Math.round(competitorAverage * 100) / 100 : null,
      userRank,
      totalEntities: allLatestScores.length,
      performanceDelta: performanceDelta !== null ? Math.round(performanceDelta * 100) / 100 : null
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });

  // Authenticate user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return jsonResponse({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');

    if (!siteId) {
      return jsonResponse({ error: "Missing required parameter: siteId" }, { status: 400 });
    }

    console.log("GET /api/competitors/compare", { user: user.id, siteId });

    // Check cache first
    const cacheKey = getCacheKey(user.id, siteId);
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      console.log("Returning cached comparison data");
      return jsonResponse({
        success: true,
        data: cachedData,
        cached: true,
        cache_timestamp: cache.get(cacheKey)?.timestamp
      });
    }

    // Fetch fresh data
    console.log("Fetching fresh comparison data");
    const comparisonData = await fetchComparisonData(supabase, user.id, siteId);

    // Cache the result
    setCache(cacheKey, comparisonData);

    console.log("Comparison data fetched and cached", {
      siteScores: comparisonData.site.scores.length,
      competitors: comparisonData.competitors.length,
      userRank: comparisonData.summary.userRank
    });

    return jsonResponse({
      success: true,
      data: comparisonData,
      cached: false,
      cache_timestamp: Date.now()
    });

  } catch (error) {
    console.error("Error in competitors-compare function:", error);
    return jsonResponse({ 
      error: error instanceof Error ? error.message : "Internal server error",
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
});