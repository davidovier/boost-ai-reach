import { logger } from './logger';

// Web Vitals metrics
interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

// Performance observer for Core Web Vitals
class PerformanceMonitor {
  private vitals: WebVitals = {};
  private observers: PerformanceObserver[] = [];
  private reportingEnabled: boolean;

  constructor() {
    this.reportingEnabled = process.env.NODE_ENV === 'production';
    this.initializeObservers();
  }

  private initializeObservers() {
    // Only run in browsers that support PerformanceObserver
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          this.vitals.LCP = Math.round(lastEntry.startTime);
          this.reportMetric('LCP', this.vitals.LCP);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-input') {
            this.vitals.FID = Math.round(entry.processingStart - entry.startTime);
            this.reportMetric('FID', this.vitals.FID);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.vitals.CLS = Math.round(clsValue * 1000) / 1000;
        this.reportMetric('CLS', this.vitals.CLS);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // First Contentful Paint
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.FCP = Math.round(entry.startTime);
            this.reportMetric('FCP', this.vitals.FCP);
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(navigationObserver);

      // Time to First Byte
      const ttfbObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.name === location.href) {
            this.vitals.TTFB = Math.round(entry.responseStart - entry.startTime);
            this.reportMetric('TTFB', this.vitals.TTFB);
          }
        });
      });
      ttfbObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(ttfbObserver);

    } catch (error) {
      logger.error('Failed to initialize performance observers:', error);
    }
  }

  private reportMetric(name: string, value: number) {
    if (!this.reportingEnabled) {
      logger.debug(`Performance metric - ${name}: ${value}`);
      return;
    }

    // Report to analytics service
    this.sendToAnalytics(name, value);

    // Log performance warnings
    this.checkPerformanceThresholds(name, value);
  }

  private checkPerformanceThresholds(name: string, value: number) {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return;

    if (value > threshold.poor) {
      logger.error(`Poor ${name} performance: ${value} (threshold: ${threshold.poor})`);
    } else if (value > threshold.good) {
      logger.warn(`Needs improvement ${name}: ${value} (threshold: ${threshold.good})`);
    }
  }

  private async sendToAnalytics(metric: string, value: number) {
    try {
      // Send to your analytics service
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          value,
          timestamp: Date.now(),
          url: location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Don't throw on analytics errors
      logger.debug('Analytics reporting failed:', error);
    }
  }

  // Get current vitals
  getVitals(): WebVitals {
    return { ...this.vitals };
  }

  // Manual performance measurement
  measure<T>(name: string, fn: () => T): T;
  measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
  measure<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        logger.debug(`Performance measure - ${name}: ${Math.round(duration)}ms`);
        this.reportCustomMetric(name, duration);
      });
    } else {
      const duration = performance.now() - start;
      logger.debug(`Performance measure - ${name}: ${Math.round(duration)}ms`);
      this.reportCustomMetric(name, duration);
      return result;
    }
  }

  private reportCustomMetric(name: string, duration: number) {
    if (this.reportingEnabled) {
      this.sendToAnalytics(`custom.${name}`, duration);
    }
  }

  // Resource performance analysis
  analyzeResources(): Array<{ name: string; duration: number; size?: number; type: string }> {
    if (typeof window === 'undefined') return [];

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources
      .map(resource => ({
        name: resource.name,
        duration: Math.round(resource.duration),
        size: resource.transferSize || undefined,
        type: this.getResourceType(resource.name),
      }))
      .filter(resource => resource.duration > 0)
      .sort((a, b) => b.duration - a.duration);
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }

  // Bundle analysis
  analyzeBundles(): void {
    if (typeof window === 'undefined') return;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    logger.info('Bundle Analysis:', {
      scriptCount: scripts.length,
      styleCount: styles.length,
      totalScripts: scripts.reduce((acc, script: any) => {
        const size = script.getAttribute('data-size');
        return acc + (size ? parseInt(size) : 0);
      }, 0),
    });
  }

  // Memory usage (Chrome only)
  getMemoryUsage(): any {
    if (typeof window === 'undefined' || !(window as any).performance?.memory) {
      return null;
    }

    const memory = (window as any).performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const vitals = performanceMonitor.getVitals();
  const memory = performanceMonitor.getMemoryUsage();
  
  return {
    vitals,
    memory,
    measure: performanceMonitor.measure.bind(performanceMonitor),
    analyzeResources: performanceMonitor.analyzeResources.bind(performanceMonitor),
  };
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  const resources = performanceMonitor.analyzeResources();
  const budget = {
    totalJS: 300 * 1024, // 300KB
    totalCSS: 100 * 1024, // 100KB
    totalImages: 1024 * 1024, // 1MB
    largestResource: 500 * 1024, // 500KB
  };

  const analysis = {
    js: resources.filter(r => r.type === 'script').reduce((acc, r) => acc + (r.size || 0), 0),
    css: resources.filter(r => r.type === 'stylesheet').reduce((acc, r) => acc + (r.size || 0), 0),
    images: resources.filter(r => r.type === 'image').reduce((acc, r) => acc + (r.size || 0), 0),
    largest: Math.max(...resources.map(r => r.size || 0)),
  };

  const violations = [];
  if (analysis.js > budget.totalJS) violations.push(`JS bundle too large: ${Math.round(analysis.js / 1024)}KB > ${Math.round(budget.totalJS / 1024)}KB`);
  if (analysis.css > budget.totalCSS) violations.push(`CSS bundle too large: ${Math.round(analysis.css / 1024)}KB > ${Math.round(budget.totalCSS / 1024)}KB`);
  if (analysis.images > budget.totalImages) violations.push(`Images too large: ${Math.round(analysis.images / 1024)}KB > ${Math.round(budget.totalImages / 1024)}KB`);
  if (analysis.largest > budget.largestResource) violations.push(`Largest resource too big: ${Math.round(analysis.largest / 1024)}KB > ${Math.round(budget.largestResource / 1024)}KB`);

  if (violations.length > 0) {
    logger.warn('Performance budget violations:', violations);
  } else {
    logger.info('Performance budget: All checks passed ✅');
  }

  return { analysis, violations, budget };
};

// Preload critical assets for better performance
export const preloadCriticalAssets = () => {
  if (typeof window === 'undefined') return;
  
  // Preload critical fonts
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  ];
  
  fontLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
    
    // Then load the actual stylesheet
    setTimeout(() => {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = href;
      document.head.appendChild(styleLink);
    }, 0);
  });
};

// Log bundle metrics for development
export const logBundleMetrics = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;
  
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const totalScripts = scripts.length;
  
  logger.debug('Bundle Metrics:', {
    totalScripts,
    mainBundle: scripts.find(s => s.src.includes('index'))?.src || 'Not found',
  });
};

export default performanceMonitor;