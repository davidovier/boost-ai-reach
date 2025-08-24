import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Target, TrendingUp, RefreshCw } from 'lucide-react';

interface ABTestData {
  variant: string;
  assignments: number;
  completions: number;
  completion_rate: number;
  avg_steps_completed: number;
}

export function ABTestAnalytics() {
  const [data, setData] = useState<ABTestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchABTestData = async () => {
    setLoading(true);
    try {
      // Get variant assignments
      const { data: assignments } = await supabase
        .from('user_events')
        .select('metadata')
        .eq('event_name', 'ab_test_assigned')
        .eq('metadata->>test_name', 'onboarding_checklist');

      // Get completions
      const { data: completions } = await supabase
        .from('user_events')
        .select('metadata')
        .eq('event_name', 'onboarding_completed')
        .eq('metadata->>test_name', 'onboarding_checklist');

      // Process data by variant
      const variantStats: Record<string, ABTestData> = {};

      // Count assignments
      assignments?.forEach(event => {
        const variant = (event.metadata as any)?.variant;
        if (variant) {
          if (!variantStats[variant]) {
            variantStats[variant] = {
              variant,
              assignments: 0,
              completions: 0,
              completion_rate: 0,
              avg_steps_completed: 0
            };
          }
          variantStats[variant].assignments++;
        }
      });

      // Count completions and calculate averages
      const completionsByVariant: Record<string, { total: number; steps: number[] }> = {};
      
      completions?.forEach(event => {
        const variant = (event.metadata as any)?.variant;
        const completedSteps = (event.metadata as any)?.completed_steps || 0;
        
        if (variant) {
          if (!completionsByVariant[variant]) {
            completionsByVariant[variant] = { total: 0, steps: [] };
          }
          completionsByVariant[variant].total++;
          completionsByVariant[variant].steps.push(completedSteps);
        }
      });

      // Calculate final stats
      Object.keys(variantStats).forEach(variant => {
        const completionData = completionsByVariant[variant];
        if (completionData) {
          variantStats[variant].completions = completionData.total;
          variantStats[variant].completion_rate = 
            (completionData.total / variantStats[variant].assignments) * 100;
          variantStats[variant].avg_steps_completed = 
            completionData.steps.reduce((sum, steps) => sum + steps, 0) / completionData.steps.length;
        }
      });

      setData(Object.values(variantStats));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching A/B test data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchABTestData();
  }, []);

  const totalAssignments = data.reduce((sum, variant) => sum + variant.assignments, 0);
  const totalCompletions = data.reduce((sum, variant) => sum + variant.completions, 0);
  const overallCompletionRate = totalAssignments > 0 ? (totalCompletions / totalAssignments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Test Analytics</h2>
          <p className="text-muted-foreground">
            Onboarding Checklist Performance (Short vs Guided)
          </p>
        </div>
        <Button
          onClick={fetchABTestData}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Total Assignments</span>
          </div>
          <p className="text-2xl font-bold mt-2">{totalAssignments.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Total Completions</span>
          </div>
          <p className="text-2xl font-bold mt-2">{totalCompletions.toLocaleString()}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Overall Rate</span>
          </div>
          <p className="text-2xl font-bold mt-2">{overallCompletionRate.toFixed(1)}%</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Variants</span>
          </div>
          <p className="text-2xl font-bold mt-2">{data.length}</p>
        </Card>
      </div>

      {/* Variant Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Variant Performance</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4" />
            <p>No A/B test data available yet</p>
            <p className="text-sm">Users need to complete onboarding to generate data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map(variant => (
              <div key={variant.variant} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium capitalize">{variant.variant} Variant</h4>
                    <Badge variant={variant.variant === 'short' ? 'default' : 'secondary'}>
                      {variant.variant === 'short' ? 'Quick Start' : 'Guided Tour'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {variant.completion_rate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                    <p className="text-xl font-semibold">{variant.assignments.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completions</p>
                    <p className="text-xl font-semibold">{variant.completions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Steps Completed</p>
                    <p className="text-xl font-semibold">{variant.avg_steps_completed.toFixed(1)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{variant.completions}/{variant.assignments}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(variant.completion_rate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </Card>
    </div>
  );
}