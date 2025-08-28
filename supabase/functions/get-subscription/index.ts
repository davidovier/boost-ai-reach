import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get user profile with plan
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error("Failed to fetch user profile");
    }

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get usage metrics
    const { data: usage, error: usageError } = await supabaseClient
      .from('usage_metrics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (usageError) {
      console.error("Failed to fetch usage metrics:", usageError);
    }

    // Determine current plan based on subscription
    let currentPlan = profile.plan || 'free';
    
    if (subscription && subscription.status === 'active') {
      // Map subscription plan to our plan tiers
      switch (subscription.plan) {
        case 'pro':
          currentPlan = 'pro';
          break;
        case 'growth':
          currentPlan = 'growth';
          break;
        case 'enterprise':
          currentPlan = 'enterprise';
          break;
        default:
          currentPlan = 'pro'; // Default for active subscriptions
      }
      
      // Update profile if plan has changed
      if (currentPlan !== profile.plan) {
        await supabaseClient
          .from('profiles')
          .update({ plan: currentPlan })
          .eq('id', user.id);
      }
    } else if (!subscription || subscription.status !== 'active') {
      // No active subscription, should be free plan
      currentPlan = 'free';
      
      // Update profile if needed
      if (profile.plan !== 'free') {
        await supabaseClient
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', user.id);
      }
    }

    // Get plan limits based on current plan
    const { data: planLimits, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('name', currentPlan)
      .single();

    if (planError) {
      console.error("Failed to fetch plan limits:", planError);
    }

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: profile.name,
        role: profile.role,
        plan: currentPlan,
      },
      subscription: subscription || null,
      usage: usage || {
        scan_count: 0,
        prompt_count: 0,
        competitor_count: 0,
        report_count: 0,
      },
      limits: planLimits || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch subscription data",
      details: error.message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});