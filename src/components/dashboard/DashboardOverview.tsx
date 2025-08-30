import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  Plus, 
  Globe,
  TrendingUp,
  Zap,
  BarChart3,
  Eye,
  Play,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';

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

interface Metrics {
  totalSites: number;
  avgScore: number;
  totalScans: number;
  totalAITests: number;
}

interface DashboardOverviewProps {
  metrics: Metrics;
  sites: Site[];
  recentScans: Scan[];
  onDataUpdate: () => void;
  onTabChange: (tab: string) => void;
}

export function DashboardOverview({ 
  metrics, 
  sites, 
  recentScans, 
  onDataUpdate, 
  onTabChange 
}: DashboardOverviewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canUseFeature } = useUsageLimits();
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [addingWebsite, setAddingWebsite] = useState(false);

  const quickScanSites = sites.slice(0, 3);

  const handleAddWebsite = async () => {
    if (!newWebsiteUrl.trim()) return;
    
    if (!canUseFeature('websites')) {
      toast({
        title: 'Website limit reached',
        description: 'Upgrade your plan to add more websites',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAddingWebsite(true);
      let url = newWebsiteUrl.trim();
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const hostname = new URL(url).hostname;

      const { error } = await supabase
        .from('sites')
        .insert({
          url,
          name: hostname,
        });

      if (error) throw error;

      toast({
        title: 'Website added',
        description: `${hostname} has been added to your websites`,
      });

      setNewWebsiteUrl('');
      onDataUpdate();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to add website',
        variant: 'destructive',
      });
    } finally {
      setAddingWebsite(false);
    }
  };

  const handleQuickScan = async (siteId: string, siteName: string) => {
    if (!canUseFeature('scans')) {
      toast({
        title: 'Scan limit reached',
        description: 'Upgrade your plan to run more scans',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('analyze-site', {
        body: { siteId }
      });

      if (error) throw error;

      toast({
        title: 'Scan initiated',
        description: `Analyzing ${siteName}... Results will appear shortly.`,
      });

      setTimeout(() => onDataUpdate(), 3000);
    } catch (error: unknown) {
      toast({
        title: 'Scan failed',
        description: (error as Error)?.message || 'Failed to start scan',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score?: number) => {
    if (!score) return 'outline';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Websites</div>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalSites} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Avg AI Score</div>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.avgScore)}`}>
              <AnimatedCounter value={metrics.avgScore} suffix="%" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Total Scans</div>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalScans} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">AI Tests</div>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalAITests} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Add Website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter website URL..."
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWebsite()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddWebsite} 
                disabled={addingWebsite || !newWebsiteUrl.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            {quickScanSites.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Quick Scan</div>
                {quickScanSites.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{site.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{site.url}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {site.ai_findability_score && (
                        <Badge variant={getScoreBadgeVariant(site.ai_findability_score)}>
                          {site.ai_findability_score}%
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleQuickScan(site.id, site.name)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Scan
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => onTabChange('websites')}
                  className="w-full"
                >
                  View All Websites
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length > 0 ? (
              <div className="space-y-3">
                {recentScans.slice(0, 3).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{scan.site.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(scan.scan_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={getScoreBadgeVariant(scan.ai_findability_score)}>
                        {scan.ai_findability_score}%
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/scan/${scan.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => onTabChange('scans')}
                  className="w-full"
                >
                  View All Scans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scans Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add a website and run your first AI findability scan
                </p>
                <Button onClick={() => onTabChange('websites')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Website
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}