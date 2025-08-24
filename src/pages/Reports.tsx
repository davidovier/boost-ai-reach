import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { FileText, Download, Calendar, Loader2, Eye, Share2, Sparkles, BarChart3 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { ReportsGridSkeleton } from '@/components/ui/loading-states';
import { EmptyReports } from '@/components/ui/empty-states';
import { UsageLimitBanner } from '@/components/ui/usage-limit-banner';
import { UpgradeModal } from '@/components/ui/upgrade-modal';

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
  const { getReachedLimits, getNearLimitWarnings, hasNearLimitWarnings, refresh } = useUsageLimits();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
        title: 'Failed to load reports',
        description: 'Could not fetch your reports. Please try again.',
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
        title: '✅ Report generated',
        description: 'Your report has been generated successfully',
        className: 'success-animation'
      });

      await fetchReports();
      refresh(); // Refresh usage data
    } catch (error: any) {
      console.error('Error generating report:', error);
      const msg = error.message || '';
      const quota = msg.includes('quota_exceeded') || msg.includes('402');
      
      if (quota) {
        setShowUpgradeModal(true);
      } else {
        toast({
          title: 'Failed to generate report',
          description: error.message || 'Could not create report. Please try again.',
          variant: 'destructive',
        });
      }
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
        title="AI Findability Reports"
        description="Generate and download comprehensive AI findability reports with insights, recommendations, competitor analysis, and actionable strategies."
        url="/reports"
        keywords="AI findability reports, competitor analysis, SEO insights, optimization strategy"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Premium Reports</h1>
            <p className="text-muted-foreground">
              Generate comprehensive AI findability reports with insights and competitor analysis
            </p>
          </div>
          
          <Button 
            onClick={handleGenerateReport} 
            disabled={generating}
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate New Report
          </Button>
        </div>

        {/* Usage Limit Warnings */}
        {hasNearLimitWarnings() && (
          <UsageLimitBanner 
            warnings={getNearLimitWarnings().filter(w => w.type === 'report')} 
          />
        )}

        {loading ? (
          <ReportsGridSkeleton />
        ) : reports.length === 0 ? (
          <EmptyReports onGenerateClick={handleGenerateReport} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <div key={report.id} className="premium-report-card group">
                {/* Preview Image/Chart Area */}
                <div className="report-preview">
                  <div className="preview-gradient">
                    <BarChart3 className="w-12 h-12 text-white/80" />
                  </div>
                  <Badge 
                    variant={report.pdf_url ? "default" : "secondary"}
                    className="absolute top-3 right-3 text-xs font-medium"
                  >
                    {report.pdf_url ? 'Ready' : 'Processing'}
                  </Badge>
                  
                  {/* Hover Overlay */}
                  <div className="hover-overlay">
                    <div className="quick-actions">
                      <Button asChild size="sm" variant="secondary" className="backdrop-blur-sm">
                        <Link to={`/reports/${report.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {report.pdf_url && (
                        <>
                          <Button asChild size="sm" variant="secondary" className="backdrop-blur-sm">
                            <a href={report.pdf_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </a>
                          </Button>
                          <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="report-card-content">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      AI Findability Report
                    </h3>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatPeriod(report.period_start, report.period_end)}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Generated: {new Date(report.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 hover:bg-primary/5">
                      <Link to={`/reports/${report.id}`}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    
                    {report.pdf_url && (
                      <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary">
                        <a href={report.pdf_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reachedLimits={getReachedLimits().filter(l => l.type === 'report')}
      />
    </>
  );
}