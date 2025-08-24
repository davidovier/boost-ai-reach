import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logEvent } from "../_shared/event-logger.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// Plan mapping from Stripe price to plan name
const getPlanFromPrice = async (priceId: string): Promise<string> => {
  try {
    const price = await stripe.prices.retrieve(priceId);
    const planFromMetadata = price.metadata?.plan;
    if (planFromMetadata) {
      return planFromMetadata;
    }
    
    // Fallback: map by amount
    const amount = price.unit_amount || 0;
    if (amount === 2900) return 'pro';
    if (amount === 9900) return 'growth';
    return 'free';
  } catch (error) {
    console.error('Error retrieving price:', error);
    return 'free';
  }
};

const resetUsageMetrics = async (userId: string) => {
  const { error } = await supabase
    .from('usage_metrics')
    .update({
      scan_count: 0,
      prompt_count: 0,
      competitor_count: 0,
      report_count: 0,
      last_reset: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error resetting usage metrics:', error);
  }
};

const updateUserPlan = async (userId: string, plan: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      plan: plan as any, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
};

const handleSubscriptionEvent = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  const plan = await getPlanFromPrice(priceId);
  const status = subscription.status;

  // Update or insert subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan: plan as any,
      status: status as any,
      started_at: new Date(subscription.start_date * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
    throw subscriptionError;
  }

  // Update user's plan in profiles
  if (status === 'active') {
    // Get current plan for comparison
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    const previousPlan = currentProfile?.plan || 'free';
    
    await updateUserPlan(userId, plan);
    // Reset usage metrics when plan becomes active
    await resetUsageMetrics(userId);

    // Log plan upgrade event if it's actually an upgrade
    if (plan !== previousPlan) {
      await logEvent(supabase, userId, 'plan_upgraded', {
        from_plan: previousPlan,
        to_plan: plan,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        billing_cycle: subscription.items.data[0]?.price.recurring?.interval || 'monthly',
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        subscription_status: status
      });
    }
  } else if (status === 'canceled' || status === 'unpaid') {
    // Downgrade to free plan
    await updateUserPlan(userId, 'free');
  }

  console.log(`Updated subscription for user ${userId}: ${plan} (${status})`);
};

const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  if (session.mode === 'subscription' && session.subscription) {
    // Retrieve the subscription to get full details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await handleSubscriptionEvent(subscription);
  }

  console.log(`Checkout completed for user ${userId}`);
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const userId = deletedSubscription.metadata.user_id;
        if (userId) {
          // Mark subscription as canceled and downgrade to free
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', deletedSubscription.id);

          await updateUserPlan(userId, 'free');
          console.log(`Subscription canceled for user ${userId}`);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
          const userId = subscription.metadata.user_id;
          if (userId) {
            // Update subscription status
            await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);
            
            console.log(`Payment failed for user ${userId}`);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const succeededInvoice = event.data.object as Stripe.Invoice;
        if (succeededInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(succeededInvoice.subscription as string);
          await handleSubscriptionEvent(subscription);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});