import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  withCache, 
  createUserCacheKey, 
  CACHE_TTL, 
  getCacheHeaders 
} from "../_shared/cache.ts";

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

function csvResponse(data: string, filename: string) {
  return new Response(data, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...corsHeaders,
    },
  });
}

function formatDateForDB(dateStr: string): string {
  // Ensure date is in YYYY-MM-DD format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date.toISOString().split('T')[0];
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = [
    'ID',
    'Prompt',
    'Run Date',
    'Mentioned User Site',
    'Response',
    'User Domains',
    'Competitor Domains',
    'Relevance Score',
    'Tokens Used'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const result = row.result || {};
    const analysis = result.analysis || {};
    
    const csvRow = [
      `"${row.id}"`,
      `"${(row.prompt || '').replace(/"/g, '""')}"`,
      `"${new Date(row.run_date).toISOString()}"`,
      `"${row.includes_user_site ? 'Yes' : 'No'}"`,
      `"${(result.response || '').replace(/"/g, '""')}"`,
      `"${(result.user_domains || []).join('; ')}"`,
      `"${(analysis.competitor_domains || []).join('; ')}"`,
      `"${analysis.relevance_score || 'N/A'}"`,
      `"${result.tokens_used || 'N/A'}"`
    ];
    
    csvRows.push(csvRow.join(','));
  }
  
  return csvRows.join('\n');
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
    const format = url.searchParams.get('format');
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');
    const limit = format === 'csv' ? 5000 : parseInt(url.searchParams.get('limit') || '100');

    console.log("GET /api/prompts/history", { user: user.id, format, fromDate, toDate, limit });

    // Create cache key (skip caching for CSV exports and custom date ranges)
    const shouldCache = format !== 'csv' && !fromDate && !toDate && limit <= 100;
    const cacheKey = shouldCache ? createUserCacheKey(user.id, 'prompts_history', { limit }) : null;

    if (shouldCache && cacheKey) {
      const result = await withCache(
        cacheKey,
        CACHE_TTL.SHORT, // 5 minutes for prompt history
        async () => {
          console.log("Fetching fresh prompt history data");
          return await fetchPromptHistory(supabase, user.id, fromDate, toDate, limit);
        }
      );

      if (result.cached) {
        console.log("Returning cached prompt history");
      }

      const responseHeaders = {
        "Content-Type": "application/json", 
        ...corsHeaders,
        ...getCacheHeaders(180) // 3 minutes client cache
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: result.data,
          total: result.data.length,
          filters: { from: fromDate, to: toDate, limit },
          meta: {
            cached: result.cached,
            cache_timestamp: result.cacheTimestamp
          }
        }),
        { status: 200, headers: responseHeaders }
      );
    } else {
      // No caching for CSV or filtered requests
      console.log("Fetching fresh data (no cache)");
      const data = await fetchPromptHistory(supabase, user.id, fromDate, toDate, limit);
      
      // Return CSV format if requested
      if (format === 'csv') {
        if (!data || data.length === 0) {
          return csvResponse('', 'prompt_history_empty.csv');
        }

        const csvData = convertToCSV(data);
        const filename = `prompt_history_${new Date().toISOString().split('T')[0]}.csv`;
        
        console.log(`Returning CSV with ${data.length} rows`);
        return csvResponse(csvData, filename);
      }

      return jsonResponse({
        success: true,
        data: data,
        total: data.length,
        filters: { from: fromDate, to: toDate, limit }
      });
    }
  } catch (error) {
    console.error("Error in prompts-history function:", error);
    return jsonResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

async function fetchPromptHistory(supabase: any, userId: string, fromDate: string | null, toDate: string | null, limit: number) {
  // Build query with date filters
  let query = supabase
    .from("prompt_simulations")
    .select("id, prompt, run_date, includes_user_site, result")
    .eq("user_id", userId)
    .order("run_date", { ascending: false });

  // Apply date filters
  if (fromDate) {
    try {
      const formattedFromDate = formatDateForDB(fromDate);
      query = query.gte("run_date", `${formattedFromDate}T00:00:00.000Z`);
      console.log("Applied from date filter:", formattedFromDate);
    } catch (error) {
      throw new Error(`Invalid 'from' date format: ${fromDate}`);
    }
  }

  if (toDate) {
    try {
      const formattedToDate = formatDateForDB(toDate);
      query = query.lte("run_date", `${formattedToDate}T23:59:59.999Z`);
      console.log("Applied to date filter:", formattedToDate);
    } catch (error) {
      throw new Error(`Invalid 'to' date format: ${toDate}`);
    }
  }

  // Apply limit
  query = query.limit(limit);

  const { data: simulations, error: fetchError } = await query;

  if (fetchError) {
    console.error("Error fetching prompt simulations:", fetchError);
    throw new Error("Failed to fetch prompt history");
  }

  console.log(`Found ${simulations?.length || 0} prompt simulations`);

  // Format the data
  const formattedSimulations = (simulations || []).map(sim => ({
    id: sim.id,
    prompt: sim.prompt,
    run_date: sim.run_date,
    includes_user_site: sim.includes_user_site,
    response: sim.result?.response || '',
    analysis: {
      user_domains_mentioned: sim.result?.analysis?.user_domains_mentioned || [],
      competitor_domains: sim.result?.analysis?.competitor_domains || [],
      relevance_score: sim.result?.analysis?.relevance_score || null
    },
    tokens_used: sim.result?.tokens_used || null
  }));

  return formattedSimulations;
});