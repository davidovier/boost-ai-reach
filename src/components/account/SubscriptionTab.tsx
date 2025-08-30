import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  ExternalLink, 
  Loader2, 
  Crown,
  Zap,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function SubscriptionTab() {
  const { profile } = useAuth();
  const { data: subscription, loading: subscriptionLoading, openCustomerPortal } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      await openCustomerPortal();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { 
          name: 'Free', 
          color: 'secondary', 
          icon: CheckCircle2,
          price: '$0',
          features: ['1 website', '1 scan/month', '1 AI test/month', 'Basic tips']
        };
      case 'pro':
        return { 
          name: 'Pro', 
          color: 'default', 
          icon: Zap,
          price: '$29/month',
          features: ['5 websites', '10 scans/month', '25 AI tests/month', '3 competitors', 'Advanced tips']
        };
      case 'max':
        return { 
          name: 'Max', 
          color: 'default', 
          icon: Crown,
          price: '$99/month',
          features: ['Unlimited websites', 'Unlimited scans', 'Unlimited AI tests', 'Unlimited competitors', 'Priority support', 'Custom reports', 'API access']
        };
      default:
        return { 
          name: plan, 
          color: 'secondary', 
          icon: CheckCircle2,
          price: 'Custom',
          features: []
        };
    }
  };

  const currentPlan = getPlanInfo(profile?.plan || 'free');
  const CurrentIcon = currentPlan.icon;

  const getNextPlan = () => {
    const current = profile?.plan || 'free';
    if (current === 'free') return getPlanInfo('pro');
    if (current === 'pro') return getPlanInfo('max');
    return null;
  };

  const nextPlan = getNextPlan();
  const NextIcon = nextPlan?.icon;

  const isSubscriptionActive = subscription?.subscription?.status === 'active';

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <CurrentIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentPlan.name} Plan
                  <Badge variant={currentPlan.color as "default" | "secondary"} className="ml-2">
                    {currentPlan.price}
                  </Badge>
                </CardTitle>
                <CardDescription>Your current subscription plan</CardDescription>
              </div>
            </div>
            {nextPlan && (
              <Button onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to {nextPlan.name}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <h4 className="text-sm font-medium">Plan includes:</h4>
              <ul className="grid gap-1 text-sm text-muted-foreground">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subscription Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={isSubscriptionActive ? 'default' : 'secondary'}>
                {subscription?.subscription?.status === 'active' ? 'Active' : 'Free Plan'}
              </Badge>
            </div>
            
            {subscription?.subscription?.current_period_start && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current period</span>
                <span className="text-sm">
                  {new Date(subscription.subscription.current_period_start).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {subscription?.subscription?.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next billing</span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(subscription.subscription.current_period_end).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.ceil((new Date(subscription.subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Billing Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleManageBilling} 
              disabled={portalLoading || profile?.plan === 'free'}
              className="w-full"
            >
              {portalLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {profile?.plan === 'free' ? 'No Billing (Free Plan)' : 'Manage Billing'}
            </Button>
            
            {profile?.plan === 'free' && (
              <p className="text-xs text-muted-foreground text-center">
                Upgrade to a paid plan to access billing management
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Recommendation */}
      {nextPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Upgrade to {nextPlan.name}</CardTitle>
                <CardDescription>Unlock more features and higher limits</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{nextPlan.price}</span>
                  {NextIcon && <NextIcon className="h-5 w-5 text-purple-500" />}
                </div>
                <ul className="grid gap-1 text-sm">
                  {nextPlan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                  {nextPlan.features.length > 4 && (
                    <li className="text-xs text-muted-foreground ml-5">
                      +{nextPlan.features.length - 4} more features
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => navigate('/pricing')} className="flex-1">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  Compare Plans
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Warnings */}
      {subscription?.usage && (
        <div className="space-y-3">
          {subscription.limits?.max_prompts && 
           subscription.usage.prompt_count >= subscription.limits.max_prompts * 0.8 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You're using {Math.round((subscription.usage.prompt_count / subscription.limits.max_prompts) * 100)}% 
                of your AI test limit ({subscription.usage.prompt_count}/{subscription.limits.max_prompts}). 
                Consider upgrading to avoid interruption.
              </AlertDescription>
            </Alert>
          )}
          
          {subscription.limits?.max_scans && 
           subscription.usage.scan_count >= subscription.limits.max_scans * 0.8 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You're using {Math.round((subscription.usage.scan_count / subscription.limits.max_scans) * 100)}% 
                of your scan limit ({subscription.usage.scan_count}/{subscription.limits.max_scans}). 
                Consider upgrading to avoid interruption.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}