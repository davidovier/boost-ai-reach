import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown } from "lucide-react";
import { usePlanManagement, PlanType } from "@/hooks/usePlanManagement";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  planKey: PlanType;
  className?: string;
}

export function PlanCard({ planKey, className }: PlanCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const {
    getPlanInfo,
    getUpgradeButtonText,
    handleUpgrade,
    shouldShowManageButton,
    openCustomerPortal
  } = usePlanManagement();

  const planInfo = getPlanInfo(planKey);
  const planName = t(`pricing.plans.${planKey}.name`);
  const planPrice = t(`pricing.plans.${planKey}.price`);
  const planPeriod = t(`pricing.plans.${planKey}.period`);
  const planFeatures = Array.isArray(t(`pricing.plans.${planKey}.features`)) 
    ? (t(`pricing.plans.${planKey}.features`) as unknown as string[])
    : [];
  const planPopular = planKey === 'pro' ? t(`pricing.plans.${planKey}.popular`) : '';

  const handlePlanAction = async () => {
    try {
      if (planInfo.isCurrent && shouldShowManageButton()) {
        await openCustomerPortal();
        return;
      }

      if (planKey === 'free') {
        navigate('/onboarding');
        return;
      }

      if (planKey === 'enterprise') {
        navigate('/account');
        return;
      }

      if (planInfo.canUpgradeTo) {
        const result = await handleUpgrade(planKey);
        
        if (result.type === 'checkout' && result.url) {
          window.open(result.url, '_blank');
        }
      } else if (planInfo.isDowngrade) {
        await openCustomerPortal();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  };

  const getButtonVariant = () => {
    if (planInfo.isCurrent) return 'outline';
    if (planKey === 'enterprise') return 'secondary';
    return 'default';
  };

  const getCardStyles = () => {
    if (planInfo.isCurrent) {
      return 'ring-2 ring-primary shadow-lg scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10';
    }
    return 'hover:shadow-lg transition-all duration-300';
  };

  return (
    <article 
      className={cn(
        "plan-card rounded-xl border bg-card p-6 text-card-foreground shadow-sm relative",
        getCardStyles(),
        className
      )}
    >
      {/* Popular badge for Pro plan */}
      {planKey === 'pro' && !planInfo.isCurrent && (
        <Badge 
          className="absolute -top-3 right-4 bg-primary text-primary-foreground shadow-md"
          variant="default"
        >
          <Star className="h-3.5 w-3.5 mr-1" /> 
          {planPopular}
        </Badge>
      )}
      
      {/* Current plan badge */}
      {planInfo.isCurrent && (
        <Badge 
          className="absolute -top-3 left-4 bg-green-600 text-white shadow-md animate-pulse"
          variant="default"
        >
          <Crown className="h-3.5 w-3.5 mr-1" />
          Current Plan
        </Badge>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {planName}
            {planInfo.isCurrent && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            )}
          </h2>
          <p className="mt-2 text-3xl font-bold">
            {planPrice}
            <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
              {planPeriod}
            </span>
          </p>
        </div>

        <ul className="space-y-2 text-sm">
          {planFeatures.map((feature: string) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          <Button 
            size="lg" 
            className="w-full" 
            variant={getButtonVariant()}
            onClick={handlePlanAction}
            disabled={planInfo.isCurrent && !shouldShowManageButton()}
          >
            {getUpgradeButtonText(planKey)}
          </Button>
          
          {planInfo.isCurrent && shouldShowManageButton() && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Click to manage your subscription
            </p>
          )}
        </div>
      </div>
    </article>
  );
}