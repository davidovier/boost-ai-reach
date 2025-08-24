import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResponsiveTable, TableBadge, TableDate } from '@/components/ui/responsive-table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { CompetitorComparisonChart } from '@/components/CompetitorComparisonChart';
import { stringifyJsonLd } from '@/lib/seo';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton-enhanced';

interface CompetitorItem {
  id: string;
  domain: string;
  notes?: string | null;
  created_at: string;
  latestSnapshot: { score: number | null; snapshot_date: string } | null;
  comparison: { userBaseline: number | null; delta: number | null };
}

export default function Competitors() {
  const { toast } = useToast();
  const [items, setItems] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('competitors', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setItems((data?.items as CompetitorItem[]) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load competitors', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    try {
      setAdding(true);
      const { data, error } = await supabase.functions.invoke('competitors', {
        body: { action: 'add', domain },
      });
      if (error) throw error;
      
      toast({ 
        title: '✨ Added successfully', 
        description: `${domain} added and snapshot queued`,
        className: 'success-animation'
      });
      setDomain('');
      await fetchList();
    } catch (e: any) {
      const msg = e?.message || '';
      const quota = msg.includes('quota_exceeded') || msg.includes('402');
      toast({
        title: quota ? 'Limit reached' : 'Error',
        description: quota ? 'You have used all competitor slots for your plan.' : 'Failed to add competitor',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('competitors', {
        body: { action: 'delete', id },
      });
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Competitor removed' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete competitor', variant: 'destructive' });
    }
  };

  const baseline = useMemo(() => {
    const first = items[0];
    return first?.comparison.userBaseline ?? null;
  }, [items]);

  const competitorListJsonLd = useMemo(() => {
    if (items.length === 0) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Competitor Analysis List',
      description: 'AI findability scores for tracked competitors',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.domain,
        description: `AI findability score: ${item.latestSnapshot?.score ?? 'Not available'}`,
      })),
    };
  }, [items]);

  return (
    <>
      <SEO 
        title="Competitors – AI Findability Comparison | FindableAI"
        description="Track and compare your competitors' AI findability scores. Monitor how your site performs against competition in AI search results."
        url="/competitors"
      />
      
      {competitorListJsonLd && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(competitorListJsonLd) }} 
        />
      )}

      <div className="space-y-6">
        <div className="card-reveal">
          <h1 className="text-3xl font-bold text-foreground">Competitors</h1>
          <p className="text-muted-foreground">Track and compare your competitors' AI findability scores</p>
        </div>

        <Card className="p-4 interactive-hover">
          <form onSubmit={handleAdd} className={`flex items-center gap-3 ${adding ? 'form-submitting' : ''}`}>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="competitor.com or https://competitor.com"
              aria-label="Competitor domain"
              className="interactive-hover"
            />
            <Button type="submit" disabled={adding} className="submit-button interactive-hover">
              <span className="submit-text">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </span>
              {adding && (
                <div className="submit-loader">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </form>
          {baseline != null && (
            <p className="mt-2 text-sm text-muted-foreground animated-progress">
              Your baseline score: <span className="font-medium text-primary">{baseline}</span>
            </p>
          )}
        </Card>

        {/* Comparison Chart */}
        {loading ? (
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        ) : items.length > 0 && (
          <div className="card-reveal" style={{ animationDelay: '0.2s' }}>
            <CompetitorComparisonChart 
              userBaseline={baseline}
              competitors={items.map(item => ({
                id: item.id,
                domain: item.domain,
                score: item.latestSnapshot?.score ?? null,
              }))}
            />
          </div>
        )}

        <div className="card-reveal" style={{ animationDelay: '0.3s' }}>
          {loading ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <SkeletonTable rows={4} cols={4} />
              </div>
            </Card>
          ) : (
            <ResponsiveTable
              data={items}
              loading={loading}
              columns={[
                {
                  key: 'domain',
                  label: 'Domain',
                  render: (domain) => <span className="font-medium">{domain}</span>
                },
                {
                  key: 'latestSnapshot',
                  label: 'Score',
                  render: (snapshot) => snapshot?.score ?? '—'
                },
                {
                  key: 'comparison',
                  label: 'vs Baseline',
                  render: (comparison) => {
                    const delta = comparison?.delta;
                    if (delta == null) return '—';
                    return (
                      <span className={delta >= 0 ? 'text-success' : 'text-destructive'}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </span>
                    );
                  },
                  hideOnMobile: true
                },
                {
                  key: 'latestSnapshot',
                  label: 'Last Snapshot',
                  render: (snapshot) => {
                    if (!snapshot?.snapshot_date) return '—';
                    return <TableDate date={snapshot.snapshot_date} />;
                  },
                  hideOnMobile: true
                },
                {
                  key: 'actions',
                  label: '',
                  render: (_, item) => (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label={`Delete ${item.domain}`}
                      onClick={() => handleDelete(item.id)}
                      className="btn-focus min-h-[44px] min-w-[44px] interactive-hover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ),
                  className: 'text-right w-[80px]'
                }
              ]}
              emptyState={
                <Card className="p-8 text-center interactive-hover">
                  <div className="text-muted-foreground">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center mb-3">
                        <Plus className="w-8 h-8" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No competitors yet</h3>
                      <p className="text-sm">Add your first competitor to start tracking their AI findability scores</p>
                    </div>
                  </div>
                </Card>
              }
              className="padding-mobile stagger-animation"
            />
          )}
        </div>
      </div>
    </>
  );
}
