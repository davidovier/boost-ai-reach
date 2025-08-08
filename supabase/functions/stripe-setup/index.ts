import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlanConfig {
  name: string;
  price: number; // in cents
  description: string;
}

const PLANS: Record<string, PlanConfig> = {
  pro: {
    name: "Pro Plan",
    price: 2900, // $29.00
    description: "3 sites, 10 AI prompts, 4 scans/month, 1 competitor",
  },
  growth: {
    name: "Growth Plan", 
    price: 9900, // $99.00
    description: "10 sites, 50 AI prompts, 30 scans/month, 5 competitors",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const results: Record<string, { productId: string; priceId: string }> = {};

    // Create products and prices for each plan
    for (const [planKey, config] of Object.entries(PLANS)) {
      try {
        // Create product
        const product = await stripe.products.create({
          name: config.name,
          description: config.description,
          metadata: {
            plan: planKey,
            app: "findable-ai",
          },
        });

        // Create monthly price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: config.price,
          currency: "usd",
          recurring: {
            interval: "month",
          },
          metadata: {
            plan: planKey,
            app: "findable-ai",
          },
        });

        results[planKey] = {
          productId: product.id,
          priceId: price.id,
        };

        console.log(`Created ${planKey} plan:`, {
          productId: product.id,
          priceId: price.id,
        });
      } catch (error) {
        console.error(`Error creating ${planKey} plan:`, error);
        // Continue with other plans even if one fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      plans: results,
      message: "Stripe products and prices created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stripe setup error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to setup Stripe products",
      details: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});