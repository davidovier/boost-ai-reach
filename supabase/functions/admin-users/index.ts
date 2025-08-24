import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/role-middleware.ts";
import { checkRateLimit, createRateLimitResponse, getClientIP, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin role for all endpoints
    const authResult = await requireAdmin(req);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Apply IP-based rate limiting for admin routes
    const clientIP = getClientIP(req);
    const isHeavyOperation = req.url.includes('/analytics') || req.url.includes('/audit-logs');
    const rateLimitConfig = isHeavyOperation ? RATE_LIMITS.ADMIN_HEAVY_PER_IP : RATE_LIMITS.ADMIN_PER_IP;
    
    const rateLimitResult = await checkRateLimit(
      supabase,
      `ip:${clientIP}`,
      rateLimitConfig
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    console.log(`Admin API: ${req.method} ${url.pathname}`);

    // GET /api/admin/users - List all users
    if (req.method === 'GET' && pathSegments.includes('users') && pathSegments.length === 3) {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id, email, name, role, plan, created_at, updated_at,
          usage_metrics!inner(scan_count, prompt_count, competitor_count, report_count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      return jsonResponse({ 
        success: true,
        users: profiles,
        total: profiles?.length || 0 
      });
    }

    // POST /api/admin/user/:id/role - Update user role
    if (req.method === 'POST' && pathSegments.includes('user') && pathSegments.includes('role')) {
      const userId = pathSegments[pathSegments.indexOf('user') + 1];
      if (!userId) {
        return jsonResponse({ error: "Missing user ID" }, { status: 400 });
      }

      const body = await req.json();
      const { role, plan } = body;

      if (!role && !plan) {
        return jsonResponse({ error: "Role or plan is required" }, { status: 400 });
      }

      const updateData: any = {};
      if (role) updateData.role = role;
      if (plan) updateData.plan = plan;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, name, role, plan, updated_at')
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      console.log(`Updated user ${userId} role/plan:`, updateData);
      return jsonResponse({ 
        success: true,
        user: data,
        message: 'User updated successfully'
      });
    }

    // POST /api/admin/override-usage - Override user usage limits
    if (req.method === 'POST' && pathSegments.includes('override-usage')) {
      const body = await req.json();
      const { userId, usageType, newValue, resetAll } = body;

      if (!userId) {
        return jsonResponse({ error: "Missing user ID" }, { status: 400 });
      }

      if (resetAll) {
        // Reset all usage metrics for user
        const { data, error } = await supabase
          .from('usage_metrics')
          .update({
            scan_count: 0,
            prompt_count: 0,
            competitor_count: 0,
            report_count: 0,
            last_reset: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error resetting usage:', error);
          return jsonResponse({ error: error.message }, { status: 500 });
        }

        console.log(`Reset all usage for user ${userId}`);
        return jsonResponse({
          success: true,
          usage: data,
          message: 'All usage metrics reset successfully'
        });
      }

      if (!usageType || newValue === undefined) {
        return jsonResponse({ 
          error: "usageType and newValue are required (or use resetAll: true)" 
        }, { status: 400 });
      }

      const validTypes = ['scan_count', 'prompt_count', 'competitor_count', 'report_count'];
      if (!validTypes.includes(usageType)) {
        return jsonResponse({ 
          error: `Invalid usageType. Must be one of: ${validTypes.join(', ')}` 
        }, { status: 400 });
      }

      const updateData = { [usageType]: newValue };
      const { data, error } = await supabase
        .from('usage_metrics')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error overriding usage:', error);
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      console.log(`Overrode ${usageType} to ${newValue} for user ${userId}`);
      return jsonResponse({
        success: true,
        usage: data,
        message: `${usageType} updated successfully`
      });
    }

    // GET /api/admin/audit-logs - Get audit logs
    if (req.method === 'GET' && pathSegments.includes('audit-logs')) {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const userId = url.searchParams.get('userId');
      const action = url.searchParams.get('action');

      let query = supabase
        .from('audit_logs')
        .select(`
          id, user_id, action, table_name, record_id, 
          old_values, new_values, ip_address, user_agent, created_at,
          profiles!inner(email, name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      const { data: logs, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      // Get total count for pagination
      let countQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      if (userId) countQuery = countQuery.eq('user_id', userId);
      if (action) countQuery = countQuery.eq('action', action);

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.warn('Error getting audit logs count:', countError);
      }

      return jsonResponse({
        success: true,
        logs: logs || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        }
      });
    }

    // GET /api/admin/feature-configs - Get feature configurations
    if (req.method === 'GET' && pathSegments.includes('feature-configs')) {
      const { data: configs, error } = await supabase
        .from('dashboard_configs')
        .select('id, role, plan, config, created_at, updated_at')
        .order('role', { ascending: true });

      if (error) {
        console.error('Error fetching feature configs:', error);
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      // Get feature flags
      const { data: flags, error: flagsError } = await supabase
        .from('feature_flags')
        .select('id, user_id, feature_key, enabled, created_at, updated_at')
        .order('feature_key', { ascending: true });

      if (flagsError) {
        console.error('Error fetching feature flags:', flagsError);
        return jsonResponse({ error: flagsError.message }, { status: 500 });
      }

      return jsonResponse({
        success: true,
        dashboard_configs: configs || [],
        feature_flags: flags || []
      });
    }

    // POST /api/admin/feature-configs/update - Update feature configurations
    if (req.method === 'POST' && pathSegments.includes('feature-configs') && pathSegments.includes('update')) {
      const body = await req.json();
      const { type, configId, role, plan, config, featureKey, enabled, userId } = body;

      if (type === 'dashboard_config') {
        if (!role && !plan) {
          return jsonResponse({ error: "Role or plan is required for dashboard config" }, { status: 400 });
        }

        if (configId) {
          // Update existing config
          const { data, error } = await supabase
            .from('dashboard_configs')
            .update({ config })
            .eq('id', configId)
            .select()
            .single();

          if (error) {
            console.error('Error updating dashboard config:', error);
            return jsonResponse({ error: error.message }, { status: 500 });
          }

          return jsonResponse({
            success: true,
            config: data,
            message: 'Dashboard config updated successfully'
          });
        } else {
          // Create new config
          const { data, error } = await supabase
            .from('dashboard_configs')
            .insert({ role, plan, config })
            .select()
            .single();

          if (error) {
            console.error('Error creating dashboard config:', error);
            return jsonResponse({ error: error.message }, { status: 500 });
          }

          return jsonResponse({
            success: true,
            config: data,
            message: 'Dashboard config created successfully'
          });
        }
      } else if (type === 'feature_flag') {
        if (!featureKey) {
          return jsonResponse({ error: "featureKey is required for feature flag" }, { status: 400 });
        }

        const insertData: any = { feature_key: featureKey, enabled: enabled !== false };
        if (userId) insertData.user_id = userId;

        const { data, error } = await supabase
          .from('feature_flags')
          .upsert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error updating feature flag:', error);
          return jsonResponse({ error: error.message }, { status: 500 });
        }

        return jsonResponse({
          success: true,
          flag: data,
          message: 'Feature flag updated successfully'
        });
      } else {
        return jsonResponse({ error: "Invalid type. Must be 'dashboard_config' or 'feature_flag'" }, { status: 400 });
      }
    }

    // Fallback for PUT method (legacy user update)
    if (req.method === 'PUT') {
      const body = await req.json();
      const { userId, role, plan } = body;

      if (!userId) {
        return jsonResponse({ error: "Missing userId" }, { status: 400 });
      }

      const updateData: any = {};
      if (role) updateData.role = role;
      if (plan) updateData.plan = plan;

      if (Object.keys(updateData).length === 0) {
        return jsonResponse({ error: "No update data provided" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user (legacy):', error);
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      return jsonResponse({ 
        success: true,
        user: data,
        message: 'User updated successfully'
      });
    }

    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    console.error('Error in admin API:', error);
    return jsonResponse({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});