import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Zap,
  Crown,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export function UsageTab() {
  const { profile } = useAuth();
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();

  const formatUsage = (current: number, max: number) => {
    if (max <= 0) return `${current}/∞`;
    return `${current}/${max}`;
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageStatus = (current: number, max: number) => {
    if (max <= 0) return 'unlimited';
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    if (percentage >= 60) return 'caution';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'caution': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'unlimited': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'caution': return Clock;
      case 'unlimited': return Crown;
      default: return CheckCircle2;
    }
  };

  const usageData = [
    {
      name: 'AI Tests',
      current: subscription?.usage?.prompt_count || 0,
      max: subscription?.limits?.max_prompts || 0,
      icon: Zap,
      description: 'Test how AI models respond to queries about your business'
    },
    {
      name: 'Website Scans',
      current: subscription?.usage?.scan_count || 0,
      max: subscription?.limits?.max_scans || 0,
      icon: Activity,
      description: 'Analyze your website\'s AI findability optimization'
    },
    {
      name: 'Competitor Tracking',
      current: subscription?.usage?.competitor_count || 0,
      max: subscription?.limits?.max_competitors || 0,
      icon: TrendingUp,
      description: 'Monitor competitor AI visibility and performance'
    }
  ];

  const totalUsageScore = usageData.reduce((acc, item) => {
    const status = getUsageStatus(item.current, item.max);
    if (status === 'unlimited') return acc + 100;
    if (status === 'exceeded') return acc + 0;
    return acc + Math.max(0, 100 - getUsagePercentage(item.current, item.max));
  }, 0) / usageData.length;

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>Your monthly usage and remaining limits</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round(totalUsageScore)}%
              </div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Details */}
      <div className="space-y-4">
        {usageData.map((item, index) => {
          const Icon = item.icon;
          const status = getUsageStatus(item.current, item.max);
          const StatusIcon = getStatusIcon(status);
          const percentage = getUsagePercentage(item.current, item.max);
          
          return (
            <Card key={index} className={`border-l-4 ${getStatusColor(status).split(' ')[2] ? 'border-l-red-500' : status === 'warning' ? 'border-l-amber-500' : status === 'unlimited' ? 'border-l-purple-500' : 'border-l-green-500'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(status)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status === 'unlimited' ? 'Unlimited' : 
                     status === 'exceeded' ? 'Exceeded' :
                     status === 'warning' ? 'Near limit' :
                     status === 'caution' ? 'Moderate' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {item.current}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatUsage(item.current, item.max)}
                    </span>
                  </div>
                  
                  {item.max > 0 && (
                    <div className="space-y-1">
                      <Progress 
                        value={percentage}
                        className={`h-2 ${
                          status === 'exceeded' ? '[&>div]:bg-red-500' :
                          status === 'warning' ? '[&>div]:bg-amber-500' :
                          status === 'caution' ? '[&>div]:bg-blue-500' :
                          '[&>div]:bg-green-500'
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>{percentage.toFixed(1)}% used</span>
                        <span>{item.max}</span>
                      </div>
                    </div>
                  )}
                  
                  {item.max <= 0 && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Crown className="h-4 w-4" />
                      <span>Unlimited usage available</span>
                    </div>
                  )}

                  {status === 'exceeded' && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      You have exceeded your {item.name.toLowerCase()} limit. Upgrade your plan to continue.
                    </div>
                  )}

                  {status === 'warning' && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      You're approaching your {item.name.toLowerCase()} limit. Consider upgrading soon.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Optimize your usage and plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalUsageScore < 20 && profile?.plan !== 'max' && (
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
              <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-purple-900">Consider Upgrading</h4>
                <p className="text-sm text-purple-700 mt-1">
                  You're using most of your current plan limits. Upgrade for unlimited access and more features.
                </p>
                <Button size="sm" className="mt-2" onClick={() => navigate('/pricing')}>
                  View Plans
                </Button>
              </div>
            </div>
          )}

          {totalUsageScore > 80 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Great Usage Pattern</h4>
                <p className="text-sm text-green-700 mt-1">
                  You're efficiently using your plan limits. Your current plan seems well-suited to your needs.
                </p>
              </div>
            </div>
          )}

          {profile?.plan === 'free' && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Maximize Your Free Plan</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Make the most of your free monthly limits. Track competitors and generate reports with paid plans.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage History - Placeholder for future feature */}
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Track your usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Usage Analytics Coming Soon</h3>
            <p className="text-muted-foreground">
              Detailed usage analytics and trends will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}