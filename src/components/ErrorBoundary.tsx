import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'app' | 'page' | 'component';
  context?: string;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.context || 'unknown'}:`, error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo, this.props.context);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const { level = 'component', context = 'Unknown Component', showDetails = false } = this.props;
      const { error, errorInfo, errorId } = this.state;

      // App-level error (full page)
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              {/* Hero Section */}
              <div className="space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-destructive to-destructive/80 rounded-full opacity-20 animate-pulse"></div>
                  <div className="relative bg-destructive/10 backdrop-blur-sm border border-destructive/20 rounded-full w-full h-full flex items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                      Something went wrong
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      We've encountered an unexpected error
                    </p>
                  </div>
                  
                  <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Our team has been automatically notified and is working to fix this issue. 
                    You can try refreshing the page or contact our support team if the problem persists.
                  </p>
                  
                  {errorId && (
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        Error ID: {errorId}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Error Details (Development) */}
                {process.env.NODE_ENV === 'development' && error && showDetails && (
                  <details className="text-left bg-muted/50 border border-border rounded-lg p-4 max-w-2xl mx-auto">
                    <summary className="cursor-pointer font-medium text-sm mb-3 text-foreground">
                      🔧 Error Details (Development)
                    </summary>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-destructive text-sm mb-1">Error Message:</h4>
                        <p className="text-xs text-muted-foreground font-mono bg-background rounded p-2 border">
                          {error.message}
                        </p>
                      </div>
                      {errorInfo && (
                        <div>
                          <h4 className="font-medium text-destructive text-sm mb-1">Component Stack:</h4>
                          <pre className="text-xs text-muted-foreground font-mono bg-background rounded p-2 border overflow-auto max-h-32">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <Button 
                    onClick={this.handleReload} 
                    size="lg" 
                    className="min-w-[160px] bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Reload Page
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                    <Link to="/">
                      <Home className="mr-2 h-5 w-5" />
                      Back to Home
                    </Link>
                  </Button>
                </div>

                {/* Support Section */}
                <div className="pt-8 border-t border-border/50 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Need help?</h2>
                  <div className="flex flex-wrap gap-6 justify-center text-sm">
                    <a 
                      href="mailto:support@findable.ai?subject=Error%20Report&body=Error%20ID:%20{errorId}" 
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      Contact Support
                    </a>
                    <Link to="/changelog" className="text-primary hover:underline">
                      Status Page
                    </Link>
                    <a 
                      href="https://docs.findable.ai/troubleshooting" 
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Help Center
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Page-level error (within layout)
      if (level === 'page') {
        return (
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Page Error</CardTitle>
                <p className="text-muted-foreground">
                  This page encountered an error and couldn't load properly.
                </p>
                {errorId && (
                  <Badge variant="outline" className="font-mono text-xs mx-auto w-fit">
                    Error ID: {errorId}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {process.env.NODE_ENV === 'development' && error && (
                  <details className="text-left bg-muted/50 border border-border rounded-lg p-3">
                    <summary className="cursor-pointer font-medium text-sm mb-2">
                      Development Details
                    </summary>
                    <p className="text-xs text-muted-foreground font-mono">
                      {error.message}
                    </p>
                  </details>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={this.handleReset} variant="default">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/dashboard">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component-level error (inline)
      return (
        <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-medium text-destructive">
                  {context} Error
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This component failed to load. You can try refreshing it or continue using other parts of the app.
                </p>
                {errorId && (
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    Error ID: {errorId}
                  </p>
                )}
              </div>
              
              {process.env.NODE_ENV === 'development' && error && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium mb-1">Details</summary>
                  <pre className="text-muted-foreground bg-background rounded p-2 border overflow-auto max-h-24">
                    {error.message}
                  </pre>
                </details>
              )}
              
              <Button 
                onClick={this.handleReset} 
                variant="outline" 
                size="sm"
                className="h-8"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components for different levels
export const AppErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary level="app" context="Application" showDetails={true}>
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary = ({ children, context }: { children: ReactNode; context?: string }) => (
  <ErrorBoundary level="page" context={context}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, context }: { children: ReactNode; context?: string }) => (
  <ErrorBoundary level="component" context={context}>
    {children}
  </ErrorBoundary>
);