/**
 * Performance optimization utilities
 */

// Image compression and optimization
export function getOptimizedImageUrl(
  baseUrl: string, 
  width: number, 
  height?: number,
  format: 'webp' | 'jpg' | 'png' = 'webp',
  quality: number = 80
): string {
  if (!baseUrl.includes('unsplash.com')) return baseUrl;
  
  const params = new URLSearchParams({
    q: quality.toString(),
    w: width.toString(),
    auto: 'format',
    fit: 'crop',
    fm: format
  });
  
  if (height) {
    params.set('h', height.toString());
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// Lazy loading intersection observer
export function createLazyLoader(callback: (entries: IntersectionObserverEntry[]) => void) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  });
}

// Critical resource loading
export function preloadCriticalAssets() {
  if (typeof window === 'undefined') return;
  
  const criticalImages = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop&fm=webp'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Bundle size monitoring
export function logBundleMetrics() {
  if (typeof window === 'undefined' || !('performance' in window)) return;
  
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    };
    
    console.log('Performance Metrics:', metrics);
  });
}