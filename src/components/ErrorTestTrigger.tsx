import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bug, Zap } from 'lucide-react';

interface ErrorTestTriggerProps {
  className?: string;
}

// Component that can be added to test error boundaries
export function ErrorTestTrigger({ className }: ErrorTestTriggerProps) {
  const [shouldError, setShouldError] = useState(false);

  // This will trigger an error on the next render
  if (shouldError) {
    throw new Error('Test error triggered by ErrorTestTrigger component');
  }

  const triggerError = () => {
    setShouldError(true);
  };

  const triggerAsyncError = () => {
    // Simulate an async error that might not be caught by error boundaries
    setTimeout(() => {
      throw new Error('Async test error triggered by ErrorTestTrigger');
    }, 100);
  };

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('Promise rejection test error')).catch(() => {
      // This will show in console but won't trigger error boundary
      console.error('Uncaught promise rejection (this is expected for testing)');
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-destructive" />
          Error Boundary Testing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the error boundary system with different types of errors
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Development Only</p>
            <p className="text-muted-foreground">These buttons will trigger errors for testing purposes.</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Component Error</Badge>
            </div>
            <Button 
              onClick={triggerError}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Trigger Component Error
            </Button>
            <p className="text-xs text-muted-foreground">
              This will trigger a render error that should be caught by the error boundary.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Async Error</Badge>
            </div>
            <Button 
              onClick={triggerAsyncError}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Trigger Async Error
            </Button>
            <p className="text-xs text-muted-foreground">
              This will trigger an async error that won't be caught by error boundaries.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Promise Rejection</Badge>
            </div>
            <Button 
              onClick={triggerPromiseRejection}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Trigger Promise Rejection
            </Button>
            <p className="text-xs text-muted-foreground">
              This will trigger an unhandled promise rejection (console error only).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to add error test trigger to any component in development
export function useErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  const triggerError = () => setShouldError(true);

  if (shouldError) {
    throw new Error('Test error triggered by useErrorTest hook');
  }

  return { triggerError };
}