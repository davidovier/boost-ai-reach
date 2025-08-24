import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logEvent, extractRequestMetadata } from "../_shared/event-logger.ts";

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  // Use service role to log signup events (no auth required)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { userId, email, signupMethod } = body;

    if (!userId || !email) {
      return jsonResponse({ error: "userId and email are required" }, { status: 400 });
    }

    console.log("Logging user signup event:", userId, email);

    // Log user signup event
    const requestMetadata = extractRequestMetadata(req);
    const result = await logEvent(supabase, userId, 'user_signup', {
      ...requestMetadata,
      email,
      signup_method: signupMethod || 'email',
      welcome_flow_triggered: true
    });

    if (!result.success) {
      console.error("Failed to log signup event:", result.error);
      return jsonResponse({ error: "Failed to log signup event" }, { status: 500 });
    }

    return jsonResponse({
      success: true,
      message: "Signup event logged successfully"
    });

  } catch (error) {
    console.error("Error in user-signup-logger:", error);
    return jsonResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});