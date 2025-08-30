import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3,
  Play,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Site {
  id: string;
  url: string;
  name: string;
}

interface Scan {
  id: string;
  scan_date: string;
  ai_findability_score: number;
  site: { name: string; url: string };
  site_id: string;
}

interface ScansTabProps {
  scans: Scan[];
  sites: Site[];
  onDataUpdate: () => void;
}

export function ScansTab({ scans, sites, onDataUpdate }: ScansTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canUseFeature } = useUsageLimits();
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());

  // Filter and sort scans
  const filteredScans = scans.filter(scan => 
    selectedSite === 'all' || scan.site_id === selectedSite
  );

  const sortedScans = [...filteredScans].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.scan_date).getTime() - new Date(a.scan_date).getTime();
      case 'oldest':
        return new Date(a.scan_date).getTime() - new Date(b.scan_date).getTime();
      case 'highest-score':
        return b.ai_findability_score - a.ai_findability_score;
      case 'lowest-score':
        return a.ai_findability_score - b.ai_findability_score;
      case 'site-name':
        return a.site.name.localeCompare(b.site.name);
      default:
        return 0;
    }
  });

  const handleNewScan = async (siteId?: string) => {
    if (!canUseFeature('scans')) {
      toast({
        title: 'Scan limit reached',
        description: 'Upgrade your plan to run more scans',
        variant: 'destructive',
      });
      return;
    }

    // If no specific site selected, navigate to websites tab
    if (!siteId) {
      navigate('/dashboard#websites');
      return;
    }

    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    try {
      setScanningIds(prev => new Set(prev).add(siteId));
      
      const { error } = await supabase.functions.invoke('analyze-site', {
        body: { siteId }
      });

      if (error) throw error;

      toast({
        title: 'Scan initiated',
        description: `Analyzing ${site.name}... Results will appear shortly.`,
      });

      setTimeout(() => {
        onDataUpdate();
        setScanningIds(prev => {
          const updated = new Set(prev);
          updated.delete(siteId);
          return updated;
        });
      }, 3000);
    } catch (error: unknown) {
      toast({
        title: 'Scan failed',
        description: (error as Error)?.message || 'Failed to start scan',
        variant: 'destructive',
      });
      setScanningIds(prev => {
        const updated = new Set(prev);
        updated.delete(siteId);
        return updated;
      });
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreTrend = (currentScan: Scan) => {
    const siteScans = scans
      .filter(scan => scan.site_id === currentScan.site_id)
      .sort((a, b) => new Date(b.scan_date).getTime() - new Date(a.scan_date).getTime());
    
    const currentIndex = siteScans.findIndex(scan => scan.id === currentScan.id);
    if (currentIndex === -1 || currentIndex === siteScans.length - 1) return null;
    
    const previousScan = siteScans[currentIndex + 1];
    const difference = currentScan.ai_findability_score - previousScan.ai_findability_score;
    
    if (difference > 0) return { type: 'up', value: difference };
    if (difference < 0) return { type: 'down', value: Math.abs(difference) };
    return { type: 'same', value: 0 };
  };

  const getSiteStats = () => {
    if (selectedSite === 'all') {
      const avgScore = scans.length > 0 
        ? Math.round(scans.reduce((acc, scan) => acc + scan.ai_findability_score, 0) / scans.length)
        : 0;
      return {
        totalScans: scans.length,
        avgScore,
        siteName: 'All Sites'
      };
    }
    
    const siteScans = scans.filter(scan => scan.site_id === selectedSite);
    const site = sites.find(s => s.id === selectedSite);
    const avgScore = siteScans.length > 0 
      ? Math.round(siteScans.reduce((acc, scan) => acc + scan.ai_findability_score, 0) / siteScans.length)
      : 0;
    
    return {
      totalScans: siteScans.length,
      avgScore,
      siteName: site?.name || 'Unknown Site'
    };
  };

  const stats = getSiteStats();

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Scan Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalScans}</div>
              <div className="text-sm text-muted-foreground">Total Scans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.avgScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sites.length}</div>
              <div className="text-sm text-muted-foreground">Websites</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Actions
            </CardTitle>
            <Button onClick={() => handleNewScan()}>
              <Play className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by website" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Websites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest-score">Highest Score</SelectItem>
                  <SelectItem value="lowest-score">Lowest Score</SelectItem>
                  <SelectItem value="site-name">Site Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scans List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Scan Results ({sortedScans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedScans.length > 0 ? (
            <div className="space-y-4">
              {sortedScans.map((scan) => {
                const trend = getScoreTrend(scan);
                return (
                  <div key={scan.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold truncate">{scan.site.name}</h3>
                        </div>
                        
                        <div className="text-sm text-muted-foreground truncate mb-2">
                          {scan.site.url}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(scan.scan_date), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant={getScoreBadgeVariant(scan.ai_findability_score)}>
                              {scan.ai_findability_score}%
                            </Badge>
                            {trend && (
                              <div className={`flex items-center gap-1 text-xs ${
                                trend.type === 'up' ? 'text-green-600' : 
                                trend.type === 'down' ? 'text-red-600' : 
                                'text-muted-foreground'
                              }`}>
                                {trend.type === 'up' && <TrendingUp className="h-3 w-3" />}
                                {trend.type === 'down' && <TrendingDown className="h-3 w-3" />}
                                {trend.type === 'same' && <Minus className="h-3 w-3" />}
                                {trend.value > 0 && `${trend.value}%`}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            AI Findability Score
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/scan/${scan.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : sites.length > 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scans Yet</h3>
              <p className="text-muted-foreground mb-4">
                {selectedSite === 'all' 
                  ? 'Run your first AI findability scan on any of your websites'
                  : 'No scans found for the selected website'}
              </p>
              <div className="flex gap-2 justify-center">
                {sites.slice(0, 3).map((site) => (
                  <Button 
                    key={site.id} 
                    variant="outline"
                    onClick={() => handleNewScan(site.id)}
                    disabled={scanningIds.has(site.id)}
                  >
                    <Play className="h-3 w-3 mr-2" />
                    Scan {site.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Websites Added</h3>
              <p className="text-muted-foreground mb-4">
                Add websites first before you can run scans
              </p>
              <Button onClick={() => navigate('/dashboard#websites')}>
                <Globe className="h-4 w-4 mr-2" />
                Add Websites
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}