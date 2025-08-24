import { useState, useEffect } from 'react';
import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface UserUsageData {
  user_id: string;
  email: string;
  name: string;
  plan: string;
  scan_count: number;
  prompt_count: number;
  competitor_count: number;
  report_count: number;
  max_scans: number | null;
  max_prompts: number | null;
  max_competitors: number | null;
  last_reset: string;
}

interface ChartData {
  date: string;
  scans: number;
  prompts: number;
}

function AdminUsagePage() {
  const [users, setUsers] = useState<UserUsageData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [grantingCredits, setGrantingCredits] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      // Fetch user usage with plan limits
      const { data: usageData, error: usageError } = await supabase
        .from('usage_metrics')
        .select(`
          user_id,
          scan_count,
          prompt_count,
          competitor_count,
          report_count,
          last_reset,
          profiles!inner(email, name, plan),
          plans!inner(max_scans, max_prompts, max_competitors)
        `)
        .order('scan_count', { ascending: false });

      if (usageError) throw usageError;

      const formattedUsers = usageData?.map((item: any) => ({
        user_id: item.user_id,
        email: item.profiles.email,
        name: item.profiles.name || 'Unknown',
        plan: item.profiles.plan,
        scan_count: item.scan_count,
        prompt_count: item.prompt_count,
        competitor_count: item.competitor_count,
        report_count: item.report_count,
        max_scans: item.plans.max_scans,
        max_prompts: item.plans.max_prompts,
        max_competitors: item.plans.max_competitors,
        last_reset: item.last_reset,
      })) || [];

      setUsers(formattedUsers);

      // Generate mock chart data for time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const mockChartData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          scans: Math.floor(Math.random() * 50) + 10,
          prompts: Math.floor(Math.random() * 100) + 20,
        };
      });
      setChartData(mockChartData);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch usage data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const grantCredits = async (userId: string) => {
    setGrantingCredits(userId);
    try {
      const { error } = await supabase
        .from('usage_metrics')
        .update({
          scan_count: 0,
          prompt_count: 0,
          competitor_count: 0,
          report_count: 0,
          last_reset: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Credits granted successfully',
      });
      
      fetchUsageData();
    } catch (error) {
      console.error('Error granting credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant credits',
        variant: 'destructive',
      });
    } finally {
      setGrantingCredits(null);
    }
  };

  const isNearLimit = (current: number, max: number | null) => {
    if (!max) return false;
    return current / max >= 0.8;
  };

  const getUsagePercentage = (current: number, max: number | null) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const totalScans = users.reduce((sum, user) => sum + user.scan_count, 0);
  const totalPrompts = users.reduce((sum, user) => sum + user.prompt_count, 0);
  const nearLimitUsers = users.filter(user => 
    isNearLimit(user.scan_count, user.max_scans) || 
    isNearLimit(user.prompt_count, user.max_prompts)
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Admin",
        "item": "/admin"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Usage Analytics",
        "item": "/admin/usage"
      }
    ]
  };

  return (
    <>
      <SEO
        title="Usage Analytics"
        description="Monitor user activity, subscription usage metrics, resource consumption, and platform analytics for insights and optimization."
        url="/admin/usage"
        noindex={true}
      />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </script>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usage Analytics</h1>
            <p className="text-muted-foreground">Monitor usage patterns and manage user limits</p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{users.length}</div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalScans}</div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalPrompts}</div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Near Limit</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold text-destructive">{nearLimitUsers.length}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scans Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompts Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="prompts" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Near Limit Users */}
        {nearLimitUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Users Near Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nearLimitUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{user.plan}</Badge>
                        {isNearLimit(user.scan_count, user.max_scans) && (
                          <Badge variant="destructive">Scans: {user.scan_count}/{user.max_scans}</Badge>
                        )}
                        {isNearLimit(user.prompt_count, user.max_prompts) && (
                          <Badge variant="destructive">Prompts: {user.prompt_count}/{user.max_prompts}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => grantCredits(user.user_id)}
                      disabled={grantingCredits === user.user_id}
                    >
                      {grantingCredits === user.user_id ? 'Granting...' : 'Grant Credits'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Users Usage */}
        <Card>
          <CardHeader>
            <CardTitle>User Usage Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{user.plan}</Badge>
                        <Badge variant="secondary">
                          Scans: {user.scan_count}{user.max_scans ? `/${user.max_scans}` : ''}
                        </Badge>
                        <Badge variant="secondary">
                          Prompts: {user.prompt_count}{user.max_prompts ? `/${user.max_prompts}` : ''}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => grantCredits(user.user_id)}
                      disabled={grantingCredits === user.user_id}
                    >
                      {grantingCredits === user.user_id ? 'Granting...' : 'Reset Usage'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default withAdminGuard(AdminUsagePage);