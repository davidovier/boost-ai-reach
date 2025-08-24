import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { 
  ArrowLeft, 
  Copy, 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  Code, 
  Zap, 
  Search,
  TrendingUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScanDetail {
  id: string;
  scan_date: string;
  ai_findability_score: number | null;
  crawlability_score: number | null;
  summarizability_score: number | null;
  metadata: any;
  schema_data: any;
  performance: any;
  site: {
    name: string;
    url: string;
  };
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  fix?: string;
}

export default function ScanDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metadata');

  useEffect(() => {
    if (user && id) {
      fetchScanDetail();
    }
  }, [user, id]);

  const fetchScanDetail = async () => {
    if (!user || !id) return;

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
          schema_data,
          performance,
          sites:site_id (
            name,
            url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setScan({
        ...data,
        site: data.sites
      });
    } catch (error) {
      console.error('Error fetching scan detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The fix has been copied to your clipboard."
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreIcon = (score: number | null) => {
    if (!score) return <AlertTriangle className="h-4 w-4" />;
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  // Mock issues based on scan data - in real app this would be analyzed from actual data
  const getIssuesForTab = (tab: string): Issue[] => {
    if (!scan) return [];
    
    switch (tab) {
      case 'metadata':
        return [
          {
            type: 'warning',
            title: 'Missing meta description',
            description: 'Your page is missing a meta description tag.',
            fix: '<meta name="description" content="Your page description here">'
          },
          {
            type: 'error',
            title: 'Title too long',
            description: 'Your page title exceeds the recommended 60 characters.',
            fix: 'Keep your title under 60 characters for better SEO'
          }
        ];
      case 'schema':
        return [
          {
            type: 'info',
            title: 'Add Organization schema',
            description: 'Adding Organization schema can help AI understand your business better.',
            fix: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Your Company",
              "url": scan.site.url
            }, null, 2)
          }
        ];
      case 'performance':
        return [
          {
            type: 'warning',
            title: 'Slow loading time',
            description: 'Page takes more than 3 seconds to load.',
            fix: 'Optimize images and reduce server response time'
          }
        ];
      case 'crawlability':
        return [
          {
            type: 'info',
            title: 'Add sitemap.xml',
            description: 'A sitemap helps search engines discover your content.',
            fix: 'Create and submit a sitemap.xml file'
          }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Scan not found</h1>
        <Button asChild>
          <Link to="/scans">Back to Scans</Link>
        </Button>
      </div>
    );
  }

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', item: `${window.location.origin}/` },
    { name: 'Dashboard', item: `${window.location.origin}/dashboard` },
    { name: 'Scans', item: `${window.location.origin}/scans` },
    { name: scan.site?.name || 'Scan Details', item: `${window.location.origin}/scans/${id}` }
  ]);

  return (
    <>
      <SEO 
        title={`Scan Results - ${scan.site?.name || 'Website Analysis'}`}
        description={`Detailed AI findability scan results for ${scan.site?.url || 'your website'} with optimization recommendations and actionable insights.`}
        url={`/scans/${id}`}
        ogType="article"
        noindex={true}
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJsonLd) }} 
      />

      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/scans">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to scans</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {scan.site?.name || 'Website Scan'}
            </h1>
            <p className="text-muted-foreground">
              Scanned on {format(new Date(scan.scan_date), 'MMMM d, yyyy')} • {scan.site?.url}
            </p>
          </div>
        </header>

        {/* Score Cards */}
        <section aria-labelledby="scores-heading">
          <h2 id="scores-heading" className="sr-only">Scan Scores</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Findability
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreColor(scan.ai_findability_score)} className="text-lg px-3 py-1">
                    {scan.ai_findability_score || 'N/A'}
                  </Badge>
                  {getScoreIcon(scan.ai_findability_score)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Crawlability
                </CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreColor(scan.crawlability_score)} className="text-lg px-3 py-1">
                    {scan.crawlability_score || 'N/A'}
                  </Badge>
                  {getScoreIcon(scan.crawlability_score)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Summarizability
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreColor(scan.summarizability_score)} className="text-lg px-3 py-1">
                    {scan.summarizability_score || 'N/A'}
                  </Badge>
                  {getScoreIcon(scan.summarizability_score)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overall Grade
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    B+
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Analysis Tabs */}
        <section aria-labelledby="analysis-heading">
          <h2 id="analysis-heading" className="sr-only">Detailed Analysis</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metadata" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Metadata</span>
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Schema</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="crawlability" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Crawlability</span>
              </TabsTrigger>
            </TabsList>

            {['metadata', 'schema', 'performance', 'crawlability'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{tab} Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getIssuesForTab(tab).map((issue, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {issue.type === 'error' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            {issue.type === 'info' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                            <Badge variant={
                              issue.type === 'error' ? 'destructive' : 
                              issue.type === 'warning' ? 'secondary' : 'outline'
                            }>
                              {issue.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-foreground">{issue.title}</h4>
                          <p className="text-muted-foreground text-sm mt-1">{issue.description}</p>
                        </div>

                        {issue.fix && (
                          <div className="bg-muted rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Suggested Fix:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(issue.fix!)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="text-xs bg-background rounded border p-2 overflow-x-auto">
                              <code>{issue.fix}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}

                    {getIssuesForTab(tab).length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">All Good!</h3>
                        <p className="text-muted-foreground">
                          No issues found in the {tab} analysis.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </>
  );
}