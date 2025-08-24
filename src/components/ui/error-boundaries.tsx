import { UnexpectedError, MaintenanceMode, SessionExpired } from '@/components/ui/empty-states';
import { ReactNode } from 'react';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  context?: string;
}

export function ErrorFallback({ error, onRetry, context }: ErrorFallbackProps) {
  // Check for specific error types
  if (error?.message.includes('Session expired') || error?.message.includes('Invalid token')) {
    return (
      <SessionExpired 
        onSignIn={() => window.location.href = '/signin'} 
      />
    );
  }

  if (error?.message.includes('Maintenance') || error?.message.includes('Service unavailable')) {
    return (
      <MaintenanceMode 
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Generic error fallback
  return (
    <UnexpectedError
      onRetry={onRetry || (() => window.location.reload())}
      onReportIssue={() => window.open('https://lovable.dev/support', '_blank')}
    />
  );
}

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ChunkErrorBoundary({ children, fallback }: ChunkErrorBoundaryProps) {
  // This would be implemented with React Error Boundary in a real app
  // For now, just render children
  return <>{children}</>;
}