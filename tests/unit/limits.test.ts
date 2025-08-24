import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
};

// Mock createClient
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Import after mocking
const { enforceLimit } = await import('../../supabase/functions/_shared/limits.ts');

describe('Limits Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  });

  describe('enforceLimit', () => {
    it('should allow action when limit not exceeded', async () => {
      // Mock RPC to return true (allowed)
      mockSupabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const result = await enforceLimit('user-123', 'scan');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_usage_limit', {
        user_id: 'user-123',
        limit_type: 'scans'
      });
    });

    it('should block action when scan limit exceeded for free user', async () => {
      // Mock RPC to return false (not allowed)
      mockSupabaseClient.rpc.mockResolvedValue({
        data: false,
        error: null
      });

      // Mock profile query to return free plan
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { plan: 'free' },
                  error: null
                })
              }))
            }))
          };
        }
        return mockSupabaseClient.from();
      });

      const result = await enforceLimit('user-123', 'scan');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(402);
        const body = await result.response.json();
        expect(body.error).toBe('limit_reached');
        expect(body.hint).toBe('upgrade');
        expect(body.details.current_plan).toBe('free');
        expect(body.details.message).toContain('website scans limit');
      }
    });

    it('should block action when prompt limit exceeded', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: false,
        error: null
      });

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { plan: 'pro' },
                  error: null
                })
              }))
            }))
          };
        }
        return mockSupabaseClient.from();
      });

      const result = await enforceLimit('user-123', 'prompt');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(402);
        const body = await result.response.json();
        expect(body.error).toBe('limit_reached');
        expect(body.details.action).toBe('prompt');
        expect(body.details.limit_type).toBe('prompts');
        expect(body.details.current_plan).toBe('pro');
      }
    });

    it('should block competitor_add when limit exceeded', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: false,
        error: null
      });

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { plan: 'growth' },
                  error: null
                })
              }))
            }))
          };
        }
        return mockSupabaseClient.from();
      });

      const result = await enforceLimit('user-123', 'competitor_add');

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.details.limit_type).toBe('competitors');
        expect(body.details.upgrade_suggestion).toContain('Enterprise');
      }
    });

    it('should handle RPC errors gracefully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await enforceLimit('user-123', 'scan');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(500);
        const body = await result.response.json();
        expect(body.error).toBe('Limit check failed');
      }
    });

    it('should provide correct upgrade hints by plan', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: false,
        error: null
      });

      // Test free plan upgrade hint
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { plan: 'free' },
                  error: null
                })
              }))
            }))
          };
        }
        return mockSupabaseClient.from();
      });

      const result = await enforceLimit('user-123', 'report_generate');

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.details.upgrade_suggestion).toContain('Pro ($29/month)');
      }
    });

    it('should map actions to correct limit types', async () => {
      const testCases = [
        { action: 'scan' as const, expectedLimitType: 'scans' },
        { action: 'prompt' as const, expectedLimitType: 'prompts' },
        { action: 'competitor_add' as const, expectedLimitType: 'competitors' },
        { action: 'report_generate' as const, expectedLimitType: 'reports' }
      ];

      for (const testCase of testCases) {
        mockSupabaseClient.rpc.mockResolvedValue({
          data: true,
          error: null
        });

        await enforceLimit('user-123', testCase.action);

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_usage_limit', {
          user_id: 'user-123',
          limit_type: testCase.expectedLimitType
        });

        vi.clearAllMocks();
      }
    });
  });
});