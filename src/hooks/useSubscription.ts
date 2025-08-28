import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionData {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    plan: string;
  };
  subscription: {
    id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    plan: string;
    status: string;
    current_period_end: string;
  } | null;
  usage: {
    scan_count: number;
    prompt_count: number;
    competitor_count: number;
    report_count: number;
  };
  limits: {
    max_sites: number | null;
    max_prompts: number | null;
    max_scans: number | null;
    max_competitors: number | null;
  } | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: response, error } = await supabase.functions.invoke('get-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setData(response as SubscriptionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchSubscriptionData, 30000);
    
    return () => clearInterval(interval);
  }, [session]);

  const createCheckout = async (priceId: string) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data: response, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId,
        successUrl: `${window.location.origin}/subscription-success`,
        cancelUrl: `${window.location.origin}/pricing`,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Refresh subscription data after a short delay to account for webhook processing
    setTimeout(() => {
      fetchSubscriptionData();
    }, 2000);

    return response;
  };

  const openCustomerPortal = async () => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data: response, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Open customer portal in new tab
    window.open(response.url, '_blank');
  };

  const canPerformAction = (action: 'scans' | 'prompts' | 'competitors' | 'sites'): boolean => {
    if (!data) return false;

    const { usage, limits } = data;
    
    if (!limits) return true; // Unlimited for enterprise

    switch (action) {
      case 'scans':
        return limits.max_scans === null || usage.scan_count < limits.max_scans;
      case 'prompts':
        return limits.max_prompts === null || usage.prompt_count < limits.max_prompts;
      case 'competitors':
        return limits.max_competitors === null || usage.competitor_count < limits.max_competitors;
      case 'sites':
        // This would need to be checked against actual site count
        return limits.max_sites === null;
      default:
        return false;
    }
  };

  const getUsagePercentage = (action: 'scans' | 'prompts' | 'competitors'): number => {
    if (!data || !data.limits) return 0;

    const { usage, limits } = data;
    
    switch (action) {
      case 'scans':
        return limits.max_scans ? (usage.scan_count / limits.max_scans) * 100 : 0;
      case 'prompts':
        return limits.max_prompts ? (usage.prompt_count / limits.max_prompts) * 100 : 0;
      case 'competitors':
        return limits.max_competitors ? (usage.competitor_count / limits.max_competitors) * 100 : 0;
      default:
        return 0;
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchSubscriptionData,
    createCheckout,
    openCustomerPortal,
    canPerformAction,
    getUsagePercentage,
    isSubscribed: data?.subscription?.status === 'active',
    currentPlan: data?.user?.plan || 'free',
  };
}