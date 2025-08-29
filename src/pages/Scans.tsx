import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Eye, 
  Trash2,
  Globe,
  Calendar,
  BarChart3,
  AlertCircle,
  Search
} from 'lucide-react';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';

interface Scan {
  id: string;
  scan_date: string;
  ai_findability_score: number | null;
  crawlability_score: number | null;
  summarizability_score: number | null;
  site: {
    name: string;
    url: string;
  };
  metadata: any;
}

function ScansGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyScansState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Start analyzing your website's AI findability by running your first scan.
        </p>
        <Button onClick={onAddClick} className="inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Run First Scan
        </Button>
      </CardContent>
    </Card>
  );
}

function ScoreDisplay({ score, size = 'default' }: { score: number | null; size?: 'default' | 'large' }) {
  const getScoreVariant = (score: number | null): 'destructive' | 'secondary' | 'default' => {
    if (!score) return 'secondary';
    if (score >= 70) return 'default';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  const sizeClasses = size === 'large' ? 'text-lg px-3 py-1' : 'text-sm px-2 py-1';

  return (
    <Badge variant={getScoreVariant(score)} className={sizeClasses}>
      {score ? score : 'N/A'}
    </Badge>
  );
}

function IssuesDisplay({ scan }: { scan: Scan }) {
  const getIssueCount = (scan: Scan): number => {
    let issues = 0;
    if ((scan.ai_findability_score || 0) < 70) issues++;
    if ((scan.crawlability_score || 0) < 70) issues++;
    if ((scan.summarizability_score || 0) < 70) issues++;
    return issues;
  };

  const issueCount = getIssueCount(scan);

  if (issueCount === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">No issues</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm font-medium">{issueCount} issue{issueCount > 1 ? 's' : ''}</span>
    </div>
  );
}

export default function Scans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; scan?: Scan }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Website Scans', item: `${origin}/scans` },
  ]);

  useEffect(() => {
    if (user) {
      fetchScans();
      
      // Check for siteId query parameter to auto-start scan
      const urlParams = new URLSearchParams(window.location.search);
      const siteId = urlParams.get('siteId');
      if (siteId) {
        handleCreateScan(siteId);
      }
    }
  }, [user]);

  const fetchScans = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('scans')
        .select(`
          id, scan_date, ai_findability_score, crawlability_score, 
          summarizability_score, metadata,
          sites:site_id (name, url),
          tips (count)
        `)
        .order('scan_date', { ascending: false })
        .limit(12);

      if (error) throw error;
      
      const formattedScans = data?.map(scan => ({
        ...scan,
        site: scan.sites
      })) || [];
      
      setScans(formattedScans);
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast({
        title: 'Error loading scans',
        description: 'Failed to load scan data. Please refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScan = async (siteId?: string) => {
    if (!user) return;
    
    try {
      if (!siteId) {
        navigate('/sites');
        return;
      }

      // Show loading state
      const loadingToast = toast({
        title: 'Starting scan...',
        description: 'Please wait while we analyze your website.',
      });

      const response = await supabase.functions.invoke('create-scan', {
        body: { siteId }
      });

      if (response.error) {
        // Handle specific error types
        let errorMessage = 'Could not start the scan. Please try again.';
        let errorTitle = 'Failed to start scan';
        
        if (response.error.message) {
          const error = response.error;
          if (error.message.includes('limit reached')) {
            errorTitle = 'Scan limit reached';
            errorMessage = 'You have reached your monthly scan limit. Please upgrade your plan or wait until next month.';
          } else if (error.message.includes('Invalid URL') || error.message.includes('Failed to fetch')) {
            errorTitle = 'Website not accessible';
            errorMessage = 'We could not access your website. Please check the URL and ensure the site is online.';
          } else if (error.message.includes('content type')) {
            errorTitle = 'Invalid content';
            errorMessage = 'The URL does not point to a valid HTML page. Please check the URL.';
          } else {
            errorMessage = error.message;
          }
        }
        
        throw new Error(`${errorTitle}: ${errorMessage}`);
      }

      // Success - refresh data and show success message
      await fetchScans();
      
      toast({
        title: 'Scan completed successfully',
        description: 'Your website analysis is ready. Check the results below.',
      });

    } catch (error) {
      console.error('Error creating scan:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Could not start the scan. Please try again.';
      const [title, description] = errorMessage.includes(':') 
        ? errorMessage.split(':', 2)
        : ['Failed to start scan', errorMessage];
      
      toast({
        title: title.trim(),
        description: description.trim(),
        variant: 'destructive'
      });
    }
  };

  const openDeleteDialog = (scan: Scan) => {
    setDeleteDialog({ open: true, scan });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false });
    setDeleting(false);
  };

  const confirmDeleteScan = async () => {
    if (!deleteDialog.scan) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', deleteDialog.scan.id);
        
      if (error) throw error;
      
      toast({ 
        title: 'Scan deleted successfully',
        description: `Scan for ${deleteDialog.scan.site?.name || 'site'} has been removed.`,
      });
      
      setScans(prev => prev.filter(s => s.id !== deleteDialog.scan?.id));
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast({ 
        title: 'Failed to delete scan',
        description: 'Could not remove scan. Please try again.',
        variant: 'destructive' 
      });
      setDeleting(false);
    }
  };

  return (
    <PageErrorBoundary context="Website Scans">
      <SEO 
        title="Website Scans - AI Findability Analysis"
        description="View and manage your website scan results. Monitor AI findability scores, crawlability metrics, and get actionable optimization recommendations."
        url="/scans"
        keywords="website scans, AI findability, SEO analysis, website audit, optimization recommendations"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Header Section */}
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Website Scans
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Monitor your website's AI findability scores and track optimization progress over time.
              </p>
            </div>
            <Button 
              onClick={() => handleCreateScan()}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          </div>
        </header>

        {/* Content Section */}
        <ComponentErrorBoundary context="Scans Content">
          {loading ? (
            <ScansGridSkeleton />
          ) : scans.length === 0 ? (
            <EmptyScansState onAddClick={() => navigate('/sites')} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scans.map((scan) => (
                <Card 
                  key={scan.id} 
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
                  onClick={() => navigate(`/scans/${scan.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg leading-snug truncate">
                          {scan.site?.name || 'Unnamed Site'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {scan.site?.url}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <ScoreDisplay score={scan.ai_findability_score} size="large" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Score Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">AI Score</div>
                        <div className="text-sm font-semibold">
                          {scan.ai_findability_score || 'N/A'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">Crawl</div>
                        <div className="text-sm font-semibold">
                          {scan.crawlability_score || 'N/A'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">Summary</div>
                        <div className="text-sm font-semibold">
                          {scan.summarizability_score || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Issues Display */}
                    <IssuesDisplay scan={scan} />

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <time 
                          dateTime={scan.scan_date}
                          className="text-xs"
                        >
                          {format(new Date(scan.scan_date), 'MMM d, yyyy')}
                        </time>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scans/${scan.id}`);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View scan details</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(scan);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete scan</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ComponentErrorBoundary>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title="Delete Scan"
        description={`Are you sure you want to delete the scan for "${deleteDialog.scan?.site?.name || 'this site'}"? This action cannot be undone and will permanently remove all scan data and results.`}
        confirmText="Delete Scan"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteScan}
        loading={deleting}
      />
    </PageErrorBoundary>
  );
}