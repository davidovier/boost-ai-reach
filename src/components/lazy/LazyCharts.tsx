import { lazy } from 'react';

// Lazy load recharts components to reduce initial bundle size
export const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.BarChart 
  }))
);

export const LazyLineChart = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.LineChart 
  }))
);

export const LazyResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.ResponsiveContainer 
  }))
);

// Re-export other chart components for consistency
export const LazyBar = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Bar 
  }))
);

export const LazyLine = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Line 
  }))
);

export const LazyXAxis = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.XAxis 
  }))
);

export const LazyYAxis = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.YAxis 
  }))
);

export const LazyCartesianGrid = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.CartesianGrid 
  }))
);

export const LazyTooltip = lazy(() => 
  import('recharts').then(module => ({ 
    default: module.Tooltip 
  }))
);

// Chart loading fallback
export const ChartLoader = () => (
  <div className="w-full h-64 flex items-center justify-center bg-muted/20 rounded-lg">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading chart...</p>
    </div>
  </div>
);