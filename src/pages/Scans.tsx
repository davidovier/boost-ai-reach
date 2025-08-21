import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { Search, TrendingUp, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { ResponsiveTable, TableBadge, TableDate } from '@/components/ui/responsive-table';

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

export default function Scans() {
  const { user } = useAuth();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Scans', item: `${origin}/scans` },
  ]);

  useEffect(() => {
    if (user) {
      fetchScans();
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
          sites:site_id (name, url)
        `)
        .order('scan_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const formattedScans = data?.map(scan => ({
        ...scan,
        site: scan.sites
      })) || [];
      
      setScans(formattedScans);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getIssueCount = (scan: Scan) => {
    const scores = [scan.ai_findability_score, scan.crawlability_score, scan.summarizability_score];
    return scores.filter(score => score && score < 70).length;
  };

  return (
    <>
      <SEO 
        title="Website Scans - FindableAI"
        description="View and manage your website scan results, AI findability scores, and optimization recommendations."
        url="/scans"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Website Scans</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              Monitor your website's AI findability scores and optimization progress
            </p>
          </div>
          <Button className="w-full sm:w-auto min-h-[44px] btn-focus">
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        </header>

        <ResponsiveTable
          data={scans}
          loading={loading}
          loadingSkeleton={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
          emptyState={
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first website to start analyzing its AI findability score
                </p>
                <Button className="btn-focus">
                  <Plus className="h-4 w-4 mr-2" />
                  Run Your First Scan
                </Button>
              </CardContent>
            </Card>
          }
          columns={[
            {
              key: 'site',
              label: 'Website',
              render: (site) => (
                <div>
                  <div className="font-medium">{site?.name || 'Unnamed Site'}</div>
                  <div className="text-sm text-muted-foreground">{site?.url}</div>
                </div>
              ),
            },
            {
              key: 'scan_date',
              label: 'Scan Date',
              render: (date) => <TableDate date={date} />,
              hideOnMobile: true,
            },
            {
              key: 'ai_findability_score',
              label: 'AI Score',
              render: (score) => (
                <TableBadge variant={getScoreColor(score)}>
                  {score || 'N/A'}
                </TableBadge>
              ),
            },
            {
              key: 'issues',
              label: 'Issues',
              render: (_, scan) => {
                const issues = getIssueCount(scan);
                return issues > 0 ? (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{issues}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>None</span>
                  </div>
                );
              },
              hideOnMobile: true,
            },
          ]}
          onRowClick={(scan) => window.location.href = `/scans/${scan.id}`}
        />
      </div>
    </>
  );
}