import { useAuth } from './useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission, Role } from '@/utils/rbac';

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(action: Permission): boolean {
  const { profile } = useAuth();
  return hasPermission(profile?.role, action);
}

/**
 * Hook to check if the current user has any of the specified permissions
 */
export function useAnyPermission(actions: Permission[]): boolean {
  const { profile } = useAuth();
  return hasAnyPermission(profile?.role, actions);
}

/**
 * Hook to check if the current user has all of the specified permissions
 */
export function useAllPermissions(actions: Permission[]): boolean {
  const { profile } = useAuth();
  return hasAllPermissions(profile?.role, actions);
}

/**
 * Hook to get the current user's role
 */
export function useRole(): Role | null {
  const { profile } = useAuth();
  return profile?.role || null;
}

/**
 * Hook to check if the current user has a specific role
 */
export function useHasRole(role: Role): boolean {
  const { profile } = useAuth();
  return profile?.role === role;
}

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const { profile } = useAuth();
  return profile?.role === 'admin';
}

/**
 * Hook to check if the current user is a manager or admin
 */
export function useIsManagerOrAdmin(): boolean {
  const { profile } = useAuth();
  return profile?.role === 'manager' || profile?.role === 'admin';
}

/**
 * Hook that returns permission checking functions
 */
export function usePermissions() {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return {
    hasPermission: (action: Permission) => hasPermission(userRole, action),
    hasAnyPermission: (actions: Permission[]) => hasAnyPermission(userRole, actions),
    hasAllPermissions: (actions: Permission[]) => hasAllPermissions(userRole, actions),
    role: userRole,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager',
    isUser: userRole === 'user',
    isManagerOrAdmin: userRole === 'manager' || userRole === 'admin',
  };
}