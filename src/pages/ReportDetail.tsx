import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Users,
  Calendar
} from 'lucide-react';
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

interface ReportData {
  scores: {
    findability: number;
    metadata: number;
    schema: number;
    crawlability: number;
  };
  tips: Array<{
    id: number;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'todo' | 'done';
  }>;
  competitors: Array<{
    domain: string;
    score: number;
    delta: number;
  }>;
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      
      // Fetch report metadata
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (reportError) throw reportError;
      setReport(reportData);

      // Mock report data - in real app, this would come from the report content
      const mockData: ReportData = {
        scores: {
          findability: 78,
          metadata: 85,
          schema: 72,
          crawlability: 80,
        },
        tips: [
          {
            id: 1,
            title: 'Add Schema.org markup',
            description: 'Implement structured data to help AI understand your content better',
            severity: 'high',
            status: 'todo',
          },
          {
            id: 2,
            title: 'Optimize meta descriptions',
            description: 'Write compelling meta descriptions under 160 characters',
            severity: 'medium',
            status: 'todo',
          },
          {
            id: 3,
            title: 'Improve page loading speed',
            description: 'Optimize images and reduce bundle size for better crawlability',
            severity: 'medium',
            status: 'done',
          },
        ],
        competitors: [
          { domain: 'competitor1.com', score: 82, delta: -4 },
          { domain: 'competitor2.com', score: 75, delta: +3 },
          { domain: 'competitor3.com', score: 88, delta: -10 },
        ],
      };
      
      setReportData(mockData);
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return 'Custom period';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: window.location.origin },
    { name: 'Reports', item: `${window.location.origin}/reports` },
    { name: 'Report Detail', item: `${window.location.origin}/reports/${id}` },
  ]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Report not found</h2>
        <p className="text-muted-foreground mb-4">
          The report you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link to="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`Report Detail – ${formatPeriod(report.period_start, report.period_end)} | FindableAI`}
        description="Detailed AI findability report with scores, optimization tips, and competitor analysis."
        url={`/reports/${id}`}
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Report Detail</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatPeriod(report.period_start, report.period_end)}
                <span>•</span>
                Generated {new Date(report.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {report.pdf_url && (
            <Button asChild>
              <a href={report.pdf_url} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
        </div>

        {/* Score Overview */}
        {reportData && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Findability Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.scores.findability}</div>
                <p className="text-xs text-muted-foreground">Overall AI visibility</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metadata Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.scores.metadata}</div>
                <p className="text-xs text-muted-foreground">Meta tags quality</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Schema Score</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.scores.schema}</div>
                <p className="text-xs text-muted-foreground">Structured data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crawlability</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.scores.crawlability}</div>
                <p className="text-xs text-muted-foreground">Technical SEO</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tips">Optimization Tips</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            {report.pdf_url && <TabsTrigger value="preview">PDF Preview</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Summary</CardTitle>
                <CardDescription>
                  AI findability analysis for the period {formatPeriod(report.period_start, report.period_end)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <p>
                    This report analyzes your website's visibility and findability in AI-powered search results. 
                    The analysis covers metadata optimization, structured data implementation, crawlability, 
                    and competitive positioning.
                  </p>
                  
                  {reportData && (
                    <div className="mt-4 space-y-2">
                      <p><strong>Overall Findability Score:</strong> {reportData.scores.findability}/100</p>
                      <p><strong>Key Areas for Improvement:</strong></p>
                      <ul className="list-disc pl-6">
                        {reportData.scores.schema < 80 && <li>Schema.org structured data implementation</li>}
                        {reportData.scores.metadata < 80 && <li>Meta tag optimization</li>}
                        {reportData.scores.crawlability < 80 && <li>Technical SEO improvements</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            {reportData?.tips.map((tip) => (
              <Card key={tip.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <CardDescription className="mt-1">{tip.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(tip.severity) as any}>
                        {tip.severity}
                      </Badge>
                      <Badge variant={tip.status === 'done' ? 'default' : 'outline'}>
                        {tip.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Analysis</CardTitle>
                <CardDescription>
                  How your AI findability compares to tracked competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.competitors.map((competitor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{competitor.domain}</div>
                        <div className="text-sm text-muted-foreground">
                          Score: {competitor.score}
                        </div>
                      </div>
                      <Badge variant={competitor.delta >= 0 ? 'default' : 'destructive'}>
                        {competitor.delta >= 0 ? '+' : ''}{competitor.delta}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {report.pdf_url && (
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>PDF Preview</CardTitle>
                  <CardDescription>
                    Preview of the full report document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      src={report.pdf_url}
                      className="w-full h-full"
                      title="Report PDF Preview"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}