import { ReactNode, ComponentType } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/utils/rbac';
import { PermissionDenied, AdminAccessDenied } from '@/components/ui/empty-states';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if user has one of the allowed roles
 */
export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Show specific permission denied screen based on required roles
    const isAdminRequired = allowedRoles.includes('admin') && allowedRoles.length === 1;
    const requiredRole = allowedRoles[0];
    
    return isAdminRequired ? (
      <AdminAccessDenied 
        onContactSupport={() => window.open('https://lovable.dev/support', '_blank')} 
      />
    ) : (
      <PermissionDenied 
        requiredRole={requiredRole}
        currentRole={profile?.role}
        onContactSupport={() => window.open('https://lovable.dev/support', '_blank')}
      />
    );
  }

  return <>{children}</>;
}

/**
 * HOC that wraps a component with role-based access control
 */
export function withRoleGuard<P extends object>(
  Component: ComponentType<P>,
  allowedRoles: Role[],
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * HOC for admin-only components
 */
export function withAdminGuard<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return withRoleGuard(Component, ['admin'], fallback);
}

/**
 * HOC for manager and admin components
 */
export function withManagerGuard<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return withRoleGuard(Component, ['manager', 'admin'], fallback);
}

/**
 * HOC for authenticated user components (any role)
 */
export function withAuthGuard<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return withRoleGuard(Component, ['user', 'manager', 'admin'], fallback);
}