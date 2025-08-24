import { lazy } from 'react';

// Lazy load ReactMarkdown to reduce initial bundle size
export const LazyReactMarkdown = lazy(() => import('react-markdown'));

// Lazy load remark plugins
export const remarkGfm = lazy(() => import('remark-gfm').then(module => ({ default: module.default })));

// Markdown loading fallback
export const MarkdownLoader = () => (
  <div className="w-full min-h-32 flex items-center justify-center bg-muted/20 rounded-lg">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading content...</p>
    </div>
  </div>
);