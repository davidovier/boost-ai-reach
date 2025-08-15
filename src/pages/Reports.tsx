import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Plus, Calendar, Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';

interface Report {
  id: string;
  period_start: string | null;
  period_end: string | null;
  pdf_url: string | null;
  created_at: string;
  site_id: string | null;
}

export default function Reports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke('reports', {
        body: { action: 'generate' },
      });

      if (error) throw error;

      toast({
        title: 'Report Generated',
        description: 'Your report has been generated successfully',
      });

      await fetchReports();
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return 'Custom period';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: window.location.origin },
    { name: 'Reports', item: `${window.location.origin}/reports` },
  ]);

  return (
    <>
      <SEO 
        title="Reports – AI Findability Analysis | FindableAI"
        description="Generate and download comprehensive AI findability reports with insights, recommendations, and competitor analysis."
        url="/reports"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              Generate and download comprehensive AI findability reports
            </p>
          </div>
          
          <Button onClick={handleGenerateReport} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate New Report
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No reports generated yet</CardTitle>
            <CardDescription className="mb-4">
              Generate your first report to get actionable insights and recommendations
            </CardDescription>
            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Generate Your First Report
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Report
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatPeriod(report.period_start, report.period_end)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.pdf_url ? 'Ready' : 'Processing'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Generated: {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/reports/${report.id}`}>
                        <FileText className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                    
                    {report.pdf_url && (
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <a href={report.pdf_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1 h-3 w-3" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}