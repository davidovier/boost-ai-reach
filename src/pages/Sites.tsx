import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable, TableDate } from '@/components/ui/responsive-table';
import { SEO } from '@/components/SEO';
import { EmptySites } from '@/components/ui/empty-states';
import { SitesListSkeleton } from '@/components/ui/loading-states';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { UsageLimitBanner } from '@/components/ui/usage-limit-banner';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { Plus, Globe, Trash2, Search, BarChart3 } from 'lucide-react';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';

interface Site {
  id: string;
  url: string;
  name: string;
  created_at: string;
  scan_count?: number;
  last_scan?: string;
  ai_findability_score?: number;
}

export default function Sites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasNearLimitWarnings, getNearLimitWarnings, getReachedLimits, refresh } = useUsageLimits();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; site?: Site }>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Sites', item: `${origin}/sites` },
  ]);

  useEffect(() => {
    if (user) {
      fetchSites();
    }
  }, [user]);

  const fetchSites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sites')
        .select(`
          id, url, name, created_at,
          scans(id, ai_findability_score, scan_date)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedSites = data?.map(site => {
        const scans = site.scans || [];
        const latestScan = scans.length > 0 ? scans[scans.length - 1] : null;
        
        return {
          id: site.id,
          url: site.url,
          name: site.name,
          created_at: site.created_at,
          scan_count: scans.length,
          last_scan: latestScan?.scan_date,
          ai_findability_score: latestScan?.ai_findability_score
        };
      }) || [];
      
      setSites(formattedSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast({
        title: 'Failed to load sites',
        description: 'Could not fetch your websites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

    try {
      setAdding(true);
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      
      const { data, error } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          url: parsed.toString(),
          name: parsed.hostname
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Website added',
        description: `${parsed.hostname} has been added successfully`,
        className: 'success-animation'
      });
      
      setUrl('');
      fetchSites();
      refresh(); // Refresh usage data
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Website already exists',
          description: 'This website is already in your dashboard.',
          variant: 'destructive'
        });
      } else if (error.message?.includes('quota_exceeded') || error.message?.includes('402')) {
        setShowUpgradeModal(true);
      } else {
        toast({
          title: 'Failed to add website',
          description: 'Please enter a valid URL like example.com',
          variant: 'destructive'
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const openDeleteDialog = (site: Site) => {
    setDeleteDialog({ open: true, site });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false });
    setDeleting(false);
  };

  const confirmDelete = async () => {
    if (!deleteDialog.site) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', deleteDialog.site.id);
        
      if (error) throw error;
      
      toast({
        title: '✅ Website deleted',
        description: `${deleteDialog.site.name} has been removed`,
        className: 'success-animation'
      });
      setSites(prev => prev.filter(s => s.id !== deleteDialog.site?.id));
      closeDeleteDialog();
    } catch (e) {
      toast({
        title: 'Failed to delete',
        description: 'Could not remove website. Please try again.',
        variant: 'destructive'
      });
      setDeleting(false);
    }
  };

  const handleScanSite = (siteId: string) => {
    // Navigate to create scan or trigger scan modal
    navigate(`/scans?siteId=${siteId}`);
  };

  const getScoreColor = (score?: number): 'high' | 'medium' | 'low' => {
    if (!score) return 'low';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <>
      <SEO 
        title="My Websites"
        description="Manage your websites and monitor their AI findability scores. Add new sites, track optimization progress, and run scans."
        url="/sites"
        keywords="website management, AI findability tracking, site optimization"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Websites</h1>
              <p className="text-muted-foreground">
                Manage your websites and track their AI findability scores
              </p>
            </div>
          </header>

          {/* Usage Limit Warnings */}
          {hasNearLimitWarnings() && (
            <UsageLimitBanner 
              warnings={getNearLimitWarnings()} 
            />
          )}

          {/* Add Website Form */}
        <Card className="p-4 interactive-hover">
          <form onSubmit={handleAdd} className={`flex items-center gap-3 ${adding ? 'form-submitting' : ''}`}>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com or https://example.com"
              aria-label="Website URL"
              className="interactive-hover"
            />
            <Button type="submit" disabled={adding} className="submit-button interactive-hover">
              <span className="submit-text">
                <Plus className="mr-2 h-4 w-4" />
                Add Website
              </span>
              {adding && (
                <div className="submit-loader">
                  <Globe className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </form>
        </Card>

        {/* Sites List */}
        {loading ? (
          <SitesListSkeleton />
        ) : sites.length === 0 ? (
          <EmptySites onAddClick={() => {
            const input = document.querySelector('input[placeholder*="example"]') as HTMLInputElement;
            if (input) {
              input.focus();
              input.placeholder = "Try: yourwebsite.com";
            }
          }} />
        ) : (
          <ResponsiveTable
            data={sites}
            loading={loading}
            columns={[
              {
                key: 'name',
                label: 'Website',
                render: (name, site) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-48">
                        {site.url}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'ai_findability_score',
                label: 'AI Score',
                render: (score) => {
                  if (!score) return <span className="text-muted-foreground">—</span>;
                  const color = getScoreColor(score);
                  return (
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      color === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      color === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {score}
                    </div>
                  );
                }
              },
              {
                key: 'scan_count',
                label: 'Scans',
                render: (count) => count || 0,
                hideOnMobile: true
              },
              {
                key: 'last_scan',
                label: 'Last Scan',
                render: (date) => {
                  if (!date) return <span className="text-muted-foreground">Never</span>;
                  return <TableDate date={date} />;
                },
                hideOnMobile: true
              },
              {
                key: 'created_at',
                label: 'Added',
                render: (date) => <TableDate date={date} />,
                hideOnMobile: true
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (_, site) => (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleScanSite(site.id)}
                      aria-label={`Scan ${site.name}`}
                      className="btn-focus min-h-[44px] interactive-hover"
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Scan
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(site)}
                      aria-label={`Delete ${site.name}`}
                      className="btn-focus min-h-[44px] min-w-[44px] interactive-hover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
                className: 'text-right'
              }
            ]}
            className="stagger-animation"
          />
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title="Delete Website"
        description={`Are you sure you want to delete "${deleteDialog.site?.name}"? This action cannot be undone and will remove all associated scans and data.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reachedLimits={getReachedLimits()}
        currentPlan="free"
      />
    </>
  );
}