import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  validateQueryParams,
  HealthQuerySchema,
  createValidationErrorResponse,
  validateRequest
} from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  console.log(`Health check request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request structure
  const requestValidation = validateRequest(req);
  if (!requestValidation.success) {
    return createValidationErrorResponse(requestValidation.error, corsHeaders);
  }

  if (req.method !== 'GET') {
    return createValidationErrorResponse('Method not allowed', corsHeaders);
  }

  // Validate query parameters
  const { url } = requestValidation;
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validation = validateQueryParams(HealthQuerySchema, queryParams);
  
  if (!validation.success) {
    return createValidationErrorResponse(validation.error, corsHeaders, validation.details);
  }

  const { deep } = validation.data;

  try {
    // Verify critical environment variables exist
    const requiredEnvs = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_DB_URL'
    ];

    // Optional but recommended environment variables
    const optionalEnvs = [
      'STRIPE_SECRET_KEY',
      'OPENAI_API_KEY'
    ];

    const missingOptional = optionalEnvs.filter(env => !Deno.env.get(env));

    const missingEnvs = requiredEnvs.filter(env => !Deno.env.get(env));
    
    if (missingEnvs.length > 0) {
      console.error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'Missing required environment variables',
          missing: missingEnvs,
          time: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log warnings for missing optional env vars (don't fail)
    if (missingOptional.length > 0) {
      console.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
    }

    // Health check response
    const response = {
      status: 'ok',
      time: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: true,
        stripe: !!Deno.env.get('STRIPE_SECRET_KEY'),
        openai: !!Deno.env.get('OPENAI_API_KEY')
      },
      warnings: missingOptional.length > 0 ? `Missing optional: ${missingOptional.join(', ')}` : null
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Internal server error',
        time: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});