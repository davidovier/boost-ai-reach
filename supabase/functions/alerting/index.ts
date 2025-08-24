import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AlertRule {
  type: '5xx_spike' | 'stripe_webhook_fail' | 'openai_timeout';
  threshold?: number;
  timeWindow?: number; // minutes
}

interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata?: any;
}

async function logAlert(alert: Alert) {
  console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
  
  // Store alert in database
  const { error } = await supabase
    .from('alerts')
    .insert({
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      metadata: alert.metadata,
      created_at: alert.timestamp
    });

  if (error) {
    console.error('Failed to store alert:', error);
  }

  // In production, you could send to external services:
  // - Email alerts
  // - Slack notifications  
  // - PagerDuty
  // - Discord webhooks
}

async function check5xxSpike() {
  // Check for 5xx errors in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: errors, error } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', fiveMinutesAgo)
    .like('action', '%error%')
    .or('new_values->>status_code.gte.500,old_values->>status_code.gte.500');

  if (error) {
    console.error('Failed to check 5xx errors:', error);
    return;
  }

  const errorCount = errors?.length || 0;
  const threshold = 5; // 5 errors in 5 minutes

  if (errorCount >= threshold) {
    await logAlert({
      type: '5xx_spike',
      message: `5xx error spike detected: ${errorCount} errors in 5 minutes`,
      severity: errorCount >= 10 ? 'critical' : 'high',
      timestamp: new Date().toISOString(),
      metadata: { 
        error_count: errorCount, 
        threshold,
        time_window: '5 minutes'
      }
    });
  }
}

async function checkStripeWebhookFailures() {
  // Check for Stripe webhook failures in the last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data: failures, error } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', tenMinutesAgo)
    .eq('action', 'stripe_webhook_error');

  if (error) {
    console.error('Failed to check Stripe webhook failures:', error);
    return;
  }

  const failureCount = failures?.length || 0;
  
  if (failureCount > 0) {
    await logAlert({
      type: 'stripe_webhook_fail',
      message: `Stripe webhook failures detected: ${failureCount} failures in 10 minutes`,
      severity: failureCount >= 3 ? 'critical' : 'high',
      timestamp: new Date().toISOString(),
      metadata: { 
        failure_count: failureCount,
        time_window: '10 minutes'
      }
    });
  }
}

async function checkOpenAITimeouts() {
  // Check for OpenAI timeouts in the last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  const { data: timeouts, error } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', fifteenMinutesAgo)
    .eq('action', 'openai_timeout');

  if (error) {
    console.error('Failed to check OpenAI timeouts:', error);
    return;
  }

  const timeoutCount = timeouts?.length || 0;
  
  if (timeoutCount > 0) {
    await logAlert({
      type: 'openai_timeout',
      message: `OpenAI timeout detected: ${timeoutCount} timeouts in 15 minutes`,
      severity: timeoutCount >= 3 ? 'critical' : 'medium',
      timestamp: new Date().toISOString(),
      metadata: { 
        timeout_count: timeoutCount,
        time_window: '15 minutes'
      }
    });
  }
}

async function simulateError(errorType: string) {
  const alerts: Record<string, Alert> = {
    '5xx_spike': {
      type: '5xx_spike',
      message: 'SIMULATED: 5xx error spike detected: 8 errors in 5 minutes',
      severity: 'high',
      timestamp: new Date().toISOString(),
      metadata: { 
        simulated: true,
        error_count: 8, 
        threshold: 5,
        time_window: '5 minutes'
      }
    },
    'stripe_webhook_fail': {
      type: 'stripe_webhook_fail',
      message: 'SIMULATED: Stripe webhook failures detected: 2 failures in 10 minutes',
      severity: 'high',
      timestamp: new Date().toISOString(),
      metadata: { 
        simulated: true,
        failure_count: 2,
        time_window: '10 minutes'
      }
    },
    'openai_timeout': {
      type: 'openai_timeout',
      message: 'SIMULATED: OpenAI timeout detected: 1 timeout in 15 minutes',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      metadata: { 
        simulated: true,
        timeout_count: 1,
        time_window: '15 minutes'
      }
    }
  };

  const alert = alerts[errorType];
  if (alert) {
    await logAlert(alert);
    return { success: true, alert };
  }
  
  return { success: false, error: 'Unknown error type' };
}

serve(async (req) => {
  console.log(`Alerting request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    if (req.method === 'POST' && action === 'simulate') {
      const { errorType } = await req.json();
      const result = await simulateError(errorType);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET' && action === 'check') {
      // Run all checks
      await Promise.all([
        check5xxSpike(),
        checkStripeWebhookFailures(),
        checkOpenAITimeouts()
      ]);

      return new Response(
        JSON.stringify({ 
          status: 'ok',
          message: 'Alert checks completed',
          time: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'GET') {
      // Get recent alerts
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ alerts }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Alerting error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message,
        time: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});