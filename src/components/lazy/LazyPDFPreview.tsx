import { lazy } from 'react';

// Lazy load PDF preview to reduce initial bundle size
export const LazyPDFPreview = lazy(() => 
  Promise.resolve().then(() => ({
    default: ({ src, title }: { src: string; title: string }) => (
      <iframe
        src={src}
        className="w-full h-full"
        title={title}
        loading="lazy"
      />
    )
  }))
);

// PDF preview loading fallback
export const PDFLoader = () => (
  <div className="w-full h-96 flex items-center justify-center bg-muted/20 rounded-lg border">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading PDF preview...</p>
    </div>
  </div>
);