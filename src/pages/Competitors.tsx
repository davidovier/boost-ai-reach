import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Smartphone } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { CompetitorComparisonChart } from '@/components/CompetitorComparisonChart';
import { stringifyJsonLd } from '@/lib/seo';

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
      toast({ title: 'Added', description: `${domain} added and snapshot queued` });
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Competitors</h1>
        <p className="text-muted-foreground">Track and compare your competitors' AI findability scores</p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleAdd} className="flex items-center gap-3">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="competitor.com or https://competitor.com"
            aria-label="Competitor domain"
          />
          <Button type="submit" disabled={adding}>
            {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add
          </Button>
        </form>
        {baseline != null && (
          <p className="mt-2 text-sm text-muted-foreground">Your baseline score: {baseline}</p>
        )}
      </Card>

      {/* Comparison Chart */}
      {items.length > 0 && (
        <CompetitorComparisonChart 
          userBaseline={baseline}
          competitors={items.map(item => ({
            id: item.id,
            domain: item.domain,
            score: item.latestSnapshot?.score ?? null,
          }))}
        />
      )}

      {/* Desktop Table */}
      <Card className="p-0 overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead className="hidden md:table-cell">Latest Score</TableHead>
              <TableHead className="hidden md:table-cell">Δ vs Baseline</TableHead>
              <TableHead className="hidden md:table-cell">Last Snapshot</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No competitors yet</TableCell>
              </TableRow>
            ) : (
              items.map((it) => {
                const score = it.latestSnapshot?.score ?? null;
                const delta = it.comparison.delta;
                return (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.domain}</TableCell>
                    <TableCell className="hidden md:table-cell">{score ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {delta == null ? '—' : (
                        <span className={delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {delta >= 0 ? '+' : ''}{delta}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {it.latestSnapshot?.snapshot_date ? new Date(it.latestSnapshot.snapshot_date).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Delete ${it.domain}`} onClick={() => handleDelete(it.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">Loading…</div>
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">No competitors yet</div>
          </Card>
        ) : (
          items.map((item) => {
            const score = item.latestSnapshot?.score ?? null;
            const delta = item.comparison.delta;
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.domain}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-medium">{score ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">vs Baseline:</span>
                        {delta == null ? (
                          <span>—</span>
                        ) : (
                          <span className={delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {delta >= 0 ? '+' : ''}{delta}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Last Snapshot:</span>
                        <span className="text-xs">
                          {item.latestSnapshot?.snapshot_date 
                            ? new Date(item.latestSnapshot.snapshot_date).toLocaleDateString() 
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label={`Delete ${item.domain}`} 
                    onClick={() => handleDelete(item.id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
