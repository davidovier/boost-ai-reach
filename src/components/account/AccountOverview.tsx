import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Zap, 
  TrendingUp, 
  Crown,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface AccountOverviewProps {
  onTabChange: (tab: string) => void;
}

export function AccountOverview({ onTabChange }: AccountOverviewProps) {
  const { profile } = useAuth();
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return { name: 'Free', color: 'secondary', icon: null };
      case 'pro':
        return { name: 'Pro', color: 'default', icon: Zap };
      case 'max':
        return { name: 'Max', color: 'default', icon: Crown };
      default:
        return { name: plan, color: 'secondary', icon: null };
    }
  };

  const planInfo = getPlanInfo(profile?.plan || 'free');
  const PlanIcon = planInfo.icon;

  const isNearLimit = (current: number, max: number) => {
    if (max <= 0) return false;
    return (current / max) >= 0.8;
  };

  const formatUsage = (current: number, max: number) => {
    return max > 0 ? `${current}/${max}` : `${current}/∞`;
  };

  const getUsagePercentage = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0;
  };

  const quickActions = [
    {
      label: 'Upgrade Plan',
      description: 'Get more features and higher limits',
      icon: Crown,
      action: () => navigate('/pricing'),
      show: profile?.plan === 'free' || profile?.plan === 'pro'
    },
    {
      label: 'Manage Billing',
      description: 'View invoices and payment methods',
      icon: CreditCard,
      action: () => onTabChange('subscription'),
      show: profile?.plan !== 'free'
    },
    {
      label: 'View Usage',
      description: 'Detailed analytics and limits',
      icon: TrendingUp,
      action: () => onTabChange('usage'),
      show: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                {PlanIcon ? (
                  <PlanIcon className="h-6 w-6 text-primary" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">Welcome back, {profile?.name || 'User'}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={planInfo.color as "default" | "secondary"} className="capitalize">
                    {planInfo.name} Plan
                  </Badge>
                  {subscription?.subscription?.status === 'active' && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {profile?.plan !== 'max' && (
              <Button onClick={() => navigate('/pricing')} size="sm">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Usage Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {subscription?.usage?.prompt_count || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatUsage(
                    subscription?.usage?.prompt_count || 0,
                    subscription?.limits?.max_prompts || 0
                  )}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(
                  subscription?.usage?.prompt_count || 0,
                  subscription?.limits?.max_prompts || 0
                )}
                className="h-1"
              />
              {isNearLimit(
                subscription?.usage?.prompt_count || 0,
                subscription?.limits?.max_prompts || 0
              ) && (
                <p className="text-xs text-amber-600">Near limit</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {subscription?.usage?.scan_count || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatUsage(
                    subscription?.usage?.scan_count || 0,
                    subscription?.limits?.max_scans || 0
                  )}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(
                  subscription?.usage?.scan_count || 0,
                  subscription?.limits?.max_scans || 0
                )}
                className="h-1"
              />
              {isNearLimit(
                subscription?.usage?.scan_count || 0,
                subscription?.limits?.max_scans || 0
              ) && (
                <p className="text-xs text-amber-600">Near limit</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {subscription?.usage?.competitor_count || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatUsage(
                    subscription?.usage?.competitor_count || 0,
                    subscription?.limits?.max_competitors || 0
                  )}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(
                  subscription?.usage?.competitor_count || 0,
                  subscription?.limits?.max_competitors || 0
                )}
                className="h-1"
              />
              {profile?.plan === 'free' && (
                <p className="text-xs text-muted-foreground">Upgrade for competitor tracking</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {quickActions.filter(action => action.show).map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={action.action}
                >
                  <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Billing Info */}
      {subscription?.subscription?.current_period_end && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="text-muted-foreground">Next billing: </span>
                <span className="font-medium">
                  {new Date(subscription.subscription.current_period_end).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}