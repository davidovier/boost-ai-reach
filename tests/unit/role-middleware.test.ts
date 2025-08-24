import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create test mocks
const mockRequireAuth = vi.fn();

// Mock the auth middleware module
vi.doMock('../../supabase/functions/_shared/auth-middleware.ts', () => ({
  requireAuth: mockRequireAuth
}));

// Import the module after mocking
const { requireRole, requireAdmin, requirePermission } = await import('../../supabase/functions/_shared/role-middleware.ts');

describe('Role Middleware', () => {
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = new Request('http://localhost/test', {
      headers: { 'Authorization': 'Bearer test-token' }
    });
  });

  describe('requireRole', () => {
    it('should allow user with correct role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        plan: 'enterprise'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireRole(mockRequest, ['admin']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }
    });

    it('should deny user without required role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        plan: 'free'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireRole(mockRequest, ['admin']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(403);
        const body = await result.response.json();
        expect(body.error).toBe('Insufficient permissions');
        expect(body.required_roles).toEqual(['admin']);
        expect(body.user_role).toBe('user');
      }
    });

    it('should deny manager for admin-only route', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'manager@test.com',
        role: 'manager',
        plan: 'pro'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireRole(mockRequest, ['admin']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(403);
      }
    });

    it('should allow multiple roles', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'manager@test.com',
        role: 'manager',
        plan: 'pro'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireRole(mockRequest, ['manager', 'admin']);

      expect(result.success).toBe(true);
    });

    it('should return auth error if authentication fails', async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401 }
      );

      mockRequireAuth.mockResolvedValue({
        success: false,
        response: mockResponse
      });

      const result = await requireRole(mockRequest, ['admin']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response).toBe(mockResponse);
      }
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        plan: 'enterprise'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireAdmin(mockRequest);

      expect(result.success).toBe(true);
    });

    it('should deny non-admin user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        plan: 'free'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireAdmin(mockRequest);

      expect(result.success).toBe(false);
    });

    it('should deny manager user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'manager@test.com',
        role: 'manager',
        plan: 'pro'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requireAdmin(mockRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should allow admin with manageUsers permission', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        plan: 'enterprise'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requirePermission(mockRequest, 'manageUsers');

      expect(result.success).toBe(true);
    });

    it('should deny user without required permission', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        plan: 'free'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requirePermission(mockRequest, 'manageUsers');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(403);
        const body = await result.response.json();
        expect(body.error).toBe('Insufficient permissions');
        expect(body.required_permission).toBe('manageUsers');
        expect(body.user_role).toBe('user');
      }
    });

    it('should deny manager without admin-only permission', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'manager@test.com',
        role: 'manager',
        plan: 'pro'
      };

      mockRequireAuth.mockResolvedValue({
        success: true,
        user: mockUser
      });

      const result = await requirePermission(mockRequest, 'manageUsers');

      expect(result.success).toBe(false);
    });
  });
});