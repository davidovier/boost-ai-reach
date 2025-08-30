import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContextualActions } from '@/components/ui/contextual-actions';
import { UsageLimitBanner } from '@/components/ui/usage-limit-banner';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  Plus, 
  Search, 
  Bot, 
  Users, 
  FileText, 
  Globe,
  TrendingUp,
  Zap,
  Eye,
  Download,
  Play,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AITestForm } from './AITestForm';

interface Site {
  id: string;
  url: string;
  name: string;
  ai_findability_score?: number;
  last_scan?: string;
}

interface Scan {
  id: string;
  scan_date: string;
  ai_findability_score: number;
  site: { name: string; url: string };
}

interface AITest {
  id: string;
  prompt: string;
  created_at: string;
  site_mentioned: boolean;
}

interface Report {
  id: string;
  type: string;
  generated_at: string;
  status: string;
  site_name: string;
}

export function AllInOneDashboard() {
  const { user, profile } = useAuth();
  const { hasNearLimitWarnings, getNearLimitWarnings, canUseFeature } = useUsageLimits();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State for all dashboard data
  const [sites, setSites] = useState<Site[]>([]);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [recentAITests, setRecentAITests] = useState<AITest[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [addingWebsite, setAddingWebsite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Quick metrics
  const [metrics, setMetrics] = useState({
    totalSites: 0,
    avgScore: 0,
    totalScans: 0,
    totalAITests: 0,
    totalReports: 0
  });

  useEffect(() => {
    if (user) {
      fetchAllDashboardData();
    }

    // Handle URL hash navigation
    const hash = location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
      // Scroll to section if exists
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [user, location.hash]);

  const fetchAllDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [sitesRes, scansRes, aiTestsRes, reportsRes] = await Promise.all([
        // Sites with latest scan info
        supabase.from('sites')
          .select(`
            id, url, name, created_at
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
          
        // Recent scans with site info
        supabase.from('scans')
          .select(`
            id, scan_date, ai_findability_score, site_id,
            sites!inner (name, url)
          `)
          .eq('sites.user_id', user.id)
          .order('scan_date', { ascending: false })
          .limit(10),
          
        // Recent AI tests
        supabase.from('prompt_simulations')
          .select('id, prompt, run_date, includes_user_site')
          .eq('user_id', user.id)
          .order('run_date', { ascending: false })
          .limit(5),

        // Reports (if table exists, otherwise empty array)
        supabase.from('reports')
          .select('id, type, generated_at, status, site_name')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(5)
          .then(res => res.error ? { data: [], error: null } : res)
      ]);

      // Process sites data - get latest scan for each site
      const sitesData = sitesRes.data?.map(site => {
        const latestScan = scansRes.data?.find(scan => scan.site_id === site.id);
        return {
          id: site.id,
          url: site.url,
          name: site.name,
          ai_findability_score: latestScan?.ai_findability_score,
          last_scan: latestScan?.scan_date
        };
      }) || [];

      setSites(sitesData);
      setRecentScans(scansRes.data?.map(scan => ({
        ...scan,
        site: scan.sites
      })) || []);
      setRecentAITests(aiTestsRes.data?.map(test => ({
        id: test.id,
        prompt: test.prompt,
        created_at: test.run_date,
        site_mentioned: test.includes_user_site
      })) || []);
      setRecentReports(reportsRes.data || []);

      // Calculate metrics
      const totalSites = sitesData.length;
      const scoresWithValues = sitesData.filter(s => s.ai_findability_score).map(s => s.ai_findability_score!);
      const avgScore = scoresWithValues.length > 0 
        ? Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length)
        : 0;

      setMetrics({
        totalSites,
        avgScore,
        totalScans: scansRes.data?.length || 0,
        totalAITests: aiTestsRes.data?.length || 0,
        totalReports: reportsRes.data?.length || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error loading dashboard',
        description: 'Failed to load some dashboard data. Please refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebsiteUrl.trim() || addingWebsite) return;

    // Basic URL validation
    let url = newWebsiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      setAddingWebsite(true);
      
      const hostname = new URL(url).hostname;
      const { data, error } = await supabase
        .from('sites')
        .insert({
          user_id: user!.id,
          url: url,
          name: hostname
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Website added successfully',
        description: `${hostname} has been added to your dashboard.`
      });

      setNewWebsiteUrl('');
      await fetchAllDashboardData();

    } catch (error: any) {
      toast({
        title: 'Failed to add website',
        description: error.message || 'Please check the URL and try again.',
        variant: 'destructive'
      });
    } finally {
      setAddingWebsite(false);
    }
  };

  const handleQuickScan = async (siteId: string) => {
    if (!canUseFeature('scan')) {
      toast({
        title: 'Scan limit reached',
        description: 'You have reached your monthly scan limit. Please upgrade your plan.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('create-scan', {
        body: { siteId }
      });

      if (response.error) throw response.error;

      toast({
        title: 'Scan started',
        description: 'Your website scan is in progress. Results will appear shortly.'
      });

      // Refresh data after a short delay
      setTimeout(fetchAllDashboardData, 3000);

    } catch (error: any) {
      toast({
        title: 'Scan failed',
        description: error.message || 'Could not start the scan. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreBadge = (score?: number) => (
    <Badge variant={getScoreColor(score)} className="text-sm">
      {score || 'Not scanned'}
    </Badge>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Warnings */}
      {hasNearLimitWarnings() && (
        <UsageLimitBanner warnings={getNearLimitWarnings()} />
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Websites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalSites} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.avgScore} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalScans} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tests</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalAITests} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="websites">Websites</TabsTrigger>
              <TabsTrigger value="scans">Scans</TabsTrigger>
              <TabsTrigger value="ai-tests">AI Tests</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Quick Add Website */}
                <Card id="add-website">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Website
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddWebsite} className="space-y-3">
                      <Input
                        placeholder="example.com or https://example.com"
                        value={newWebsiteUrl}
                        onChange={(e) => setNewWebsiteUrl(e.target.value)}
                        disabled={addingWebsite}
                      />
                      <Button type="submit" disabled={addingWebsite} className="w-full">
                        {addingWebsite ? 'Adding...' : 'Add Website'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Quick Scan */}
                <Card id="quick-scan">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Quick Scan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sites.length > 0 ? (
                      <div className="space-y-2">
                        {sites.slice(0, 3).map((site) => (
                          <div key={site.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{site.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {site.last_scan ? `Last: ${format(new Date(site.last_scan), 'MMM d')}` : 'Never scanned'}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleQuickScan(site.id)}
                              disabled={!canUseFeature('scan')}
                            >
                              <Search className="h-3 w-3 mr-1" />
                              Scan
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Add a website first to run scans.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentScans.slice(0, 3).map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Search className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{scan.site.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(scan.scan_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreBadge(scan.ai_findability_score)}
                          <Button size="sm" variant="outline" onClick={() => navigate(`/scans/${scan.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                    {recentScans.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No scans yet. Add a website and run your first scan!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs would continue here with similar structure */}
            <TabsContent value="websites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Websites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sites.map((site) => (
                      <div key={site.id} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex-1">
                          <p className="font-medium">{site.name}</p>
                          <p className="text-sm text-muted-foreground">{site.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreBadge(site.ai_findability_score)}
                          <Button 
                            size="sm" 
                            onClick={() => handleQuickScan(site.id)}
                            disabled={!canUseFeature('scan')}
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Scan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scans Tab */}
            <TabsContent value="scans" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Website Scans</CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => sites.length > 0 && handleQuickScan(sites[0].id)}
                        disabled={!canUseFeature('scan') || sites.length === 0}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        New Scan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentScans.length > 0 ? (
                      <div className="space-y-3">
                        {recentScans.map((scan) => (
                          <Card key={scan.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                                  <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{scan.site.name}</p>
                                  <p className="text-sm text-muted-foreground">{scan.site.url}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(scan.scan_date), 'MMM d, yyyy • h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm font-medium">AI Findability Score</p>
                                  {getScoreBadge(scan.ai_findability_score)}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/scans/${scan.id}`)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {recentScans.length >= 5 && (
                          <Button variant="outline" className="w-full">
                            View All Scans
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No scans yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Run your first scan to analyze how AI models discover your website.
                        </p>
                        {sites.length > 0 ? (
                          <Button onClick={() => handleQuickScan(sites[0].id)} disabled={!canUseFeature('scan')}>
                            <Play className="h-4 w-4 mr-2" />
                            Run First Scan
                          </Button>
                        ) : (
                          <Button onClick={() => setActiveTab('websites')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Website First
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Tests Tab */}
            <TabsContent value="ai-tests" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>AI Findability Tests</CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Navigate to AI test form
                          const aiTestSection = document.querySelector('[data-section="ai-test-form"]');
                          if (aiTestSection) {
                            aiTestSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        disabled={!canUseFeature('prompt')}
                      >
                        <Bot className="h-3 w-3 mr-1" />
                        New Test
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentAITests.length > 0 ? (
                      <div className="space-y-3">
                        {recentAITests.map((test) => (
                          <Card key={test.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                                  <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm mb-1">"{test.prompt}"</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(test.created_at), 'MMM d, yyyy • h:mm a')}
                                  </p>
                                  <Badge 
                                    variant={test.site_mentioned ? "default" : "secondary"} 
                                    className="mt-2"
                                  >
                                    {test.site_mentioned ? '✅ Site Found' : '❌ Not Found'}
                                  </Badge>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No AI tests yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Test how AI models respond to queries about your business or industry.
                        </p>
                        <Button disabled={!canUseFeature('prompt')}>
                          <Play className="h-4 w-4 mr-2" />
                          Run First Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Test Form Section */}
                <Card data-section="ai-test-form">
                  <CardHeader>
                    <CardTitle>Quick AI Test</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enter a prompt to test how AI responds to queries about your industry
                    </p>
                  </CardHeader>
                  <CardContent>
                    <AITestForm onSubmit={async (prompt) => {
                      if (!canUseFeature('prompt')) {
                        toast({
                          title: 'AI test limit reached',
                          description: 'You have reached your monthly AI test limit. Please upgrade your plan.',
                          variant: 'destructive'
                        });
                        return;
                      }

                      try {
                        const response = await supabase.functions.invoke('run-prompt', {
                          body: { prompt }
                        });
                        
                        if (response.error) throw response.error;
                        
                        toast({
                          title: '✨ AI test completed',
                          description: 'Results are ready for review'
                        });
                        
                        await fetchAllDashboardData();
                        
                        // Scroll to the AI tests list to see new result
                        setTimeout(() => {
                          setActiveTab('ai-tests');
                        }, 500);
                        
                      } catch (error: any) {
                        toast({
                          title: 'Test failed',
                          description: error.message || 'Please try again later',
                          variant: 'destructive'
                        });
                      }
                    }} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>AI Findability Reports</CardTitle>
                      <Button 
                        size="sm"
                        disabled={!canUseFeature('report') || sites.length === 0}
                        onClick={async () => {
                          try {
                            const response = await supabase.functions.invoke('reports', {
                              body: { 
                                type: 'comprehensive',
                                sites: sites.slice(0, 1).map(s => s.id)
                              }
                            });
                            
                            if (response.error) throw response.error;
                            
                            toast({
                              title: 'Report generated',
                              description: 'Your comprehensive AI findability report is ready'
                            });
                            
                            await fetchAllDashboardData();
                          } catch (error: any) {
                            toast({
                              title: 'Report generation failed',
                              description: error.message || 'Please try again later',
                              variant: 'destructive'
                            });
                          }
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Generate Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentReports.length > 0 ? (
                      <div className="space-y-3">
                        {recentReports.map((report) => (
                          <Card key={report.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="font-medium">{report.site_name}</p>
                                  <p className="text-sm text-muted-foreground capitalize">{report.type} Report</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(report.generated_at), 'MMM d, yyyy • h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                                  {report.status}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/reports/${report.id}`)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No reports generated</h3>
                        <p className="text-muted-foreground mb-4">
                          Generate comprehensive reports to analyze your AI findability performance over time.
                        </p>
                        {sites.length > 0 ? (
                          <div className="space-y-2">
                            <Button 
                              disabled={!canUseFeature('report')}
                              onClick={async () => {
                                try {
                                  const response = await supabase.functions.invoke('reports', {
                                    body: { 
                                      type: 'comprehensive',
                                      sites: sites.slice(0, 1).map(s => s.id)
                                    }
                                  });
                                  
                                  if (response.error) throw response.error;
                                  
                                  toast({
                                    title: 'Report generated',
                                    description: 'Your comprehensive AI findability report is ready'
                                  });
                                  
                                  await fetchAllDashboardData();
                                } catch (error: any) {
                                  toast({
                                    title: 'Report generation failed',
                                    description: error.message || 'Please try again later',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Generate First Report
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              {!canUseFeature('report') ? 'Upgrade to access comprehensive reports' : ''}
                            </p>
                          </div>
                        ) : (
                          <Button onClick={() => setActiveTab('websites')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Website First
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Contextual Actions Sidebar */}
        <div className="space-y-4">
          <ContextualActions 
            context="dashboard" 
            currentData={{ sites, recentScans, userPlan: profile?.subscription_status }}
          />
          
          {/* Usage Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Usage Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Websites:</span>
                <span>{sites.length}/∞</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Scans:</span>
                <span>{metrics.totalScans}/{profile?.subscription_status === 'free' ? '1' : '∞'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>AI Tests:</span>
                <span>{metrics.totalAITests}/{profile?.subscription_status === 'free' ? '1' : '∞'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}