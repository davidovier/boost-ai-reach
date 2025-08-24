import { lazy } from 'react';

// Lazy load the competitor comparison chart
export const LazyCompetitorComparisonChart = lazy(() => import('@/components/CompetitorComparisonChart').then(module => ({
  default: module.CompetitorComparisonChart
})));

// Chart loading fallback
export const CompetitorChartLoader = () => (
  <div className="w-full h-80 flex items-center justify-center bg-muted/20 rounded-lg border">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading competitor comparison...</p>
    </div>
  </div>
);