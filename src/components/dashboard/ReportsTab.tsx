import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Download,
  Eye,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Site {
  id: string;
  url: string;
  name: string;
}

interface Report {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_at: string;
  site_name: string;
  site_id?: string;
  download_url?: string;
  error_message?: string;
}

interface ReportsTabProps {
  reports: Report[];
  sites: Site[];
  onDataUpdate: () => void;
}

export function ReportsTab({ reports, sites, onDataUpdate }: ReportsTabProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canUseFeature } = useUsageLimits();
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [reportType, setReportType] = useState<string>('comprehensive');
  const [generating, setGenerating] = useState(false);

  const hasReportAccess = profile?.plan === 'pro' || profile?.plan === 'max';

  const handleGenerateReport = async () => {
    if (!hasReportAccess) {
      toast({
        title: 'Upgrade Required',
        description: 'Report generation is available with Pro and Max plans',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSite) {
      toast({
        title: 'Select Website',
        description: 'Please select a website to generate a report for',
        variant: 'destructive',
      });
      return;
    }

    if (!canUseFeature('reports')) {
      toast({
        title: 'Report limit reached',
        description: 'Upgrade your plan to generate more reports',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { 
          siteId: selectedSite,
          type: reportType
        }
      });

      if (error) throw error;

      toast({
        title: 'Report generation started',
        description: 'Your report is being generated. You will be notified when it\'s ready.',
      });

      onDataUpdate();
      setSelectedSite('');
    } catch (error: unknown) {
      toast({
        title: 'Generation failed',
        description: (error as Error)?.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-report', {
        body: { reportId }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-findability-report-${reportId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: 'Your report is downloading now',
      });
    } catch (error: unknown) {
      toast({
        title: 'Download failed',
        description: (error as Error)?.message || 'Failed to download report',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'failed': return XCircle;
      case 'processing': return Clock;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed': return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      case 'processing': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'comprehensive': return 'Comprehensive Analysis';
      case 'competitor': return 'Competitor Comparison';
      case 'quick': return 'Quick Summary';
      default: return type;
    }
  };

  // Sort reports by date, newest first
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  return (
    <div className="space-y-6">
      {!hasReportAccess && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Report generation is available with Pro and Max plans</span>
            <Button size="sm" onClick={() => navigate('/pricing')}>
              Upgrade Plan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select website to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  <SelectItem value="competitor">Competitor Comparison</SelectItem>
                  <SelectItem value="quick">Quick Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {reportType === 'comprehensive' && 'In-depth analysis with optimization recommendations'}
              {reportType === 'competitor' && 'Compare your AI findability against competitors'}
              {reportType === 'quick' && 'Quick overview of current AI findability status'}
            </div>
            <Button 
              onClick={handleGenerateReport}
              disabled={generating || !selectedSite || !hasReportAccess}
            >
              {generating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>

          {sites.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to add websites before you can generate reports.{' '}
                <button 
                  className="underline hover:no-underline"
                  onClick={() => navigate('/dashboard#websites')}
                >
                  Add your first website
                </button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Reports ({sortedReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedReports.length > 0 ? (
            <div className="space-y-4">
              {sortedReports.map((report) => {
                const StatusIcon = getStatusIcon(report.status);
                return (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold truncate">{report.site_name}</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {getReportTypeLabel(report.type)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Generated {format(new Date(report.generated_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        
                        {report.error_message && (
                          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {report.error_message}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <div className={`flex items-center gap-1 ${getStatusColor(report.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        
                        {report.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/report/${report.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-2" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadReport(report.id)}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Generated</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first AI findability report to get detailed insights and recommendations
              </p>
              {hasReportAccess && sites.length > 0 ? (
                <div className="max-w-md mx-auto">
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="mb-2">
                      <SelectValue placeholder="Select website" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.slice(0, 3).map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!selectedSite}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate First Report
                  </Button>
                </div>
              ) : !hasReportAccess ? (
                <Button onClick={() => navigate('/pricing')}>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade for Reports
                </Button>
              ) : (
                <Button onClick={() => navigate('/dashboard#websites')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Website First
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Benefits */}
      {hasReportAccess && (
        <Card>
          <CardHeader>
            <CardTitle>What's in Your Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Comprehensive Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Deep dive into your AI findability with detailed scoring
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-3">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Actionable Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Specific recommendations to improve your AI visibility
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-3">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Shareable PDFs</h4>
                <p className="text-sm text-muted-foreground">
                  Professional reports you can share with your team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}