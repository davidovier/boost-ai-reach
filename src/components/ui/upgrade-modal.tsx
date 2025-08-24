import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
import { Loader2, TrendingUp, Zap, Users, Search, Sparkles, Crown } from 'lucide-react';

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

const planTiers = [
  {
    name: 'Pro',
    price: 29,
    features: ['3 websites', '4 scans/month', '10 AI tests', '1 competitor'],
    highlighted: true,
    stripePrice: 'price_pro_monthly' // You'll need to set this up in Stripe
  },
  {
    name: 'Growth',
    price: 99,
    features: ['10 websites', 'Daily scans', '50 AI tests', '5 competitors'],
    highlighted: false,
    stripePrice: 'price_growth_monthly' // You'll need to set this up in Stripe
  }
];

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  reachedLimits, 
  currentPlan = 'free' 
}: UpgradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (stripePrice: string, planName: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to upgrade your plan',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUpgrading(stripePrice);
      const origin = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: stripePrice,
          successUrl: `${origin}/subscription-success`,
          cancelUrl: `${origin}/pricing`
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: '🚀 Redirecting to checkout',
          description: `Upgrading to ${planName} plan...`,
          className: 'success-animation'
        });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Failed to start checkout',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive'
      });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
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
            {planTiers.map((plan) => (
              <div 
                key={plan.name}
                className={`relative p-4 border rounded-lg ${
                  plan.highlighted 
                    ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10' 
                    : 'border-border'
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-primary to-primary-glow">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleUpgrade(plan.stripePrice, plan.name)}
                    disabled={upgrading !== null}
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary' 
                        : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {upgrading === plan.stripePrice ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
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