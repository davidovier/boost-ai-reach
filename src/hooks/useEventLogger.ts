import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type EventName = 
  | 'user_signup'
  | 'site_created'
  | 'scan_completed'
  | 'prompt_run'
  | 'report_generated'
  | 'plan_upgraded'
  | 'competitor_added'
  | 'user_login'
  | 'report_downloaded'
  | 'usage_limit_reached'
  | 'feature_accessed';

export interface EventMetadata {
  [key: string]: any;
}

/**
 * Hook for logging user events from the frontend
 */
export function useEventLogger() {
  const { user } = useAuth();

  const logEvent = async (
    eventName: EventName,
    metadata: EventMetadata = {}
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user?.id) {
        console.warn('Cannot log event: user not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      if (!eventName) {
        console.warn('Cannot log event: eventName is required');
        return { success: false, error: 'Event name is required' };
      }

      const eventData = {
        user_id: user.id,
        event_name: eventName,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator?.userAgent || null,
          page_url: window?.location?.href || null,
          referrer: document?.referrer || null
        },
        occurred_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_events')
        .insert(eventData);

      if (error) {
        console.error(`Failed to log event ${eventName}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`Event logged: ${eventName}`);
      return { success: true };

    } catch (error) {
      console.error(`Error logging event ${eventName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const logMultipleEvents = async (
    events: Array<{
      eventName: EventName;
      metadata?: EventMetadata;
    }>
  ): Promise<{ success: boolean; error?: string; successCount: number }> => {
    try {
      if (!user?.id) {
        return { success: false, error: 'User not authenticated', successCount: 0 };
      }

      const eventData = events.map(event => ({
        user_id: user.id,
        event_name: event.eventName,
        metadata: {
          ...event.metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator?.userAgent || null,
          page_url: window?.location?.href || null
        },
        occurred_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('user_events')
        .insert(eventData);

      if (error) {
        console.error('Failed to log batch events:', error);
        return { success: false, error: error.message, successCount: 0 };
      }

      console.log(`Batch logged ${events.length} events`);
      return { success: true, successCount: events.length };

    } catch (error) {
      console.error('Error logging batch events:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        successCount: 0
      };
    }
  };

  return {
    logEvent,
    logMultipleEvents,
    isAuthenticated: !!user?.id
  };
}