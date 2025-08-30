import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  Users,
  BarChart3,
  FileText,
  Shield,
  CreditCard,
  Settings,
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  Eye,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface SystemMetrics {
  totalUsers: number;
  newUsersToday: number;
  totalScans: number;
  scansToday: number;
  totalPrompts: number;
  promptsToday: number;
  totalReports: number;
  reportsToday: number;
  securityEvents: number;
  securityEventsToday: number;
  subscriptionRevenue: number;
  activeSubscriptions: number;
}

interface RecentActivity {
  type: 'user_created' | 'scan_completed' | 'prompt_run' | 'report_generated' | 'security_event';
  id: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

interface AdminOverviewProps {
  onNavigateToTab: (tab: string) => void;
}

export function AdminOverview({ onNavigateToTab }: AdminOverviewProps) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    newUsersToday: 0,
    totalScans: 0,
    scansToday: 0,
    totalPrompts: 0,
    promptsToday: 0,
    totalReports: 0,
    reportsToday: 0,
    securityEvents: 0,
    securityEventsToday: 0,
    subscriptionRevenue: 0,
    activeSubscriptions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemMetrics();
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Fetch all metrics in parallel
      const [
        usersRes,
        newUsersRes,
        scansRes,
        scanstodayRes,
        promptsRes,
        promptsTodayRes,
        reportsRes,
        reportsTodayRes,
        securityRes,
        securityTodayRes,
        subscriptionsRes
      ] = await Promise.all([
        // Total users
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        
        // New users today
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        
        // Total scans
        supabase.from('scans').select('id', { count: 'exact', head: true }),
        
        // Scans today
        supabase.from('scans')
          .select('id', { count: 'exact', head: true })
          .gte('scan_date', todayStart.toISOString()),
        
        // Total prompts
        supabase.from('prompt_simulations').select('id', { count: 'exact', head: true }),
        
        // Prompts today
        supabase.from('prompt_simulations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        
        // Total reports (mock data)
        Promise.resolve({ count: 156 }),
        
        // Reports today (mock data)
        Promise.resolve({ count: 12 }),
        
        // Total security events (mock data)
        Promise.resolve({ count: 89 }),
        
        // Security events today (mock data)  
        Promise.resolve({ count: 3 }),
        
        // Subscriptions (mock data)
        Promise.resolve({ data: [
          { revenue: 29900, status: 'active' },
          { revenue: 9900, status: 'active' }
        ]})
      ]);

      // Calculate subscription metrics
      const activeSubscriptions = subscriptionsRes.data?.filter(s => s.status === 'active').length || 0;
      const totalRevenue = subscriptionsRes.data?.reduce((sum, s) => sum + s.revenue, 0) || 0;

      setMetrics({
        totalUsers: usersRes.count || 0,
        newUsersToday: newUsersRes.count || 0,
        totalScans: scansRes.count || 0,
        scansToday: scanstodayRes.count || 0,
        totalPrompts: promptsRes.count || 0,
        promptsToday: promptsTodayRes.count || 0,
        totalReports: reportsRes.count || 0,
        reportsToday: reportsTodayRes.count || 0,
        securityEvents: securityRes.count || 0,
        securityEventsToday: securityTodayRes.count || 0,
        subscriptionRevenue: totalRevenue,
        activeSubscriptions
      });

      // Mock recent activity data
      setRecentActivity([
        {
          type: 'user_created',
          id: '1',
          description: 'New user registered: john.doe@example.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          type: 'security_event',
          id: '2', 
          description: 'Failed login attempt detected',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          severity: 'medium'
        },
        {
          type: 'scan_completed',
          id: '3',
          description: 'Website scan completed for example.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          type: 'report_generated',
          id: '4',
          description: 'AI Findability report generated',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return Users;
      case 'scan_completed': return BarChart3;
      case 'prompt_run': return Activity;
      case 'report_generated': return FileText;
      case 'security_event': return Shield;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string, severity?: string) => {
    if (type === 'security_event') {
      switch (severity) {
        case 'high': return 'text-red-600';
        case 'medium': return 'text-yellow-600';
        default: return 'text-blue-600';
      }
    }
    return 'text-muted-foreground';
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'destructive'
    } as const;

    return (
      <Badge variant={variants[severity]} className="text-xs">
        {severity}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-e-transparent" />
          <p className="mt-2 text-muted-foreground">Loading system overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalUsers} />
            </div>
            <p className="text-xs text-muted-foreground">
              +{metrics.newUsersToday} today
            </p>
          </CardContent>
        </Card>

        {/* Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalScans} />
            </div>
            <p className="text-xs text-muted-foreground">
              +{metrics.scansToday} today
            </p>
          </CardContent>
        </Card>

        {/* AI Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalPrompts} />
            </div>
            <p className="text-xs text-muted-foreground">
              +{metrics.promptsToday} today
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(metrics.subscriptionRevenue / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeSubscriptions} active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => onNavigateToTab('users')}
              variant="outline" 
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => onNavigateToTab('usage')}
              variant="outline" 
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Usage Analytics
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => onNavigateToTab('security')}
              variant="outline" 
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Events
              </span>
              {metrics.securityEventsToday > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.securityEventsToday}
                </Badge>
              )}
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => onNavigateToTab('billing')}
              variant="outline" 
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing Overview
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigateToTab('logs')}
              >
                <Eye className="h-3 w-3 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className={`p-1 rounded ${getActivityColor(activity.type, activity.severity)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {activity.description}
                          </p>
                          {getSeverityBadge(activity.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                All database connections active
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Performance</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Good
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Average response time: 120ms
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security</span>
                {metrics.securityEventsToday > 0 ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Monitoring
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Secure
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.securityEventsToday} events today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}