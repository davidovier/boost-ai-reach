export interface StripeProduct {
  id: string;
  name: string;
  description: string;
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
    interval_count: number;
  };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: StripePrice;
    }>;
  };
}

export interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

export interface PlanLimits {
  max_sites: number | null;
  max_prompts: number | null;
  max_scans: number | null;
  max_competitors: number | null;
}

export const PLAN_PRICE_IDS = {
  free: null, // Free plan has no Stripe price
  pro: null, // Will be set when prices are created
  growth: null, // Will be set when prices are created
  enterprise: null, // Enterprise is custom pricing
} as const;

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    max_sites: 1,
    max_prompts: 1,
    max_scans: 1,
    max_competitors: 0,
  },
  pro: {
    max_sites: 3,
    max_prompts: 10,
    max_scans: 4,
    max_competitors: 1,
  },
  growth: {
    max_sites: 10,
    max_prompts: 50,
    max_scans: 30,
    max_competitors: 5,
  },
  enterprise: {
    max_sites: null, // Unlimited
    max_prompts: null, // Unlimited
    max_scans: null, // Unlimited
    max_competitors: null, // Unlimited
  },
};