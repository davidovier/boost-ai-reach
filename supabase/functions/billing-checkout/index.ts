import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateRequestBody,
  CreateCheckoutSchema,
  createValidationErrorResponse,
  validateRequest
} from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Pricing configuration
const PRICING_TIERS = {
  pro: {
    name: 'Pro Plan',
    amount: 2900, // $29.00 in cents
    interval: 'month' as const,
  },
  growth: {
    name: 'Growth Plan', 
    amount: 9900, // $99.00 in cents
    interval: 'month' as const,
  },
  enterprise: {
    name: 'Enterprise Plan',
    amount: 19900, // $199.00 in cents - you can adjust this
    interval: 'month' as const,
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request structure
  const requestValidation = validateRequest(req);
  if (!requestValidation.success) {
    return createValidationErrorResponse(requestValidation.error, corsHeaders);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createValidationErrorResponse('Method not allowed', corsHeaders);
  }

  try {
    console.log('Billing checkout function started');

    // Validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return createValidationErrorResponse("Invalid JSON in request body", corsHeaders);
    }

    const bodyValidation = validateRequestBody(CreateCheckoutSchema, requestBody);
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.error, corsHeaders, bodyValidation.details);
    }

    const { priceId, successUrl, cancelUrl, quantity = 1 } = bodyValidation.data;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!stripeSecretKey) {
      throw new Error('Missing Stripe Secret Key');
    }

    // Initialize Supabase client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const body = await req.json();
    const { priceId, plan } = body;

    if (!plan || !['pro', 'growth', 'enterprise'].includes(plan)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan. Must be one of: pro, growth, enterprise' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Creating checkout for plan:', plan);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log('Created new customer:', customerId);
    }

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
    const baseUrl = new URL(origin).origin;

    const pricingConfig = PRICING_TIERS[plan as keyof typeof PRICING_TIERS];

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pricingConfig.name,
              description: `Monthly subscription to ${pricingConfig.name}`,
            },
            unit_amount: pricingConfig.amount,
            recurring: {
              interval: pricingConfig.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=canceled`,
      metadata: {
        supabase_user_id: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: plan,
        },
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in billing-checkout function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});