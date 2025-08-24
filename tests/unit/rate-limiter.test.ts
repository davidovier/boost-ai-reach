import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    delete: vi.fn(() => ({
      lt: vi.fn(() => Promise.resolve({ error: null }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

// Mock the imports
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Import after mocking
const { checkRateLimit, createRateLimitResponse, getClientIP, RATE_LIMITS } = await import('../supabase/functions/_shared/rate-limiter.ts');

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow first request and create new record', async () => {
      // Mock no existing record
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          lt: vi.fn(() => Promise.resolve({ error: null }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116' } // No rows found
              }))
            }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({ error: null }))
      });

      const result = await checkRateLimit(
        mockSupabaseClient,
        'user-123',
        RATE_LIMITS.SCANS_PER_USER
      );

      expect(result.allowed).toBe(true);
      expect(result.requestCount).toBe(1);
      expect(result.maxRequests).toBe(10);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('rate_limits');
    });

    it('should increment counter for subsequent requests', async () => {
      const existingRecord = {
        id: 'record-123',
        request_count: 3,
        window_start: '2024-01-01T11:30:00Z' // 30 minutes ago
      };

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          lt: vi.fn(() => Promise.resolve({ error: null }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: existingRecord, 
                error: null 
              }))
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      const result = await checkRateLimit(
        mockSupabaseClient,
        'user-123',
        RATE_LIMITS.SCANS_PER_USER
      );

      expect(result.allowed).toBe(true);
      expect(result.requestCount).toBe(4);
    });

    it('should deny request when rate limit exceeded', async () => {
      const existingRecord = {
        id: 'record-123',
        request_count: 10, // At the limit
        window_start: '2024-01-01T11:30:00Z' // 30 minutes ago
      };

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          lt: vi.fn(() => Promise.resolve({ error: null }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: existingRecord, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await checkRateLimit(
        mockSupabaseClient,
        'user-123',
        RATE_LIMITS.SCANS_PER_USER
      );

      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.requestCount).toBe(10);
      expect(result.maxRequests).toBe(10);
    });

    it('should reset counter when window expires', async () => {
      const existingRecord = {
        id: 'record-123',
        request_count: 10,
        window_start: '2024-01-01T10:00:00Z' // 2 hours ago (window is 1 hour)
      };

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          lt: vi.fn(() => Promise.resolve({ error: null }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: existingRecord, 
                error: null 
              }))
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      const result = await checkRateLimit(
        mockSupabaseClient,
        'user-123',
        RATE_LIMITS.SCANS_PER_USER
      );

      expect(result.allowed).toBe(true);
      expect(result.requestCount).toBe(1);
    });

    it('should fail open on database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          lt: vi.fn(() => Promise.resolve({ error: null }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { code: 'SOME_ERROR', message: 'Database error' }
              }))
            }))
          }))
        }))
      });

      const result = await checkRateLimit(
        mockSupabaseClient,
        'user-123',
        RATE_LIMITS.SCANS_PER_USER
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      });

      const ip = getClientIP(req);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2' }
      });

      const ip = getClientIP(req);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from cf-connecting-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.3' }
      });

      const ip = getClientIP(req);
      expect(ip).toBe('192.168.1.3');
    });

    it('should fallback to host header', () => {
      const req = new Request('http://localhost', {
        headers: { 'host': 'example.com' }
      });

      const ip = getClientIP(req);
      expect(ip).toBe('example.com');
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create proper 429 response with headers', async () => {
      const result = {
        allowed: false,
        retryAfterSeconds: 300,
        requestCount: 15,
        maxRequests: 10,
        windowStart: new Date('2024-01-01T11:00:00Z')
      };

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      };

      const response = createRateLimitResponse(result, corsHeaders);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('300');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const body = await response.json();
      expect(body.error).toBe('Rate limit exceeded');
      expect(body.retryAfter).toBe(300);
    });
  });

  describe('Rate limit configurations', () => {
    it('should have proper rate limit configs', () => {
      expect(RATE_LIMITS.SCANS_PER_USER).toEqual({
        maxRequests: 10,
        windowMinutes: 60,
        endpoint: 'scans'
      });

      expect(RATE_LIMITS.PROMPTS_PER_USER).toEqual({
        maxRequests: 20,
        windowMinutes: 60,
        endpoint: 'prompts'
      });

      expect(RATE_LIMITS.ADMIN_PER_IP).toEqual({
        maxRequests: 100,
        windowMinutes: 60,
        endpoint: 'admin'
      });

      expect(RATE_LIMITS.ADMIN_HEAVY_PER_IP).toEqual({
        maxRequests: 10,
        windowMinutes: 60,
        endpoint: 'admin-heavy'
      });
    });
  });
});