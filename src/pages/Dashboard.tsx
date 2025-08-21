import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { Activity, TrendingUp, Zap, Search } from 'lucide-react';

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
    <>
      <SEO 
        title="Dashboard - FindableAI"
        description="Monitor your AI findability optimization progress with real-time analytics and insights."
        url="/dashboard"
        noindex={true}
      />
      
      <div className="space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your AI findability optimization
          </p>
        </header>

        {/* KPI Cards */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Findability Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">72</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sites Tracked
                </CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {subscription?.limits?.max_sites || 1} allowed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Tests Used
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">
                      {subscription?.usage?.prompt_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {subscription?.limits?.max_prompts || 1} this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last Scan Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">Active</div>
                    <p className="text-xs text-muted-foreground">
                      2 hours ago
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Activity */}
        <section aria-labelledby="activity-heading">
          <Card>
            <CardHeader>
              <CardTitle id="activity-heading" className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <ul className="space-y-4" role="list">
                  {activities.map((activity) => (
                    <li key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <time className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </time>
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">No activity yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start by scanning your first website or running an AI test.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}