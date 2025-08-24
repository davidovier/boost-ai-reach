import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceLimit } from "../_shared/limits.ts";
import { logEvent, extractRequestMetadata } from "../_shared/event-logger.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { validateRequestBody, RunPromptSchema, createValidationErrorResponse } from "../_shared/validation.ts";

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

function normalizeDomain(input: string): string | null {
  try {
    const hasProtocol = /^https?:\/\//i.test(input);
    const url = new URL(hasProtocol ? input : `https://${input}`);
    let host = url.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch (_) {
    return null;
  }
}

function sanitizeArray(arr: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of arr) if (v) set.add(v);
  return Array.from(set);
}

async function callOpenAI(prompt: string, userDomains: string[], competitorDomains: string[]) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return {
      error: {
        status: 500,
        code: "missing_openai_key",
        message: "OPENAI_API_KEY is not set. Add it in Supabase Edge Function secrets.",
      },
    } as const;
  }

  // Create compact system prompt for domain analysis
  const systemPrompt = `You are an AI assistant analyzing search queries. When given a user prompt, respond with a JSON object containing:
1. "response": Your natural response to the query (2-3 sentences max)
2. "analysis": {
   "user_domains_mentioned": array of user domains mentioned in your response,
   "competitor_domains": array of competitor/alternative domains you mentioned,
   "relevance_score": 1-10 score for how relevant the query is to the user's domains
}

User domains: ${userDomains.join(", ")}
Known competitors: ${competitorDomains.join(", ")}

Always return valid JSON. Be concise but helpful.`;

  try {
    console.log("Calling OpenAI with GPT-5 model");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07", // Using flagship GPT-5 model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 1000, // Using max_completion_tokens for GPT-5
        // Note: temperature not supported in GPT-5
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", response.status, errorData);
      return {
        error: {
          status: response.status,
          code: "openai_api_error",
          message: `OpenAI API error: ${response.status}`,
          details: errorData,
        },
      } as const;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return {
        error: {
          status: 500,
          code: "no_response",
          message: "No response from OpenAI",
        },
      } as const;
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", aiResponse);
      // Fallback: create a response object
      parsedResponse = {
        response: aiResponse,
        analysis: {
          user_domains_mentioned: [],
          competitor_domains: [],
          relevance_score: 5
        }
      };
    }

    return {
      success: {
        response: parsedResponse.response || aiResponse,
        analysis: parsedResponse.analysis || {
          user_domains_mentioned: [],
          competitor_domains: [],
          relevance_score: 5
        },
        raw_response: aiResponse,
        tokens_used: data.usage?.total_tokens || 0,
      },
    } as const;

  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return {
      error: {
        status: 500,
        code: "network_error",
        message: error instanceof Error ? error.message : "Network error",
      },
    } as const;
  }
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
    // Check rate limit for prompts
    const rateLimitResult = await checkRateLimit(
      supabase,
      user.id,
      RATE_LIMITS.PROMPTS_PER_USER
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse request body
    const bodyText = await req.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      return createValidationErrorResponse(
        "Invalid JSON in request body",
        corsHeaders
      );
    }

    const validation = validateRequestBody(RunPromptSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error,
        corsHeaders,
        validation.details
      );
    }

    const { prompt, includeCompetitors = false } = validation.data;

    console.log("POST /api/prompts invoked by user:", user.id, "prompt length:", prompt.length);

    // Enforce prompt quota using limits helper
    const limitResult = await enforceLimit(user.id, 'prompt', authHeader);
    if (!limitResult.success) {
      return limitResult.response;
    }

    // Get user's sites and competitors for context
    const [sitesResult, competitorsResult] = await Promise.all([
      supabase.from("sites").select("url").eq("user_id", user.id),
      supabase.from("competitors").select("domain").eq("user_id", user.id)
    ]);

    const userDomains = sanitizeArray((sitesResult.data || []).map(site => normalizeDomain(site.url)));
    const competitorDomains = sanitizeArray((competitorsResult.data || []).map(comp => comp.domain));

    console.log("Domains context:", { userDomains, competitorDomains });

    // Call OpenAI for analysis
    const aiResult = await callOpenAI(prompt, userDomains, competitorDomains);

    if ("error" in aiResult) {
      console.error("OpenAI call failed:", aiResult.error);
      return jsonResponse({ 
        error: aiResult.error.message,
        code: aiResult.error.code,
        details: aiResult.error 
      }, { status: aiResult.error.status });
    }

    const { response, analysis, tokens_used } = aiResult.success;

    // Prepare data for database storage matching acceptance criteria
    const mentionedUserSite = analysis.user_domains_mentioned.length > 0;
    const competitors = analysis.competitor_domains || [];

    console.log("AI Analysis Results:", {
      mentionedUserSite,
      competitors,
      relevanceScore: analysis.relevance_score
    });

    // Save to prompt_simulations table
    const { data: simulationRecord, error: saveError } = await supabase
      .from("prompt_simulations")
      .insert({
        user_id: user.id,
        prompt: prompt,
        result: {
          response: response,
          analysis: analysis,
          user_domains: userDomains,
          competitor_domains: competitorDomains,
          tokens_used: tokens_used
        },
        includes_user_site: mentionedUserSite
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving prompt simulation:", saveError);
      return jsonResponse({ error: "Failed to save prompt simulation" }, { status: 500 });
    }

    // Update usage metrics
    const { error: usageError } = await supabase
      .from("usage_metrics")
      .update({ prompt_count: supabase.raw("prompt_count + 1") })
      .eq("user_id", user.id);

    if (usageError) {
      console.warn("Failed to update usage metrics:", usageError);
    }

    // Log prompt run event
    const requestMetadata = extractRequestMetadata(req);
    await logEvent(supabase, user.id, 'prompt_run', {
      ...requestMetadata,
      prompt_length: prompt.length,
      mentioned_user_site: mentionedUserSite,
      competitors_found: competitors.length,
      tokens_used: tokens_used,
      relevance_score: analysis.relevance_score
    });

    console.log("Prompt simulation completed:", simulationRecord.id);

    // Return structured response matching acceptance criteria: {prompt, mentionedUserSite, competitors[]}
    return jsonResponse({
      success: true,
      simulation: {
        id: simulationRecord.id,
        prompt: prompt,                    // ✅ Required: prompt
        mentionedUserSite: mentionedUserSite, // ✅ Required: mentionedUserSite
        competitors: competitors,          // ✅ Required: competitors[]
        response: response,
        analysis: {
          user_domains_mentioned: analysis.user_domains_mentioned || [],
          competitor_domains_mentioned: analysis.competitor_domains || [],
          relevance_score: analysis.relevance_score || 5
        },
        run_date: simulationRecord.run_date,
        tokens_used: tokens_used
      }
    });

  } catch (error) {
    console.error("Error in run-prompt function:", error);
    return jsonResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});