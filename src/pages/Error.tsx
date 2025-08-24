import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    // Log error for debugging
    if (error) {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <>
      <SEO
        title="System Error"
        description="We're experiencing technical difficulties. Our team has been notified and is working to resolve the issue quickly."
        url="/error"
        noindex={true}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Hero Image */}
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&crop=center&fm=webp"
              alt="System error illustration - technical difficulties with server infrastructure"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="absolute top-4 right-4 bg-destructive/90 text-destructive-foreground rounded-full p-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-destructive">
                Oops!
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Something Went Wrong
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                We've encountered an unexpected error. Our team has been notified and is working 
                to fix this issue. Please try refreshing the page or come back in a few minutes.
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left bg-muted p-4 rounded-lg max-w-lg mx-auto">
                <summary className="cursor-pointer font-medium text-sm mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleRefresh} 
                size="lg" 
                className="min-w-[160px]"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Try Again
                  </>
                )}
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Support Information */}
            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                Still having trouble? We're here to help!
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <a 
                  href="mailto:support@findable.ai" 
                  className="text-primary hover:underline"
                >
                  Contact Support
                </a>
                <Link to="/changelog" className="text-primary hover:underline">
                  System Status
                </Link>
                <a 
                  href="https://status.findable.ai" 
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Service Status
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}