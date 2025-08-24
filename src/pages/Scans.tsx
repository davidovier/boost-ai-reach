import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton-enhanced';
import { ActionTooltip } from '@/components/ui/tooltip';
import { getBreadcrumbJsonLd, stringifyJsonLd } from '@/lib/seo';
import { Search, TrendingUp, AlertTriangle, CheckCircle, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';

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
  const navigate = useNavigate();
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

  const getScoreColor = (score: number | null): 'high' | 'medium' | 'low' => {
    if (!score) return 'low';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const getIssueCount = (scan: Scan): number => {
    let issues = 0;
    if ((scan.ai_findability_score || 0) < 70) issues++;
    if ((scan.crawlability_score || 0) < 70) issues++;
    if ((scan.summarizability_score || 0) < 70) issues++;
    return issues;
  };

  const handleViewScan = (scanId: string) => {
    navigate(`/scans/${scanId}`);
  };

  const handleEditScan = (scanId: string) => {
    // Navigate to edit scan or trigger edit modal
    // TODO: Implement scan editing
  };

  const handleDeleteScan = (scanId: string) => {
    // Trigger delete confirmation
    // TODO: Implement scan deletion
  };

  return (
    <PageErrorBoundary context="Website Scans">
      <SEO 
        title="Website Scans - FindableAI"
        description="View and manage your website scan results, AI findability scores, and optimization recommendations."
        url="/scans"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

      <div className="space-y-6 sm:space-y-8 table-mobile">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-mobile">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground heading-responsive">Website Scans</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-responsive">
              Monitor your website's AI findability scores and optimization progress
            </p>
          </div>
          <Button className="w-full sm:w-auto min-h-[44px] btn-focus touch-target interactive btn-responsive">
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        </header>

        {loading ? (
          <div className="stagger-animation space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="enhanced-table-row p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <Card className="card-reveal">
            <CardContent className="p-8 text-center">
              <div className="interactive-hover inline-block p-4 rounded-full bg-muted/30 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first website to start analyzing its AI findability score
              </p>
              <Button className="btn-focus interactive-hover">
                <Plus className="h-4 w-4 mr-2" />
                Run Your First Scan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ComponentErrorBoundary context="Scans Table">
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="enhanced-table" role="table" aria-label="Website scans data">
                <thead>
                  <tr>
                    <th scope="col">Website</th>
                    <th scope="col">Scan Date</th>
                    <th scope="col">AI Score</th>
                    <th scope="col">Issues</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan, index) => (
                    <tr 
                      key={scan.id}
                      onClick={() => handleViewScan(scan.id)}
                      className="enhanced-table-row cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="website-cell">
                        <div className="website-name">{scan.site?.name || 'Unnamed Site'}</div>
                        <div className="website-url">{scan.site?.url}</div>
                      </td>
                      <td>
                        <time dateTime={scan.scan_date}>
                          {format(new Date(scan.scan_date), 'MMM d, yyyy')}
                        </time>
                      </td>
                      <td className="score-cell">
                        <div className={`score-badge ${getScoreColor(scan.ai_findability_score)}`}>
                          <span>{scan.ai_findability_score || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="issues-cell">
                        <div className="issues-count">
                          {getIssueCount(scan) > 0 ? (
                            <>
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="count-badge">{getIssueCount(scan)}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>None</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <div className="row-actions action-buttons">
                          <ActionTooltip content="View details">
                            <button 
                              className="action-btn interactive-hover"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewScan(scan.id);
                              }}
                              aria-label="View scan details"
                            >
                              <Eye />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip content="Edit scan">
                            <button 
                              className="action-btn interactive-hover"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditScan(scan.id);
                              }}
                              aria-label="Edit scan"
                            >
                              <Edit />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip content="Delete scan">
                            <button 
                              className="action-btn interactive-hover"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScan(scan.id);
                              }}
                              aria-label="Delete scan"
                            >
                              <Trash2 />
                            </button>
                          </ActionTooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-cards">
              {scans.map((scan, index) => (
                <div 
                  key={scan.id}
                  className="scan-card interactive-hover cursor-pointer card-mobile"
                  onClick={() => handleViewScan(scan.id)}
                >
                  <div className="card-header">
                    <div className="website-info">
                      <div className="title">{scan.site?.name || 'Unnamed Site'}</div>
                      <div className="text-xs text-muted-foreground">{scan.site?.url}</div>
                    </div>
                    <div className="actions">
                      <ActionTooltip content="View details">
                        <button 
                          className="action-btn touch-target"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewScan(scan.id);
                          }}
                          aria-label="View scan details"
                        >
                          <Eye />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip content="Edit scan">
                        <button 
                          className="action-btn touch-target"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditScan(scan.id);
                          }}
                          aria-label="Edit scan"
                        >
                          <Edit />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip content="Delete scan">
                        <button 
                          className="action-btn touch-target"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScan(scan.id);
                          }}
                          aria-label="Delete scan"
                        >
                          <Trash2 />
                        </button>
                      </ActionTooltip>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="metrics">
                      <div className="metric">
                        <div className="label">AI Score</div>
                        <div className="value">
                          <div className={`score-badge ${getScoreColor(scan.ai_findability_score)}`}>
                            {scan.ai_findability_score || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="metric">
                        <div className="label">Issues</div>
                        <div className="value">
                          {getIssueCount(scan) > 0 ? (
                            <div className="issues-count">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="count-badge">{getIssueCount(scan)}</span>
                            </div>
                          ) : (
                            <div className="issues-count">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>None</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="timestamp">
                      Scanned on {format(new Date(scan.scan_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ComponentErrorBoundary>
        )}
      </div>
    </PageErrorBoundary>
  );
}