import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import { PLAN_PRICE_IDS } from '@/types/stripe';

export type PlanType = 'free' | 'pro' | 'growth' | 'enterprise';

interface PlanInfo {
  key: PlanType;
  name: string;
  priceId?: string;
  isCurrent: boolean;
  canUpgradeTo: boolean;
  isDowngrade: boolean;
}

export function usePlanManagement() {
  const { currentPlan, isSubscribed, data, createCheckout, openCustomerPortal } = useSubscription();

  const planHierarchy: PlanType[] = ['free', 'pro', 'growth', 'enterprise'];

  const currentPlanIndex = planHierarchy.indexOf(currentPlan as PlanType);

  const getPlanInfo = (planKey: PlanType): PlanInfo => {
    const planIndex = planHierarchy.indexOf(planKey);
    
    return {
      key: planKey,
      name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
      priceId: PLAN_PRICE_IDS[planKey],
      isCurrent: currentPlan === planKey,
      canUpgradeTo: planIndex > currentPlanIndex,
      isDowngrade: planIndex < currentPlanIndex && planIndex >= 0
    };
  };

  const getNextPlan = (): PlanInfo | null => {
    const nextIndex = currentPlanIndex + 1;
    if (nextIndex >= planHierarchy.length) return null;
    
    return getPlanInfo(planHierarchy[nextIndex]);
  };

  const getUpgradeOptions = (): PlanInfo[] => {
    return planHierarchy
      .slice(currentPlanIndex + 1)
      .map(plan => getPlanInfo(plan));
  };

  const handleUpgrade = async (planKey: PlanType) => {
    const planInfo = getPlanInfo(planKey);
    
    if (!planInfo.canUpgradeTo || !planInfo.priceId) {
      throw new Error('Invalid upgrade option');
    }

    if (planKey === 'enterprise') {
      // Handle enterprise plan contact
      return { type: 'contact' as const };
    }

    const result = await createCheckout(planInfo.priceId);
    return { type: 'checkout' as const, url: result.url };
  };

  const getUpgradeButtonText = (planKey?: PlanType): string => {
    if (!planKey) {
      const nextPlan = getNextPlan();
      return nextPlan ? `Upgrade to ${nextPlan.name}` : 'Manage Subscription';
    }

    const planInfo = getPlanInfo(planKey);
    
    if (planInfo.isCurrent) {
      return 'Current Plan';
    }
    
    if (planInfo.canUpgradeTo) {
      return planKey === 'enterprise' ? 'Contact Sales' : `Upgrade to ${planInfo.name}`;
    }
    
    if (planInfo.isDowngrade) {
      return 'Downgrade';
    }

    return 'Select Plan';
  };

  const shouldShowManageButton = (): boolean => {
    return isSubscribed && currentPlan !== 'free';
  };

  return {
    currentPlan: currentPlan as PlanType,
    currentPlanIndex,
    isSubscribed,
    data,
    getPlanInfo,
    getNextPlan,
    getUpgradeOptions,
    handleUpgrade,
    getUpgradeButtonText,
    shouldShowManageButton,
    openCustomerPortal,
    planHierarchy
  };
}