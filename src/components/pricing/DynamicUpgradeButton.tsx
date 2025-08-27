import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Settings, Crown } from "lucide-react";
import { usePlanManagement } from "@/hooks/usePlanManagement";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DynamicUpgradeButtonProps {
  variant?: 'button' | 'card';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
  showCurrentPlan?: boolean;
}

export function DynamicUpgradeButton({ 
  variant = 'button', 
  size = 'default', 
  className,
  showCurrentPlan = false 
}: DynamicUpgradeButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentPlan,
    getNextPlan,
    shouldShowManageButton,
    openCustomerPortal,
    handleUpgrade
  } = usePlanManagement();

  const nextPlan = getNextPlan();

  const handleAction = async () => {
    try {
      if (shouldShowManageButton()) {
        await openCustomerPortal();
      } else if (nextPlan) {
        if (nextPlan.key === 'enterprise') {
          navigate('/account');
        } else {
          const result = await handleUpgrade(nextPlan.key);
          if (result.type === 'checkout' && result.url) {
            window.open(result.url, '_blank');
          }
        }
      } else {
        navigate('/pricing');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  };

  const getButtonText = () => {
    if (shouldShowManageButton()) {
      return 'Manage Subscription';
    }
    
    if (nextPlan) {
      return nextPlan.key === 'enterprise' 
        ? 'Contact Sales' 
        : `Upgrade to ${nextPlan.name}`;
    }
    
    return 'View Plans';
  };

  const getButtonIcon = () => {
    if (shouldShowManageButton()) {
      return <Settings className="h-4 w-4" />;
    }
    return <ArrowUp className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (shouldShowManageButton()) {
      return 'outline' as const;
    }
    return 'default' as const;
  };

  if (variant === 'card') {
    return (
      <div className={cn("p-4 rounded-xl bg-gradient-primary text-primary-foreground", className)}>
        {showCurrentPlan && (
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4" />
            <Badge variant="secondary" className="text-xs">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
            </Badge>
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm opacity-90">
            {shouldShowManageButton() 
              ? 'Manage your subscription settings'
              : nextPlan 
                ? `Ready to upgrade to ${nextPlan.name}?`
                : 'Explore all our plans'
            }
          </p>
          
          <Button
            onClick={handleAction}
            variant="secondary"
            size={size}
            className="w-full"
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAction}
      variant={getButtonVariant()}
      size={size}
      className={cn("gap-2", className)}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
}