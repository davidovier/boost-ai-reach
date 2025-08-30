import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe,
  Plus,
  Play,
  Eye,
  Trash2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Site {
  id: string;
  url: string;
  name: string;
  ai_findability_score?: number;
  last_scan?: string;
  created_at: string;
}

interface WebsitesTabProps {
  sites: Site[];
  onDataUpdate: () => void;
}

export function WebsitesTab({ sites, onDataUpdate }: WebsitesTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canUseFeature } = useUsageLimits();
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [addingWebsite, setAddingWebsite] = useState(false);
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());

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

  const handleScan = async (siteId: string, siteName: string) => {
    if (!canUseFeature('scans')) {
      toast({
        title: 'Scan limit reached',
        description: 'Upgrade your plan to run more scans',
        variant: 'destructive',
      });
      return;
    }

    try {
      setScanningIds(prev => new Set(prev).add(siteId));
      
      const { error } = await supabase.functions.invoke('analyze-site', {
        body: { siteId }
      });

      if (error) throw error;

      toast({
        title: 'Scan initiated',
        description: `Analyzing ${siteName}... Results will appear shortly.`,
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

  const handleDeleteSite = async (siteId: string, siteName: string) => {
    if (!confirm(`Are you sure you want to delete ${siteName}? This will also delete all associated scans and cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;

      toast({
        title: 'Website deleted',
        description: `${siteName} has been removed from your websites`,
      });

      onDataUpdate();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to delete website',
        variant: 'destructive',
      });
    }
  };

  const getScoreBadgeVariant = (score?: number) => {
    if (!score) return 'outline';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Add Website Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Website
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter website URL (e.g., example.com)"
              value={newWebsiteUrl}
              onChange={(e) => setNewWebsiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWebsite()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddWebsite} 
              disabled={addingWebsite || !newWebsiteUrl.trim()}
            >
              {addingWebsite ? 'Adding...' : 'Add Website'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Websites List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Your Websites ({sites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sites.length > 0 ? (
            <div className="space-y-4">
              {sites.map((site) => (
                <div key={site.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">{site.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(site.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground truncate mb-3">
                        {site.url}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Added {format(new Date(site.created_at), 'MMM d, yyyy')}
                        </div>
                        {site.last_scan && (
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            Last scan {format(new Date(site.last_scan), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {site.ai_findability_score ? (
                        <Badge variant={getScoreBadgeVariant(site.ai_findability_score)}>
                          {site.ai_findability_score}% AI Score
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not scanned</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleScan(site.id, site.name)}
                      disabled={scanningIds.has(site.id)}
                    >
                      <Play className="h-3 w-3 mr-2" />
                      {scanningIds.has(site.id) ? 'Scanning...' : 'Run Scan'}
                    </Button>
                    
                    {site.ai_findability_score && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/scans?site=${site.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View History
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSite(site.id, site.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Websites Added</h3>
              <p className="text-muted-foreground mb-4">
                Add your first website to start analyzing its AI findability
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}