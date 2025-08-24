import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/role-middleware.ts";
import { checkRateLimit, createRateLimitResponse, getClientIP, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { 
  validateQueryParams,
  AnalyticsQuerySchema,
  createValidationErrorResponse 
} from "../_shared/validation.ts";
import { 
  withCache, 
  createAdminCacheKey, 
  CACHE_TTL, 
  getCacheHeaders 
} from "../_shared/cache.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`Admin analytics request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Initialize Supabase client first for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Apply IP-based rate limiting (analytics is a heavy operation)
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkRateLimit(
      supabase,
      `ip:${clientIP}`,
      RATE_LIMITS.ADMIN_HEAVY_PER_IP
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Check admin role
    const roleCheck = await requireRole(req, ['admin']);
    if (!roleCheck.success) {
      return roleCheck.response;
    }

    // Supabase client already initialized above for rate limiting

    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const queryValidation = validateQueryParams(AnalyticsQuerySchema, queryParams);
    
    if (!queryValidation.success) {
      return createValidationErrorResponse(
        queryValidation.error,
        corsHeaders,
        queryValidation.details
      );
    }

    const { from: fromDate, to: toDate } = queryValidation.data;

    // Create cache key for analytics query
    const cacheKey = createAdminCacheKey('analytics', { from: fromDate, to: toDate });
    
    // Use cache wrapper for expensive analytics query
    const result = await withCache(
      cacheKey,
      CACHE_TTL.MEDIUM, // 15 minutes for admin analytics
      async () => {
        console.log("Fetching fresh analytics data");
        
        // Get event totals by type
        const { data: eventTotals, error: eventError } = await supabase
          .from('user_events')
          .select('event_name')
          .gte('occurred_at', fromDate)
          .lte('occurred_at', toDate);

        if (eventError) {
          throw new Error(`Failed to fetch event analytics: ${eventError.message}`);
        }

        // Aggregate event counts
        const eventCounts = eventTotals.reduce((acc: Record<string, number>, event) => {
          acc[event.event_name] = (acc[event.event_name] || 0) + 1;
          return acc;
        }, {});

        // Get top users by activity
        const { data: userActivity, error: userError } = await supabase
          .from('user_events')
          .select(`
            user_id,
            profiles!inner(email, name)
          `)
          .gte('occurred_at', fromDate)
          .lte('occurred_at', toDate);

        if (userError) {
          throw new Error(`Failed to fetch user analytics: ${userError.message}`);
        }

        // Aggregate user activity counts
        const userCounts = userActivity.reduce((acc: Record<string, any>, event) => {
          const userId = event.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              user_id: userId,
              email: event.profiles?.email || 'Unknown',
              name: event.profiles?.name || 'Unknown',
              event_count: 0
            };
          }
          acc[userId].event_count += 1;
          return acc;
        }, {});

        // Sort users by activity and get top 10
        const topUsers = Object.values(userCounts)
          .sort((a: any, b: any) => b.event_count - a.event_count)
          .slice(0, 10);

        // Calculate summary metrics
        const totalEvents = eventTotals.length;
        const uniqueUsers = Object.keys(userCounts).length;
        const dateRange = {
          from: fromDate,
          to: toDate
        };

        return {
          summary: {
            total_events: totalEvents,
            unique_users: uniqueUsers,
            date_range: dateRange
          },
          event_totals: eventCounts,
          top_users: topUsers
        };
      }
    );

    if (result.cached) {
      console.log("Returning cached analytics data");
    }

    console.log(`Analytics query completed: ${result.data.summary.total_events} events, ${result.data.summary.unique_users} users (cached: ${result.cached})`);

    // Add cache headers for client-side caching
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...getCacheHeaders(300) // 5 minutes client cache
    };

    return new Response(
      JSON.stringify({
        ...result.data,
        meta: {
          cached: result.cached,
          cache_timestamp: result.cacheTimestamp
        }
      }),
      { 
        status: 200, 
        headers: responseHeaders
      }
    );

  } catch (error) {
    console.error('Error in admin-analytics function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});