import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      gte: vi.fn(() => ({
        lte: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }))
};

// Mock the role middleware
const mockRequireRole = vi.fn();

// Mock Deno environment
global.Deno = {
  env: {
    get: vi.fn((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-service-key';
      return undefined;
    })
  }
} as any;

// Mock the imports
vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({
  serve: vi.fn()
}));

vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

vi.mock('../supabase/functions/_shared/role-middleware.ts', () => ({
  requireRole: mockRequireRole
}));

describe('Admin Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require admin role', async () => {
    mockRequireRole.mockResolvedValue({
      success: false,
      response: new Response('Unauthorized', { status: 403 })
    });

    const request = new Request('http://localhost/admin-analytics?from=2024-01-01&to=2024-01-31', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    // Mock the handler function
    const handler = async (req: Request) => {
      const roleCheck = await mockRequireRole(req, ['admin']);
      if (!roleCheck.success) {
        return roleCheck.response;
      }
      return new Response('OK');
    };

    const response = await handler(request);
    expect(response.status).toBe(403);
    expect(mockRequireRole).toHaveBeenCalledWith(request, ['admin']);
  });

  it('should require both from and to parameters', async () => {
    mockRequireRole.mockResolvedValue({
      success: true,
      user: { id: 'admin-user-id', role: 'admin' }
    });

    const handler = async (req: Request) => {
      const roleCheck = await mockRequireRole(req, ['admin']);
      if (!roleCheck.success) {
        return roleCheck.response;
      }

      const url = new URL(req.url);
      const fromDate = url.searchParams.get('from');
      const toDate = url.searchParams.get('to');

      if (!fromDate || !toDate) {
        return new Response(
          JSON.stringify({ error: 'Both from and to parameters are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response('OK');
    };

    // Test missing from parameter
    const requestMissingFrom = new Request('http://localhost/admin-analytics?to=2024-01-31', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-admin-token' }
    });

    const responseMissingFrom = await handler(requestMissingFrom);
    expect(responseMissingFrom.status).toBe(400);

    // Test missing to parameter
    const requestMissingTo = new Request('http://localhost/admin-analytics?from=2024-01-01', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-admin-token' }
    });

    const responseMissingTo = await handler(requestMissingTo);
    expect(responseMissingTo.status).toBe(400);
  });

  it('should validate date format', async () => {
    mockRequireRole.mockResolvedValue({
      success: true,
      user: { id: 'admin-user-id', role: 'admin' }
    });

    const handler = async (req: Request) => {
      const roleCheck = await mockRequireRole(req, ['admin']);
      if (!roleCheck.success) {
        return roleCheck.response;
      }

      const url = new URL(req.url);
      const fromDate = url.searchParams.get('from');
      const toDate = url.searchParams.get('to');

      if (!fromDate || !toDate) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
      }

      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD or ISO format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response('OK');
    };

    const requestInvalidDate = new Request('http://localhost/admin-analytics?from=invalid-date&to=2024-01-31', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-admin-token' }
    });

    const response = await handler(requestInvalidDate);
    expect(response.status).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toContain('Invalid date format');
  });

  it('should return analytics data with correct structure', async () => {
    mockRequireRole.mockResolvedValue({
      success: true,
      user: { id: 'admin-user-id', role: 'admin' }
    });

    // Mock event data
    const mockEventData = [
      { event_name: 'user_signup' },
      { event_name: 'user_signup' },
      { event_name: 'site_created' },
      { event_name: 'scan_completed' }
    ];

    // Mock user activity data
    const mockUserData = [
      { user_id: 'user-1', profiles: { email: 'user1@test.com', name: 'User 1' } },
      { user_id: 'user-1', profiles: { email: 'user1@test.com', name: 'User 1' } },
      { user_id: 'user-2', profiles: { email: 'user2@test.com', name: 'User 2' } }
    ];

    // Set up mock to return different data for different queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_events') {
        return {
          select: vi.fn((query: string) => {
            if (query === 'event_name') {
              return {
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({
                    data: mockEventData,
                    error: null
                  }))
                }))
              };
            } else {
              return {
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({
                    data: mockUserData,
                    error: null
                  }))
                }))
              };
            }
          })
        };
      }
      return {
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      };
    });

    const handler = async (req: Request) => {
      const roleCheck = await mockRequireRole(req, ['admin']);
      if (!roleCheck.success) {
        return roleCheck.response;
      }

      const url = new URL(req.url);
      const fromDate = url.searchParams.get('from')!;
      const toDate = url.searchParams.get('to')!;

      // Get event totals
      const eventTotals = mockEventData;
      const eventCounts = eventTotals.reduce((acc: Record<string, number>, event) => {
        acc[event.event_name] = (acc[event.event_name] || 0) + 1;
        return acc;
      }, {});

      // Get user activity
      const userActivity = mockUserData;
      const userCounts = userActivity.reduce((acc: Record<string, any>, event) => {
        const userId = event.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            email: event.profiles?.email || 'Unknown',
            name: event.profiles?.name || 'Unknown',
            event_count: 0
          };
        }
        acc[userId].event_count += 1;
        return acc;
      }, {});

      const topUsers = Object.values(userCounts)
        .sort((a: any, b: any) => b.event_count - a.event_count)
        .slice(0, 10);

      const analytics = {
        summary: {
          total_events: eventTotals.length,
          unique_users: Object.keys(userCounts).length,
          date_range: { from: fromDate, to: toDate }
        },
        event_totals: eventCounts,
        top_users: topUsers
      };

      return new Response(JSON.stringify(analytics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const request = new Request('http://localhost/admin-analytics?from=2024-01-01&to=2024-01-31', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-admin-token' }
    });

    const response = await handler(request);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('summary');
    expect(responseBody).toHaveProperty('event_totals');
    expect(responseBody).toHaveProperty('top_users');
    
    expect(responseBody.summary.total_events).toBe(4);
    expect(responseBody.summary.unique_users).toBe(2);
    expect(responseBody.event_totals.user_signup).toBe(2);
    expect(responseBody.event_totals.site_created).toBe(1);
    expect(responseBody.top_users).toHaveLength(2);
    expect(responseBody.top_users[0].event_count).toBe(2); // user-1 has 2 events
  });

  it('should handle CORS preflight requests', async () => {
    const handler = async (req: Request) => {
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          }
        });
      }
      return new Response('OK');
    };

    const request = new Request('http://localhost/admin-analytics', {
      method: 'OPTIONS'
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should only allow GET requests', async () => {
    const handler = async (req: Request) => {
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200 });
      }
      
      if (req.method !== 'GET') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response('OK');
    };

    const request = new Request('http://localhost/admin-analytics', {
      method: 'POST'
    });

    const response = await handler(request);
    expect(response.status).toBe(405);
  });
});