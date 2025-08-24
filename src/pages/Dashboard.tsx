import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Sparkline, ProgressArc } from '@/components/ui/sparkline';
import { Activity, TrendingUp, Zap, Search } from 'lucide-react';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorTestTrigger } from '@/components/ErrorTestTrigger';

interface ActivityItem {
  id: string;
  type: 'scan' | 'prompt' | 'report';
  title: string;
  timestamp: string;
  status?: 'completed' | 'failed' | 'processing';
}

export default function Dashboard() {
  const { data: subscription, loading } = useSubscription();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Dashboard', item: `${origin}/dashboard` },
  ]);

  // Mock recent activities - in real app this would come from API
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'scan',
        title: 'Website scan completed for example.com',
        timestamp: '2 hours ago',
        status: 'completed'
      },
      {
        id: '2', 
        type: 'prompt',
        title: 'AI test: "Best CRM software"',
        timestamp: '1 day ago',
        status: 'completed'
      },
      {
        id: '3',
        type: 'report',
        title: 'Monthly report generated',
        timestamp: '3 days ago', 
        status: 'completed'
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setActivitiesLoading(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan': return <Search className="h-4 w-4" />;
      case 'prompt': return <Zap className="h-4 w-4" />;
      case 'report': return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed': return <Badge variant="secondary" className="text-xs">Completed</Badge>;
      case 'failed': return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'processing': return <Badge variant="outline" className="text-xs">Processing</Badge>;
      default: return null;
    }
  };

  return (
    <PageErrorBoundary context="Dashboard">
      <SEO 
        title="Dashboard - FindableAI"
        description="Monitor your AI findability optimization progress with real-time analytics and insights."
        url="/dashboard"
        noindex={true}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }}
      />
      
      <div className="space-y-6 sm:space-y-8 dashboard-mobile">
        <header className="text-mobile">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground heading-responsive">Dashboard</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-responsive">
            Overview of your AI findability optimization
          </p>
        </header>

        {/* Error Test Section (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <ErrorTestTrigger className="mb-6" />
        )}

        {/* KPI Cards */}
        <ComponentErrorBoundary context="KPI Cards">
          <section aria-labelledby="kpi-heading" className="card-mobile">
            <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* AI Findability Score */}
              <div className="kpi-card animate-fade-in">
                <div className="kpi-header">
                  <div className="kpi-icon">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="kpi-trend positive">
                    <TrendingUp className="h-4 w-4" />
                    +5%
                  </div>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={87} />
                </div>
                <div className="kpi-label">AI Findability Score</div>
                <div className="kpi-chart">
                  <Sparkline 
                    data={[65, 70, 68, 75, 82, 79, 87]} 
                    width={120} 
                    height={40}
                  />
                </div>
              </div>

              {/* Total Sites */}
              <div className="kpi-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="kpi-header">
                  <div className="kpi-icon">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="kpi-trend positive">
                    <TrendingUp className="h-4 w-4" />
                    +12%
                  </div>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={24} />
                </div>
                <div className="kpi-label">Total Sites</div>
                <div className="kpi-chart">
                  <ProgressArc percentage={75} size={60} />
                </div>
              </div>

              {/* AI Tests */}
              <div className="kpi-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="kpi-header">
                  <div className="kpi-icon">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="kpi-trend neutral">
                    {subscription?.usage?.prompt_count || 0} / {subscription?.limits?.max_prompts || 1}
                  </div>
                </div>
                <div className="kpi-value">
                  <AnimatedCounter value={subscription?.usage?.prompt_count || 0} />
                </div>
                <div className="kpi-label">AI Tests Run</div>
                <div className="kpi-chart">
                  <ProgressArc 
                    percentage={Math.min(100, ((subscription?.usage?.prompt_count || 0) / (subscription?.limits?.max_prompts || 1)) * 100)} 
                    size={60} 
                  />
                </div>
              </div>

              {/* Last Scan Status */}
              <div className="kpi-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="kpi-header">
                  <div className="kpi-icon">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="kpi-trend positive">
                    2hrs ago
                  </div>
                </div>
                <div className="kpi-value">
                  Active
                </div>
                <div className="kpi-label">Last Scan Status</div>
                <div className="kpi-chart">
                  <Sparkline 
                    data={[40, 65, 45, 70, 85, 90, 95]} 
                    width={120} 
                    height={40}
                  />
                </div>
              </div>
            </div>
          </section>
        </ComponentErrorBoundary>

        {/* Recent Activity */}
        <ComponentErrorBoundary context="Recent Activity">
          <section aria-labelledby="activity-heading" className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="card-dashboard">
              <div className="card-header">
                <h3 id="activity-heading">Recent Activity</h3>
                <p>Your latest scans, tests, and reports</p>
              </div>
              <div className="card-content">
                {activitiesLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 sm:space-x-4">
                        <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-3 sm:h-4 w-3/4" />
                          <Skeleton className="h-2 sm:h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <ul className="space-y-4" role="list">
                    {activities.map((activity, index) => (
                      <li 
                        key={activity.id} 
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary shadow-sm text-primary-foreground">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {activity.timestamp} • {getStatusBadge(activity.status)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-secondary mx-auto mb-4">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Start by scanning your first website or running an AI test.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </ComponentErrorBoundary>

        {/* Additional Actions */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 spacing-mobile">
          {/* Quick Actions */}
          <div className="card-dashboard animate-fade-in card-mobile" style={{ animationDelay: '0.5s' }}>
            <div className="card-header">
              <h3 className="heading-responsive">Quick Actions</h3>
              <p className="text-responsive">Start optimizing your AI findability</p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 gap-3 btn-mobile">
                <button className="group flex items-start p-4 rounded-lg border border-border hover:border-primary bg-gradient-card hover:bg-gradient-secondary transition-all duration-200 text-left interactive touch-target">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground mr-4 group-hover:scale-105 transition-transform">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Run New Scan</div>
                    <div className="text-sm text-muted-foreground text-responsive">Analyze your website's AI findability</div>
                  </div>
                </button>
                <button className="group flex items-start p-4 rounded-lg border border-border hover:border-primary bg-gradient-card hover:bg-gradient-secondary transition-all duration-200 text-left interactive touch-target">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground mr-4 group-hover:scale-105 transition-transform">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Test AI Prompt</div>
                    <div className="text-sm text-muted-foreground text-responsive">See how AI models respond to queries</div>
                  </div>
                </button>
                <button className="group flex items-start p-4 rounded-lg border border-border hover:border-primary bg-gradient-card hover:bg-gradient-secondary transition-all duration-200 text-left interactive touch-target">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-accent-foreground mr-4 group-hover:scale-105 transition-transform">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">View Reports</div>
                    <div className="text-sm text-muted-foreground text-responsive">Download detailed optimization reports</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="card-dashboard animate-fade-in card-mobile" style={{ animationDelay: '0.6s' }}>
            <div className="card-header">
              <h3 className="heading-responsive">Plan Status</h3>
              <p className="text-responsive">Current usage and limits</p>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-secondary">
                  <div>
                    <div className="font-semibold text-foreground capitalize">
                      Free Plan
                    </div>
                    <div className="text-sm text-muted-foreground text-responsive">
                      Your current subscription
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      Free
                    </div>
                  </div>
                </div>

                {/* Usage Progress */}
                <div className="space-y-4 animated-progress">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>AI Tests</span>
                      <span>{subscription?.usage?.prompt_count || 0} / {subscription?.limits?.max_prompts || 1}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="progress-fill bg-gradient-primary h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, ((subscription?.usage?.prompt_count || 0) / (subscription?.limits?.max_prompts || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Sites</span>
                      <span>0 / {subscription?.limits?.max_sites || 1}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="progress-fill bg-gradient-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button className="w-full p-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 interactive touch-target btn-responsive">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}