import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageLimitBanner } from '@/components/ui/usage-limit-banner';
import { ContextualActions } from '@/components/ui/contextual-actions';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { 
  Home,
  Globe,
  BarChart3,
  Bot,
  FileText
} from 'lucide-react';

import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { WebsitesTab } from '@/components/dashboard/WebsitesTab';
import { ScansTab } from '@/components/dashboard/ScansTab';
import { AITestsTab } from '@/components/dashboard/AITestsTab';
import { ReportsTab } from '@/components/dashboard/ReportsTab';

interface Site {
  id: string;
  url: string;
  name: string;
  ai_findability_score?: number;
  last_scan?: string;
  created_at: string;
}

interface Scan {
  id: string;
  scan_date: string;
  ai_findability_score: number;
  site: { name: string; url: string };
  site_id: string;
}

interface AITest {
  id: string;
  prompt: string;
  created_at: string;
  site_mentioned: boolean;
  response_preview?: string;
}

interface Report {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_at: string;
  site_name: string;
  site_id?: string;
  download_url?: string;
  error_message?: string;
}

export default function NewDashboard() {
  const { user } = useAuth();
  const { hasNearLimitWarnings } = useUsageLimits();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [sites, setSites] = useState<Site[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [aiTests, setAITests] = useState<AITest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Computed metrics
  const metrics = {
    totalSites: sites.length,
    avgScore: sites.length > 0 
      ? Math.round(sites.filter(s => s.ai_findability_score).reduce((acc, site) => acc + (site.ai_findability_score || 0), 0) / sites.filter(s => s.ai_findability_score).length) || 0
      : 0,
    totalScans: scans.length,
    totalAITests: aiTests.length
  };

  // Breadcrumbs
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Dashboard', item: `${origin}/dashboard` },
  ]);

  // Tab configuration
  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'websites', label: 'Websites', icon: Globe },
    { id: 'scans', label: 'Scans', icon: BarChart3 },
    { id: 'ai-tests', label: 'AI Tests', icon: Bot },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  useEffect(() => {
    if (user) {
      fetchAllData();
    }

    // Handle URL hash navigation
    const hash = location.hash.replace('#', '');
    if (hash && tabConfig.find(tab => tab.id === hash)) {
      setActiveTab(hash);
    }
  }, [user, location.hash]);

  const fetchAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [sitesRes, scansRes, aiTestsRes, reportsRes] = await Promise.all([
        // Sites
        supabase.from('sites')
          .select('id, url, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
          
        // Scans with site info
        supabase.from('scans')
          .select(`
            id, scan_date, ai_findability_score, site_id,
            sites!inner (name, url)
          `)
          .eq('sites.user_id', user.id)
          .order('scan_date', { ascending: false })
          .limit(50),
          
        // AI tests
        supabase.from('prompt_simulations')
          .select('id, prompt, created_at, site_mentioned, response_preview')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
          
        // Reports (mock data for now)
        Promise.resolve({ data: [], error: null })
      ]);

      // Process sites data with latest scan info
      const sitesData = sitesRes.data?.map(site => {
        const latestScan = scansRes.data?.find(scan => scan.site_id === site.id);
        return {
          ...site,
          ai_findability_score: latestScan?.ai_findability_score,
          last_scan: latestScan?.scan_date
        };
      }) || [];

      setSites(sitesData);
      setScans(scansRes.data || []);
      setAITests(aiTestsRes.data || []);
      setReports(reportsRes.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/dashboard#${tab}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-e-transparent" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Dashboard"
        description="Your AI findability command center. Manage websites, run scans, test AI responses, and track your optimization progress all in one place."
        url="/dashboard"
        keywords="dashboard, AI findability, website optimization, SEO management"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Your AI findability command center
          </p>
        </header>

        {hasNearLimitWarnings && <UsageLimitBanner />}

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <TabsList className="grid w-full grid-cols-5">
                  {tabConfig.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id} 
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Mobile Tabs */}
              <div className="md:hidden">
                <TabsList className="grid w-full grid-cols-5">
                  {tabConfig.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id} 
                        className="flex flex-col items-center gap-1 py-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="overview">
                <DashboardOverview 
                  metrics={metrics}
                  sites={sites}
                  recentScans={scans}
                  onDataUpdate={fetchAllData}
                  onTabChange={handleTabChange}
                />
              </TabsContent>

              <TabsContent value="websites">
                <WebsitesTab 
                  sites={sites}
                  onDataUpdate={fetchAllData}
                />
              </TabsContent>

              <TabsContent value="scans">
                <ScansTab 
                  scans={scans}
                  sites={sites}
                  onDataUpdate={fetchAllData}
                />
              </TabsContent>

              <TabsContent value="ai-tests">
                <AITestsTab 
                  aiTests={aiTests}
                  onDataUpdate={fetchAllData}
                />
              </TabsContent>

              <TabsContent value="reports">
                <ReportsTab 
                  reports={reports}
                  sites={sites}
                  onDataUpdate={fetchAllData}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 space-y-4">
            <ContextualActions currentSection={activeTab} />
          </div>
        </div>
      </div>
    </>
  );
}