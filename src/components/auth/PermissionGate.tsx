import { ReactNode } from 'react';
import { usePermission, useAnyPermission, useAllPermissions } from '@/hooks/usePermission';
import { Permission } from '@/utils/rbac';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SinglePermissionGateProps extends PermissionGateProps {
  permission: Permission;
}

interface MultiplePermissionGateProps extends PermissionGateProps {
  permissions: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
}

/**
 * Component that renders children only if user has the required permission
 */
export function PermissionGate({ permission, children, fallback }: SinglePermissionGateProps) {
  const hasAccess = usePermission(permission);
  const { logPermissionDenied } = useSecurityMonitoring();

  if (!hasAccess) {
    // Log permission denial for security monitoring
    logPermissionDenied(permission);
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Component that renders children only if user has the required permissions
 */
export function MultiplePermissionGate({ 
  permissions, 
  requireAll = false, 
  children, 
  fallback 
}: MultiplePermissionGateProps) {
  const { logPermissionDenied } = useSecurityMonitoring();
  const hasAllPermissions = useAllPermissions(permissions);
  const hasAnyPermission = useAnyPermission(permissions);
  const hasAccess = requireAll ? hasAllPermissions : hasAnyPermission;

  if (!hasAccess) {
    // Log permission denial for security monitoring
    logPermissionDenied(permissions.join(', '));
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Convenience components for common permission patterns
export function AdminOnlyGate({ children, fallback }: PermissionGateProps) {
  return (
    <PermissionGate permission="accessAdminPanel" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function ManagerGate({ children, fallback }: PermissionGateProps) {
  return (
    <PermissionGate permission="viewTeamUsage" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function BillingGate({ children, fallback }: PermissionGateProps) {
  return (
    <PermissionGate permission="billingActions" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function UserManagementGate({ children, fallback }: PermissionGateProps) {
  return (
    <PermissionGate permission="manageUsers" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}