import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission, useAnyPermission, useAllPermissions, useRole, useIsAdmin, useIsManagerOrAdmin } from '@/hooks/usePermission';

// NOTE: usePermission.ts imports './useAuth', which resolves to '@/hooks/useAuth'.
// We mock it here to control the role returned by the hook.
vi.mock('@/hooks/useAuth', () => {
  let role: 'user' | 'manager' | 'admin' = 'user';
  return {
    setMockRole: (r: 'user' | 'manager' | 'admin') => { role = r; },
    useAuth: () => ({ profile: { role }, loading: false }),
  };
});

// Access the helper we exposed in the mock to switch roles per test
const { setMockRole } = await import('@/hooks/useAuth');

describe('Permission hooks', () => {
  beforeEach(() => setMockRole('user'));

  it('usePermission respects role permissions', () => {
    setMockRole('user');
    const { result: r1 } = renderHook(() => usePermission('viewOwnData'));
    const { result: r2 } = renderHook(() => usePermission('manageUsers'));
    expect(r1.current).toBe(true);
    expect(r2.current).toBe(false);
  });

  it('useAnyPermission and useAllPermissions behave correctly', () => {
    setMockRole('manager');
    const any = renderHook(() => useAnyPermission(['viewTeamUsage', 'manageUsers']));
    const all = renderHook(() => useAllPermissions(['viewTeamUsage', 'manageUsers']));
    expect(any.result.current).toBe(true);
    expect(all.result.current).toBe(false);
  });

  it('role helpers reflect current mock role', () => {
    setMockRole('admin');
    const role = renderHook(() => useRole());
    const isAdmin = renderHook(() => useIsAdmin());
    const isMgrOrAdmin = renderHook(() => useIsManagerOrAdmin());
    expect(role.result.current).toBe('admin');
    expect(isAdmin.result.current).toBe(true);
    expect(isMgrOrAdmin.result.current).toBe(true);
  });
});
