import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceLimit } from "../_shared/limits.ts";

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
    const u = new URL(hasProtocol ? input : `https://${input}`);
    let host = u.hostname.toLowerCase();
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

  const system =
    "You are an assistant that simulates an AI's response to a user's query and reports domain mentions. Return ONLY a strict JSON object. " +
    "Given userDomains and competitorDomains, decide if any userDomains are present in your best synthesized answer and which competitorDomains are present. " +
    "Rules: output keys: mentionedUserSite (boolean), competitorHits (array of strings chosen ONLY from competitorDomains), summary (string, 2-3 concise sentences). Do not include any other fields. Do not wrap in code fences.";

  const userContent = JSON.stringify({
    prompt,
    userDomains,
    competitorDomains,
    instructions:
      "Answer the prompt as an AI would (mentally), then check if any of the provided domains would likely appear. Only use the provided domain lists for selection.",
  });

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("OpenAI error", resp.status, text);
    return {
      error: { status: 502, code: "openai_error", message: "OpenAI API error", details: text },
    } as const;
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return {
      error: { status: 500, code: "bad_openai_response", message: "Malformed OpenAI response" },
    } as const;
  }

  // Try to parse strict JSON
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Fallback: attempt to extract JSON between braces
    try {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start >= 0 && end >= start) parsed = JSON.parse(content.slice(start, end + 1));
    } catch (_) {
      console.error("JSON parse failed for OpenAI content", content);
      return {
        error: { status: 500, code: "parse_error", message: "Failed to parse OpenAI JSON" },
      } as const;
    }
  }

  const mentionedUserSite = Boolean(parsed?.mentionedUserSite);
  const competitorHits = Array.isArray(parsed?.competitorHits)
    ? parsed.competitorHits.filter((d: any) => typeof d === "string")
    : [];
  const summary = typeof parsed?.summary === "string" ? parsed.summary : "";

  return {
    result: { mentionedUserSite, competitorHits, summary },
    model: data?.model ?? "gpt-4o",
  } as const;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Missing Supabase env" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return jsonResponse({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const prompt: string | undefined = body?.prompt;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return jsonResponse({ error: "Invalid request body: 'prompt' required" }, { status: 400 });
    }

    console.log("run-prompt invoked by", user.id, "prompt(len)", String(prompt).length);

    // Enforce prompt quota using limits helper
    const limitResult = await enforceLimit(user.id, 'prompt', authHeader);
    if (!limitResult.success) {
      return limitResult.response;
    }

    // Load user's context
    const [sitesRes, competitorsRes] = await Promise.all([
      supabase.from("sites").select("id,url").eq("user_id", user.id),
      supabase.from("competitors").select("id,domain").eq("user_id", user.id),
    ]);

    if (sitesRes.error) {
      console.error("sites select error", sitesRes.error);
      return jsonResponse({ error: "Failed to load sites" }, { status: 500 });
    }
    if (competitorsRes.error) {
      console.error("competitors select error", competitorsRes.error);
      return jsonResponse({ error: "Failed to load competitors" }, { status: 500 });
    }

    const userDomains = sanitizeArray(
      (sitesRes.data ?? []).map((s: any) => normalizeDomain(s.url)).filter(Boolean),
    );
    const competitorDomains = sanitizeArray(
      (competitorsRes.data ?? []).map((c: any) => normalizeDomain(c.domain)).filter(Boolean),
    );

    // Call OpenAI
    const ai = await callOpenAI(prompt, userDomains, competitorDomains);
    if ((ai as any).error) {
      const err = (ai as any).error;
      return jsonResponse({ error: err }, { status: err.status ?? 500 });
    }

    const { result, model } = ai as unknown as {
      result: { mentionedUserSite: boolean; competitorHits: string[]; summary: string };
      model: string;
    };

    // Persist simulation
    const insertPayload = {
      user_id: user.id,
      prompt,
      includes_user_site: result.mentionedUserSite,
      result: {
        competitorHits: result.competitorHits,
        summary: result.summary,
        userDomains,
        competitorDomains,
        model,
      },
    };

    const { data: simRow, error: simErr } = await supabase
      .from("prompt_simulations")
      .insert(insertPayload)
      .select("id")
      .single();

    if (simErr) {
      console.error("prompt_simulations insert error", simErr);
      return jsonResponse({ error: "Failed to save simulation" }, { status: 500 });
    }

    // Increment usage prompt_count
    const { data: usageRow } = await supabase
      .from("usage_metrics")
      .select("prompt_count")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!usageRow) {
      // create usage row if missing
      const { error: insUsageErr } = await supabase
        .from("usage_metrics")
        .insert({ user_id: user.id, prompt_count: 1 });
      if (insUsageErr) console.error("usage_metrics insert error", insUsageErr);
    } else {
      const { error: updErr } = await supabase
        .from("usage_metrics")
        .update({ prompt_count: (usageRow.prompt_count ?? 0) + 1 })
        .eq("user_id", user.id);
      if (updErr) console.error("usage_metrics update error", updErr);
    }

    return jsonResponse({
      mentionedUserSite: result.mentionedUserSite,
      competitorHits: result.competitorHits,
      summary: result.summary,
      metadata: { simulationId: simRow?.id, model },
    });
  } catch (e) {
    console.error("run-prompt unhandled", e);
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
});
