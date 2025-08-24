import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface EventMetadata {
  [key: string]: any;
}

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

/**
 * Log user events to the user_events table
 * @param supabase - Supabase client instance
 * @param userId - ID of the user performing the action
 * @param eventName - Name of the event being logged
 * @param metadata - Additional event data (optional)
 * @returns Promise with success/error result
 */
export async function logEvent(
  supabase: any,
  userId: string,
  eventName: EventName,
  metadata: EventMetadata = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || !eventName) {
      console.warn('logEvent: userId and eventName are required');
      return { success: false, error: 'Missing required parameters' };
    }

    const eventData = {
      user_id: userId,
      event_name: eventName,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: metadata.user_agent || null,
        ip_address: metadata.ip_address || null
      },
      occurred_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_events')
      .insert(eventData);

    if (error) {
      console.error(`Failed to log event ${eventName} for user ${userId}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Event logged: ${eventName} for user ${userId}`);
    return { success: true };

  } catch (error) {
    console.error(`Error logging event ${eventName}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Log multiple events in batch (useful for related actions)
 * @param supabase - Supabase client instance
 * @param events - Array of event objects
 * @returns Promise with success/error result
 */
export async function logEvents(
  supabase: any,
  events: Array<{
    userId: string;
    eventName: EventName;
    metadata?: EventMetadata;
  }>
): Promise<{ success: boolean; error?: string; successCount: number }> {
  try {
    const eventData = events.map(event => ({
      user_id: event.userId,
      event_name: event.eventName,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString()
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
}

/**
 * Extract metadata from HTTP request for event logging
 * @param req - HTTP Request object
 * @returns Metadata object with request info
 */
export function extractRequestMetadata(req: Request): EventMetadata {
  const url = new URL(req.url);
  
  return {
    method: req.method,
    path: url.pathname,
    search: url.search,
    user_agent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    origin: req.headers.get('origin'),
    timestamp: new Date().toISOString()
  };
}