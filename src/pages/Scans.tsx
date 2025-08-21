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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { Search, TrendingUp, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

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

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'Scans', item: `${origin}/scans` },
  ]);

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

      <ScansContent user={user} />
    </>
  );
}

function ScansContent({ user }: { user: any }) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchScans();
    }
  }, [user, currentPage]);

  const fetchScans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scans')
        .select(`
          id,
          scan_date,
          ai_findability_score,
          crawlability_score,
          summarizability_score,
          metadata,
          sites:site_id (
            name,
            url
          )
        `)
        .order('scan_date', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

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
    // Mock issue count based on scores - in real app this would be calculated
    const scores = [scan.ai_findability_score, scan.crawlability_score, scan.summarizability_score];
    return scores.filter(score => score && score < 70).length;
  };

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', item: `${window.location.origin}/` },
    { name: 'Dashboard', item: `${window.location.origin}/dashboard` },
    { name: 'Scans', item: `${window.location.origin}/scans` }
  ]);

  return (
    <>
      <SEO 
        title="Website Scans - FindableAI"
        description="View and manage your website AI findability scans. Track scores, identify issues, and optimize for better AI visibility."
        url={`${window.location.origin}/scans`}
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJsonLd) }} 
      />

      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Website Scans</h1>
            <p className="text-muted-foreground mt-1">
              Analyze your websites for AI findability optimization
            </p>
          </div>
          <Button className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        </header>

        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <div className="p-4 border-b">
                  <Skeleton className="h-4 w-32" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border-b last:border-b-0 flex items-center space-x-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : scans.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                No scans yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Add your first website to start analyzing its AI findability score
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Run Your First Scan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Website</TableHead>
                      <TableHead>Scan Date</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Issues Found</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {scan.site?.name || 'Unnamed Site'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {scan.site?.url}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <time dateTime={scan.scan_date}>
                            {format(new Date(scan.scan_date), 'MMM d, yyyy')}
                          </time>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScoreColor(scan.ai_findability_score)}>
                            {scan.ai_findability_score || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getIssueCount(scan) > 0 ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span>{getIssueCount(scan)} issues</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>No issues</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/scans/${scan.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {scans.map((scan) => (
                <Card key={scan.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {scan.site?.name || 'Unnamed Site'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {scan.site?.url}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Scan Date:</span>
                      <time dateTime={scan.scan_date} className="text-sm">
                        {format(new Date(scan.scan_date), 'MMM d, yyyy')}
                      </time>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AI Score:</span>
                      <Badge variant={getScoreColor(scan.ai_findability_score)}>
                        {scan.ai_findability_score || 'N/A'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Issues:</span>
                      <div className="flex items-center gap-2">
                        {getIssueCount(scan) > 0 ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-sm">{getIssueCount(scan)}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">None</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/scans/${scan.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {scans.length === itemsPerPage && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}