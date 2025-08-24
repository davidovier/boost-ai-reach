import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UsageData {
  scan_count: number;
  prompt_count: number;
  competitor_count: number;
  report_count: number;
}

interface PlanLimits {
  max_scans: number;
  max_prompts: number;
  max_competitors: number;
  max_sites: number;
}

interface UsageStatus {
  type: 'scan' | 'prompt' | 'competitor' | 'report';
  current: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean; // >= 80%
  isAtLimit: boolean;   // >= 100%
}

export function useUsageLimits() {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchUsageAndLimits();
    }
  }, [user, profile]);

  const fetchUsageAndLimits = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);

      // Fetch current usage
      const { data: usageData, error: usageError } = await supabase
        .from('usage_metrics')
        .select('scan_count, prompt_count, competitor_count, report_count')
        .eq('user_id', user.id)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }

      // Fetch plan limits
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('max_scans, max_prompts, max_competitors, max_sites')
        .eq('name', profile.plan)
        .single();

      if (planError) {
        throw planError;
      }

      setUsage(usageData || {
        scan_count: 0,
        prompt_count: 0,
        competitor_count: 0,
        report_count: 0,
      });
      setLimits(planData);
    } catch (error) {
      console.error('Error fetching usage and limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageStatus = (): UsageStatus[] => {
    if (!usage || !limits) return [];

    const statuses: UsageStatus[] = [
      {
        type: 'scan',
        current: usage.scan_count,
        limit: limits.max_scans,
        percentage: (usage.scan_count / limits.max_scans) * 100,
        isNearLimit: (usage.scan_count / limits.max_scans) >= 0.8,
        isAtLimit: usage.scan_count >= limits.max_scans,
      },
      {
        type: 'prompt',
        current: usage.prompt_count,
        limit: limits.max_prompts,
        percentage: (usage.prompt_count / limits.max_prompts) * 100,
        isNearLimit: (usage.prompt_count / limits.max_prompts) >= 0.8,
        isAtLimit: usage.prompt_count >= limits.max_prompts,
      },
      {
        type: 'competitor',
        current: usage.competitor_count,
        limit: limits.max_competitors,
        percentage: (usage.competitor_count / limits.max_competitors) * 100,
        isNearLimit: (usage.competitor_count / limits.max_competitors) >= 0.8,
        isAtLimit: usage.competitor_count >= limits.max_competitors,
      },
    ];

    return statuses.filter(status => status.limit > 0);
  };

  const hasNearLimitWarnings = () => {
    return getUsageStatus().some(status => status.isNearLimit && !status.isAtLimit);
  };

  const hasReachedLimits = () => {
    return getUsageStatus().some(status => status.isAtLimit);
  };

  const getReachedLimits = () => {
    return getUsageStatus().filter(status => status.isAtLimit);
  };

  const getNearLimitWarnings = () => {
    return getUsageStatus().filter(status => status.isNearLimit && !status.isAtLimit);
  };

  const refresh = () => {
    fetchUsageAndLimits();
  };

  return {
    usage,
    limits,
    loading,
    getUsageStatus,
    hasNearLimitWarnings,
    hasReachedLimits,
    getReachedLimits,
    getNearLimitWarnings,
    refresh,
  };
}