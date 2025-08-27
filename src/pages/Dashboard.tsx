import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Sparkline, ProgressArc } from '@/components/ui/sparkline';
import { Activity, TrendingUp, Zap, Search, Globe } from 'lucide-react';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorTestTrigger } from '@/components/ErrorTestTrigger';
import { EmptyActivity } from '@/components/ui/empty-states';
import { UsageLimitBanner } from '@/components/ui/usage-limit-banner';
import { InviteFriend } from '@/components/referral/InviteFriend';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { UsageTracker } from '@/components/dashboard/UsageTracker';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'scan' | 'prompt' | 'report';
  title: string;
  timestamp: string;
  status?: 'completed' | 'failed' | 'processing';
  created_at: string;
}

interface DashboardMetrics {
  aiScore: number;
  totalSites: number;
  aiTests: number;
  lastScanStatus: string;
  lastScanTime: string | null;
  scoreTrend: number[];
}

interface UsageData {
  scanCount: number;
  promptCount: number;
  competitorCount: number;
  reportCount: number;
  maxScans: number;
  maxPrompts: number;
  maxSites: number;
  maxCompetitors: number;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { hasNearLimitWarnings, getNearLimitWarnings } = useUsageLimits();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    aiScore: 0,
    totalSites: 0,
    aiTests: 0,
    lastScanStatus: 'No scans yet',
    lastScanTime: null,
    scoreTrend: []
  });
  const [usageData, setUsageData] = useState<UsageData>({
    scanCount: 0,
    promptCount: 0,
    competitorCount: 0,
    reportCount: 0,
    maxScans: 1,
    maxPrompts: 1,
    maxSites: 1,
    maxCompetitors: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(true);
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Dashboard', item: `${origin}/dashboard` },
  ]);

  // Fetch real user data
  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        await Promise.all([
          fetchRecentActivities(),
          fetchDashboardMetrics(),
          fetchUsageData()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setActivitiesLoading(false);
        setMetricsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const fetchRecentActivities = async () => {
    if (!user) return;

    const activities: ActivityItem[] = [];

    // Fetch recent scans (increased limit to capture more activities)
    const { data: scans } = await supabase
      .from('scans')
      .select(`
        id, scan_date, created_at,
        sites:site_id (name, url)
      `)
      .order('scan_date', { ascending: false })
      .limit(10);

    scans?.forEach(scan => {
      activities.push({
        id: scan.id,
        type: 'scan',
        title: `Website scan completed for ${scan.sites?.name || scan.sites?.url || 'unknown site'}`,
        timestamp: format(new Date(scan.scan_date), 'MMM d, yyyy'),
        status: 'completed',
        created_at: scan.created_at
      });
    });

    // Fetch recent prompts (increased limit to capture more activities)
    const { data: prompts } = await supabase
      .from('prompt_simulations')
      .select('id, prompt, run_date')
      .order('run_date', { ascending: false })
      .limit(10);

    prompts?.forEach(prompt => {
      activities.push({
        id: prompt.id,
        type: 'prompt',
        title: `AI test: "${prompt.prompt.length > 50 ? prompt.prompt.substring(0, 50) + '...' : prompt.prompt}"`,
        timestamp: format(new Date(prompt.run_date), 'MMM d, yyyy'),
        status: 'completed',
        created_at: prompt.run_date
      });
    });

    // Fetch recent reports (increased limit to capture more activities)
    const { data: reports } = await supabase
      .from('reports')
      .select('id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);

    reports?.forEach(report => {
      activities.push({
        id: report.id,
        type: 'report',
        title: 'Report generated',
        timestamp: format(new Date(report.created_at), 'MMM d, yyyy'),
        status: report.status === 'success' ? 'completed' : report.status === 'failed' ? 'failed' : 'processing',
        created_at: report.created_at
      });
    });

    // Sort all activities by created_at to get the truly most recent across all categories
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setActivities(activities.slice(0, 5));
  };

  const fetchDashboardMetrics = async () => {
    if (!user) return;

    // Get total sites count
    const { count: sitesCount } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true });

    // Get recent scans with scores for trend calculation
    const { data: recentScans } = await supabase
      .from('scans')
      .select('ai_findability_score, scan_date')
      .order('scan_date', { ascending: false })
      .limit(7);

    // Get latest scan for last scan status
    const { data: latestScan } = await supabase
      .from('scans')
      .select(`
        scan_date, ai_findability_score,
        sites:site_id (name)
      `)
      .order('scan_date', { ascending: false })
      .limit(1)
      .single();

    // Calculate average AI score from recent scans
    const validScores = recentScans?.filter(s => s.ai_findability_score !== null) || [];
    const avgScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, s) => sum + (s.ai_findability_score || 0), 0) / validScores.length)
      : 0;

    // Create score trend data
    const scoreTrend = recentScans?.map(s => s.ai_findability_score || 0).reverse() || [];

    // Get AI tests count
    const { count: promptsCount } = await supabase
      .from('prompt_simulations')
      .select('*', { count: 'exact', head: true });

    setMetrics({
      aiScore: avgScore,
      totalSites: sitesCount || 0,
      aiTests: promptsCount || 0,
      lastScanStatus: latestScan ? 'Active' : 'No scans yet',
      lastScanTime: latestScan?.scan_date || null,
      scoreTrend: scoreTrend.length > 0 ? scoreTrend : [0]
    });
  };

  const fetchUsageData = async () => {
    if (!user || !profile) return;

    // Get usage metrics
    const { data: usage } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get plan limits
    const { data: planLimits } = await supabase
      .from('plans')
      .select('*')
      .eq('name', profile.plan)
      .single();

    setUsageData({
      scanCount: usage?.scan_count || 0,
      promptCount: usage?.prompt_count || 0,
      competitorCount: usage?.competitor_count || 0,
      reportCount: usage?.report_count || 0,
      maxScans: planLimits?.max_scans || 1,
      maxPrompts: planLimits?.max_prompts || 1,
      maxSites: planLimits?.max_sites || 1,
      maxCompetitors: planLimits?.max_competitors || 0
    });
  };

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
        title="Dashboard"
        description="Monitor your AI findability optimization progress with real-time analytics, usage metrics, and actionable insights."
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

        {/* Usage Limit Warnings */}
        {hasNearLimitWarnings() && (
          <UsageLimitBanner warnings={getNearLimitWarnings()} />
        )}

        {/* Onboarding Guide for New Users */}
        {metrics.totalSites === 0 && !metricsLoading && (
          <div className="animate-fade-in">
            <OnboardingChecklist 
              className="mb-6" 
              onComplete={() => {
                // The onboarding checklist will handle its own hiding
                // We could add additional logic here if needed
              }}
            />
          </div>
        )}

        {/* Dashboard Actions */}
        <ComponentErrorBoundary context="Dashboard Actions">
          <section aria-labelledby="kpi-heading" className="card-mobile">
            <div className="mb-6">
              <h2 id="kpi-heading" className="text-lg font-semibold text-foreground mb-2">Dashboard Actions</h2>
              <p className="text-sm text-muted-foreground">
                Click on any metric card to access related features - manage websites, run scans, or test AI visibility.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {/* AI Findability Score */}
              <Card className="animate-fade-in hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metricsLoading ? (
                        <Skeleton className="h-3 w-12" />
                      ) : metrics.aiScore > 0 ? (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{metrics.aiScore > 70 ? 'Good' : metrics.aiScore > 40 ? 'Fair' : 'Low'}</span>
                        </div>
                      ) : (
                        'Not yet'
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold">
                      {metricsLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <AnimatedCounter value={metrics.aiScore} />
                      )}
                    </div>
                    <div className="text-sm font-medium">AI Findability Score</div>
                    <div className="text-xs text-muted-foreground">
                      How well AI can find and understand your content
                    </div>
                    <div className="flex justify-center pt-2">
                      {metricsLoading ? (
                        <Skeleton className="h-10 w-24" />
                      ) : (
                        <Sparkline 
                          data={metrics.scoreTrend} 
                          width={96} 
                          height={32}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Sites */}
              <Card 
                className="animate-fade-in hover:shadow-lg transition-all cursor-pointer hover:scale-105 transform" 
                style={{ animationDelay: '0.1s' }}
                onClick={() => navigate('/sites')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                      <Globe className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metricsLoading ? (
                        <Skeleton className="h-3 w-12" />
                      ) : metrics.totalSites > 0 ? (
                        `${usageData.maxSites} max`
                      ) : (
                        'Get started'
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold">
                      {metricsLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <AnimatedCounter value={metrics.totalSites} />
                      )}
                    </div>
                    <div className="text-sm font-medium">Websites Added</div>
                    <div className="text-xs text-muted-foreground">
                      Click to manage your websites
                    </div>
                    <div className="flex justify-center pt-2">
                      {metricsLoading ? (
                        <Skeleton className="h-12 w-12 rounded-full" />
                      ) : (
                        <ProgressArc 
                          percentage={usageData.maxSites > 0 ? (metrics.totalSites / usageData.maxSites) * 100 : 0} 
                          size={48} 
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Tests */}
              <Card 
                className="animate-fade-in hover:shadow-lg transition-all cursor-pointer hover:scale-105 transform" 
                style={{ animationDelay: '0.2s' }}
                onClick={() => navigate('/ai-tests')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                      <Zap className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metricsLoading ? (
                        <Skeleton className="h-3 w-12" />
                      ) : metrics.aiTests > 0 ? (
                        `${usageData.maxPrompts} max`
                      ) : (
                        'Try now'
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold">
                      {metricsLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <AnimatedCounter value={metrics.aiTests} />
                      )}
                    </div>
                    <div className="text-sm font-medium">AI Tests Run</div>
                    <div className="text-xs text-muted-foreground">
                      Click to run AI visibility tests
                    </div>
                    <div className="flex justify-center pt-2">
                      {metricsLoading ? (
                        <Skeleton className="h-12 w-12 rounded-full" />
                      ) : (
                        <ProgressArc 
                          percentage={usageData.maxPrompts > 0 ? (usageData.promptCount / usageData.maxPrompts) * 100 : 0} 
                          size={48} 
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Last Scan Status */}
              <Card 
                className="animate-fade-in hover:shadow-lg transition-all cursor-pointer hover:scale-105 transform" 
                style={{ animationDelay: '0.3s' }}
                onClick={() => navigate('/scans')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metricsLoading ? (
                        <Skeleton className="h-3 w-12" />
                      ) : metrics.lastScanTime ? (
                        format(new Date(metrics.lastScanTime), 'MMM d')
                      ) : (
                        'Never'
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-base sm:text-lg font-semibold">
                      {metricsLoading ? (
                        <Skeleton className="h-6 w-20" />
                      ) : (
                        metrics.lastScanStatus
                      )}
                    </div>
                    <div className="text-sm font-medium">Scans</div>
                    <div className="text-xs text-muted-foreground">
                      Click to run website scans
                    </div>
                    <div className="flex justify-center pt-2">
                      {metricsLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : metrics.scoreTrend.length > 1 ? (
                        <Sparkline 
                          data={metrics.scoreTrend} 
                          width={96} 
                          height={32}
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">No trend data</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </ComponentErrorBoundary>

        {/* Recent Activity */}
        <ComponentErrorBoundary context="Recent Activity">
          <section aria-labelledby="activity-heading" className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="card-dashboard">
              <div className="card-header">
                <h3 id="activity-heading">Recent Activity</h3>
                <p>Your latest scans, AI tests, and generated reports - stay updated on your optimization progress</p>
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
                    <EmptyActivity />
                  </div>
                )}
              </div>
            </div>
          </section>
        </ComponentErrorBoundary>

        {/* Usage & Plan */}
        <ComponentErrorBoundary context="Usage Tracker">
          <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="card-dashboard">
              <div className="card-header">
                <h3 className="heading-responsive">Usage & Plan</h3>
                <p className="text-responsive">Track your monthly usage limits and upgrade when ready</p>
              </div>
              <div className="card-content">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-secondary border border-border/50">
                    <div>
                      <div className="font-semibold text-foreground capitalize">
                        {profile?.plan || 'Free'} Plan
                      </div>
                      <div className="text-sm text-muted-foreground text-responsive">
                        Your current subscription
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">
                        {profile?.plan === 'free' ? 'Free' : 'Active'}
                      </div>
                    </div>
                  </div>

                  <UsageTracker 
                    items={[
                      {
                        label: "AI Tests",
                        current: usageData.promptCount,
                        max: usageData.maxPrompts,
                        icon: "🤖",
                        gradient: "bg-gradient-primary text-primary-foreground"
                      },
                      {
                        label: "Sites",
                        current: metrics.totalSites,
                        max: usageData.maxSites,
                        icon: "🌐",
                        gradient: "bg-gradient-accent text-accent-foreground"
                      },
                      {
                        label: "Scans",
                        current: usageData.scanCount,
                        max: usageData.maxScans,
                        icon: "🔍",
                        gradient: "bg-gradient-secondary text-secondary-foreground"
                      }
                    ]}
                  />

                  <button 
                    className="w-full p-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] interactive touch-target btn-responsive"
                    onClick={() => navigate('/pricing')}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          </section>
        </ComponentErrorBoundary>
      </div>
    </PageErrorBoundary>
  );
}