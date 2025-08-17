import { useState, useEffect } from 'react';
import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, FileText, Calendar, User, Globe } from 'lucide-react';

interface ReportData {
  id: string;
  user_id: string;
  site_id: string | null;
  period_start: string | null;
  period_end: string | null;
  pdf_url: string | null;
  created_at: string;
  user_email: string;
  user_name: string;
  site_url: string | null;
  site_name: string | null;
}

function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          user_id,
          site_id,
          period_start,
          period_end,
          pdf_url,
          created_at,
          profiles!inner(email, name),
          sites(url, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports = data?.map((report: any) => ({
        id: report.id,
        user_id: report.user_id,
        site_id: report.site_id,
        period_start: report.period_start,
        period_end: report.period_end,
        pdf_url: report.pdf_url,
        created_at: report.created_at,
        user_email: report.profiles.email,
        user_name: report.profiles.name || 'Unknown',
        site_url: report.sites?.url || null,
        site_name: report.sites?.name || null,
      })) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(new Set(reports.map(r => r.id)));
    } else {
      setSelectedReports(new Set());
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    const newSelected = new Set(selectedReports);
    if (checked) {
      newSelected.add(reportId);
    } else {
      newSelected.delete(reportId);
    }
    setSelectedReports(newSelected);
  };

  const regenerateReports = async () => {
    if (selectedReports.size === 0) {
      toast({
        title: 'No reports selected',
        description: 'Please select reports to regenerate',
        variant: 'destructive',
      });
      return;
    }

    setRegenerating(true);
    try {
      const promises = Array.from(selectedReports).map(async (reportId) => {
        const report = reports.find(r => r.id === reportId);
        if (!report) return;

        const { error } = await supabase.functions.invoke('reports', {
          body: {
            userId: report.user_id,
            siteId: report.site_id,
            periodStart: report.period_start,
            periodEnd: report.period_end,
          },
        });

        if (error) throw error;
      });

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `${selectedReports.size} report(s) queued for regeneration`,
      });

      setSelectedReports(new Set());
      setTimeout(fetchReports, 2000); // Refresh after a delay
    } catch (error) {
      console.error('Error regenerating reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate some reports',
        variant: 'destructive',
      });
    } finally {
      setRegenerating(false);
    }
  };

  const getReportStatus = (report: ReportData) => {
    if (!report.pdf_url) {
      const createdAt = new Date(report.created_at);
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      if (hoursDiff < 1) {
        return { label: 'Processing', variant: 'secondary' as const };
      } else {
        return { label: 'Failed', variant: 'destructive' as const };
      }
    }
    return { label: 'Ready', variant: 'default' as const };
  };

  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return 'N/A';
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  };

  const totalReports = reports.length;
  const readyReports = reports.filter(r => r.pdf_url).length;
  const processingReports = reports.filter(r => !r.pdf_url && new Date().getTime() - new Date(r.created_at).getTime() < 3600000).length;
  const failedReports = reports.filter(r => !r.pdf_url && new Date().getTime() - new Date(r.created_at).getTime() >= 3600000).length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Admin",
        "item": "/admin"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Reports Management",
        "item": "/admin/reports"
      }
    ]
  };

  return (
    <>
      <SEO
        title="Reports Management - Admin Panel"
        description="Manage user reports, monitor generation status, and perform bulk operations"
        noindex
      />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </script>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports Management</h1>
            <p className="text-muted-foreground">Monitor and manage user report generation</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={regenerateReports}
              disabled={selectedReports.size === 0 || regenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : `Regenerate (${selectedReports.size})`}
            </Button>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalReports}</div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <Download className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold text-success">{readyReports}</div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold text-primary">{processingReports}</div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <FileText className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold text-destructive">{failedReports}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedReports.size === reports.length && reports.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all reports"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => {
                      const status = getReportStatus(report);
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedReports.has(report.id)}
                              onCheckedChange={(checked) => handleSelectReport(report.id, checked as boolean)}
                              aria-label={`Select report for ${report.user_name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{report.user_name}</div>
                                <div className="text-sm text-muted-foreground">{report.user_email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report.site_url ? (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{report.site_name || 'Unnamed Site'}</div>
                                  <div className="text-sm text-muted-foreground truncate max-w-48">
                                    {report.site_url}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                All Sites
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatPeriod(report.period_start, report.period_end)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {report.pdf_url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(report.pdf_url!, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                {status.label}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default withAdminGuard(AdminReportsPage);