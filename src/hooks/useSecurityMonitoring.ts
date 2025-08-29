import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  eventType: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  details?: Record<string, any>;
}

export function useSecurityMonitoring() {
  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      await supabase.rpc('log_security_event', {
        event_type: event.eventType,
        severity: event.severity,
        details: event.details || {}
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const logAuthFailure = async (reason: string, details?: Record<string, any>) => {
    await logSecurityEvent({
      eventType: 'auth_failed_login',
      severity: 'warn',
      details: { reason, ...details }
    });
  };

  const logPermissionDenied = async (action: string, resource?: string) => {
    await logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'warn',
      details: { action, resource }
    });
  };

  const logSuspiciousActivity = async (activity: string, details?: Record<string, any>) => {
    await logSecurityEvent({
      eventType: 'auth_suspicious_activity',
      severity: 'error',
      details: { activity, ...details }
    });
  };

  const logRateLimitExceeded = async (endpoint: string, attempts: number) => {
    await logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'warn',
      details: { endpoint, attempts }
    });
  };

  return {
    logSecurityEvent,
    logAuthFailure,
    logPermissionDenied,
    logSuspiciousActivity,
    logRateLimitExceeded
  };
}