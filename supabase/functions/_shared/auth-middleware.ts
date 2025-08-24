import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  plan: string;
}

export async function requireAuth(req: Request): Promise<{
  success: true;
  user: AuthenticatedUser;
} | {
  success: false;
  response: Response;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  // Fetch user profile to get role and plan
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, plan')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "User profile not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email!,
      role: profile.role,
      plan: profile.plan,
    }
  };
}