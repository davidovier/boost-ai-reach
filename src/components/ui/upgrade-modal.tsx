import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Zap, Users, Search, Sparkles, Crown, ArrowUp } from 'lucide-react';

interface UsageStatus {
  type: 'scan' | 'prompt' | 'competitor' | 'report';
  current: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reachedLimits: UsageStatus[];
  currentPlan?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'scan': return <Search className="h-4 w-4" />;
    case 'prompt': return <Zap className="h-4 w-4" />;
    case 'competitor': return <Users className="h-4 w-4" />;
    case 'report': return <TrendingUp className="h-4 w-4" />;
    default: return <TrendingUp className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'scan': return 'Website Scans';
    case 'prompt': return 'AI Tests';
    case 'competitor': return 'Competitors';
    case 'report': return 'Reports';
    default: return type;
  }
};

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  reachedLimits, 
  currentPlan = 'free' 
}: UpgradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  
  const {
    getUpgradeOptions,
    handleUpgrade,
    currentPlan: actualCurrentPlan
  } = usePlanManagement();

  const upgradeOptions = getUpgradeOptions();

  const handlePlanUpgrade = async (planKey: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to upgrade your plan',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUpgrading(planKey);
      const result = await handleUpgrade(planKey as any);
      
      if (result.type === 'checkout' && result.url) {
        window.open(result.url, '_blank');
        onOpenChange(false);
        toast({
          title: '🚀 Redirecting to checkout',
          description: `Upgrading to ${planKey} plan...`,
          className: 'success-animation'
        });
      } else if (result.type === 'contact') {
        onOpenChange(false);
        toast({
          title: 'Enterprise plan',
          description: 'Please contact our sales team for enterprise pricing',
        });
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Failed to start upgrade',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive'
      });
    } finally {
      setUpgrading(null);
    }
  };

  if (upgradeOptions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Already at Maximum Plan
            </DialogTitle>
            <DialogDescription className="text-center">
              You're already on our highest tier! Contact support if you need additional capacity.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-primary" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription>
            You've reached your usage limits. Upgrade to continue optimizing your AI findability.
          </DialogDescription>
        </DialogHeader>

        {/* Current Usage Status */}
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-3">
              Limits Reached
            </h4>
            <div className="space-y-3">
              {reachedLimits.map((limit) => (
                <div key={limit.type} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    {getTypeIcon(limit.type)}
                    <span className="font-medium text-sm">
                      {getTypeLabel(limit.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Progress 
                      value={100} 
                      className="flex-1 h-2 max-w-24"
                    />
                    <Badge variant="destructive" className="text-xs">
                      {limit.current}/{limit.limit}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            {upgradeOptions.map((option) => (
              <div 
                key={option.key}
                className={`relative p-4 border rounded-lg ${
                  option.key === 'pro' 
                    ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10' 
                    : 'border-border'
                }`}
              >
                {option.key === 'pro' && (
                  <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-primary to-primary-glow">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg capitalize">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Perfect for {option.key === 'pro' ? 'growing businesses' : 'larger teams'}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => handlePlanUpgrade(option.key)}
                    disabled={upgrading !== null}
                    className={`w-full ${
                      option.key === 'pro' 
                        ? 'bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary' 
                        : ''
                    }`}
                    variant={option.key === 'pro' ? 'default' : 'outline'}
                  >
                    {upgrading === option.key ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : option.key === 'enterprise' ? (
                      'Contact Sales'
                    ) : (
                      `Upgrade to ${option.name}`
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            disabled={upgrading !== null}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}