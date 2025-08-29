import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, User, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermission } from '@/hooks/usePermission';

interface SecurityEvent {
  id: string;
  user_id: string;
  email?: string;
  role?: string;
  event_name: string;
  metadata: any; // Using any to handle Supabase Json type
  occurred_at: string;
}

export default function SecurityTab() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canViewSecurity = usePermission('viewAuditLogs');

  useEffect(() => {
    if (canViewSecurity) {
      loadSecurityEvents();
    }
  }, [canViewSecurity]);

  const loadSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (error) {
        setError('Failed to load security events');
        console.error('Error loading security events:', error);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error in loadSecurityEvents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'auth_failed_login':
      case 'auth_suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'permission_denied':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'rate_limit_exceeded':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'user_login':
      case 'user_logout':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!canViewSecurity) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view security events.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security Events</h3>
          <p className="text-sm text-muted-foreground">
            Monitor authentication and security-related activities
          </p>
        </div>
        <Button onClick={loadSecurityEvents} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No security events found
              </div>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getEventIcon(event.event_name)}
                    <CardTitle className="text-sm">
                      {event.event_name.replace(/_/g, ' ').toUpperCase()}
                    </CardTitle>
                    <Badge variant={getSeverityColor(event.metadata?.severity || 'info')}>
                      {event.metadata?.severity || 'info'}
                    </Badge>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(event.occurred_at).toLocaleString()}
                  </time>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {event.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span>{event.email}</span>
                      {event.role && (
                        <Badge variant="outline" className="text-xs">
                          {event.role}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {event.metadata?.ip_address && (
                    <div className="text-xs text-muted-foreground">
                      IP: {event.metadata.ip_address}
                    </div>
                  )}
                  
                  {event.metadata?.details && Object.keys(event.metadata.details).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <details className="cursor-pointer">
                        <summary className="hover:text-foreground">Details</summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.metadata.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}