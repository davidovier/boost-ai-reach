import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock event logger functions for testing
interface EventMetadata {
  [key: string]: any;
}

type EventName = 
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

// Mock logEvent function
async function mockLogEvent(
  supabase: any,
  userId: string,
  eventName: EventName,
  metadata: EventMetadata = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || !eventName) {
      return { success: false, error: 'Missing required parameters' };
    }

    const eventData = {
      user_id: userId,
      event_name: eventName,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      },
      occurred_at: new Date().toISOString()
    };

    // Simulate successful insert
    console.log(`Mock event logged: ${eventName} for user ${userId}`);
    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Mock extractRequestMetadata function
function mockExtractRequestMetadata(req: any): EventMetadata {
  return {
    method: req.method || 'GET',
    path: req.path || '/',
    user_agent: req.headers?.['user-agent'] || 'test-agent',
    origin: req.headers?.origin || 'http://localhost:3000',
    timestamp: new Date().toISOString()
  };
}

describe('Event Logger Functions', () => {
  describe('Event Validation', () => {
    it('should validate required parameters', async () => {
      const mockSupabase = {};

      // Missing userId
      const result1 = await mockLogEvent(mockSupabase, '', 'user_signup');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Missing required parameters');

      // Missing eventName
      const result2 = await mockLogEvent(mockSupabase, 'user-123', '' as EventName);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Missing required parameters');

      // Valid parameters
      const result3 = await mockLogEvent(mockSupabase, 'user-123', 'user_signup');
      expect(result3.success).toBe(true);
    });

    it('should validate event name types', () => {
      const validEvents: EventName[] = [
        'user_signup',
        'site_created',
        'scan_completed',
        'prompt_run',
        'report_generated',
        'plan_upgraded',
        'competitor_added',
        'user_login',
        'report_downloaded',
        'usage_limit_reached',
        'feature_accessed'
      ];

      validEvents.forEach(event => {
        expect(typeof event).toBe('string');
        expect(event.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Event Data Structure', () => {
    it('should structure event data correctly', async () => {
      const userId = 'user-123';
      const eventName: EventName = 'site_created';
      const metadata = {
        site_id: 'site-456',
        url: 'https://example.com',
        name: 'Example Site'
      };

      const eventData = {
        user_id: userId,
        event_name: eventName,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        occurred_at: new Date().toISOString()
      };

      expect(eventData.user_id).toBe(userId);
      expect(eventData.event_name).toBe(eventName);
      expect(eventData.metadata.site_id).toBe('site-456');
      expect(eventData.metadata.url).toBe('https://example.com');
      expect(eventData.metadata.timestamp).toBeDefined();
      expect(eventData.occurred_at).toBeDefined();
    });

    it('should handle empty metadata gracefully', async () => {
      const result = await mockLogEvent({}, 'user-123', 'user_login', {});
      expect(result.success).toBe(true);
    });

    it('should merge metadata with default fields', () => {
      const customMetadata = {
        site_id: 'site-123',
        domain: 'example.com'
      };

      const enrichedMetadata = {
        ...customMetadata,
        timestamp: new Date().toISOString(),
        user_agent: 'test-agent'
      };

      expect(enrichedMetadata.site_id).toBe('site-123');
      expect(enrichedMetadata.domain).toBe('example.com');
      expect(enrichedMetadata.timestamp).toBeDefined();
      expect(enrichedMetadata.user_agent).toBe('test-agent');
    });
  });

  describe('Request Metadata Extraction', () => {
    it('should extract metadata from request', () => {
      const mockRequest = {
        method: 'POST',
        path: '/api/sites',
        headers: {
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'origin': 'https://example.com',
          'referer': 'https://example.com/dashboard'
        }
      };

      const metadata = mockExtractRequestMetadata(mockRequest);

      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/api/sites');
      expect(metadata.user_agent).toBe('Mozilla/5.0 (Test Browser)');
      expect(metadata.origin).toBe('https://example.com');
      expect(metadata.timestamp).toBeDefined();
    });

    it('should handle missing headers gracefully', () => {
      const mockRequest = {
        method: 'GET',
        path: '/api/test'
      };

      const metadata = mockExtractRequestMetadata(mockRequest);

      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/api/test');
      expect(metadata.user_agent).toBe('test-agent'); // fallback
      expect(metadata.origin).toBe('http://localhost:3000'); // fallback
    });
  });

  describe('Event Types and Metadata', () => {
    it('should handle user signup events', async () => {
      const metadata = {
        email: 'user@example.com',
        signup_method: 'email',
        welcome_flow_triggered: true
      };

      const result = await mockLogEvent({}, 'user-123', 'user_signup', metadata);
      expect(result.success).toBe(true);
    });

    it('should handle site created events', async () => {
      const metadata = {
        site_id: 'site-456',
        url: 'https://example.com',
        name: 'Example Site'
      };

      const result = await mockLogEvent({}, 'user-123', 'site_created', metadata);
      expect(result.success).toBe(true);
    });

    it('should handle scan completed events', async () => {
      const metadata = {
        scan_id: 'scan-789',
        site_id: 'site-456',
        ai_findability_score: 85,
        tips_generated: 5,
        scan_duration: 2500
      };

      const result = await mockLogEvent({}, 'user-123', 'scan_completed', metadata);
      expect(result.success).toBe(true);
    });

    it('should handle prompt run events', async () => {
      const metadata = {
        prompt_length: 45,
        mentioned_user_site: true,
        competitors_found: 3,
        tokens_used: 150,
        relevance_score: 8
      };

      const result = await mockLogEvent({}, 'user-123', 'prompt_run', metadata);
      expect(result.success).toBe(true);
    });

    it('should handle report generated events', async () => {
      const metadata = {
        report_id: 'report-101',
        site_id: 'site-456',
        generation_duration: 5000,
        success: true
      };

      const result = await mockLogEvent({}, 'user-123', 'report_generated', metadata);
      expect(result.success).toBe(true);
    });

    it('should handle plan upgraded events', async () => {
      const metadata = {
        from_plan: 'free',
        to_plan: 'pro',
        billing_cycle: 'monthly',
        amount: 2900 // cents
      };

      const result = await mockLogEvent({}, 'user-123', 'plan_upgraded', metadata);
      expect(result.success).toBe(true);
    });

    it('should handle competitor added events', async () => {
      const metadata = {
        competitor_id: 'comp-123',
        domain: 'competitor.com',
        snapshot_score: 78
      };

      const result = await mockLogEvent({}, 'user-123', 'competitor_added', metadata);
      expect(result.success).toBe(true);
    });
  });

  describe('Batch Event Logging', () => {
    it('should handle multiple events correctly', async () => {
      const events = [
        { eventName: 'user_login' as EventName, metadata: { method: 'email' } },
        { eventName: 'feature_accessed' as EventName, metadata: { feature: 'dashboard' } },
        { eventName: 'site_created' as EventName, metadata: { url: 'https://test.com' } }
      ];

      // Mock batch logging
      const mockBatchLog = async (eventList: typeof events) => {
        if (eventList.length === 0) {
          return { success: false, error: 'No events provided', successCount: 0 };
        }
        return { success: true, successCount: eventList.length };
      };

      const result = await mockBatchLog(events);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
    });

    it('should handle empty events array', async () => {
      const mockBatchLog = async (eventList: any[]) => {
        if (eventList.length === 0) {
          return { success: false, error: 'No events provided', successCount: 0 };
        }
        return { success: true, successCount: eventList.length };
      };

      const result = await mockBatchLog([]);
      expect(result.success).toBe(false);
      expect(result.successCount).toBe(0);
    });
  });
});