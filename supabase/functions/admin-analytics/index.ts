import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/role-middleware.ts";

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
    // Check admin role
    const roleCheck = await requireRole(req, ['admin']);
    if (!roleCheck.success) {
      return roleCheck.response;
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query parameters
    const url = new URL(req.url);
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');

    // Validate date parameters
    if (!fromDate || !toDate) {
      return new Response(
        JSON.stringify({ error: 'Both from and to parameters are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate date format
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD or ISO format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get event totals by type
    const { data: eventTotals, error: eventError } = await supabase
      .from('user_events')
      .select('event_name')
      .gte('occurred_at', fromDate)
      .lte('occurred_at', toDate);

    if (eventError) {
      console.error('Error fetching event totals:', eventError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event analytics' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
      console.error('Error fetching user activity:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user analytics' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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

    const analytics = {
      summary: {
        total_events: totalEvents,
        unique_users: uniqueUsers,
        date_range: dateRange
      },
      event_totals: eventCounts,
      top_users: topUsers
    };

    console.log(`Analytics query completed: ${totalEvents} events, ${uniqueUsers} users`);

    return new Response(
      JSON.stringify(analytics),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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