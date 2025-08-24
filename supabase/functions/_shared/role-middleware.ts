import { requireAuth, AuthenticatedUser } from "./auth-middleware.ts";

// RBAC types and utilities (copied from src/utils/rbac.ts for edge function use)
export type Role = 'user' | 'manager' | 'admin';

export const permissions = {
  // Data access permissions
  viewOwnData: ['user', 'manager', 'admin'],
  viewTeamData: ['manager', 'admin'],
  viewAllData: ['admin'],
  
  // User management permissions
  manageUsers: ['admin'],
  changeRoles: ['admin'],
  viewTeamUsage: ['manager', 'admin'],
  
  // Dashboard and configuration permissions
  configureDashboard: ['admin'],
  overrideQuotas: ['admin'],
  viewAuditLogs: ['admin'],
  
  // Billing and subscription permissions
  billingActions: ['admin'],
  manageSubscriptions: ['admin'],
  
  // Site management permissions
  manageSites: ['user', 'manager', 'admin'],
  viewAllSites: ['admin'],
  
  // Scan permissions
  runScans: ['user', 'manager', 'admin'],
  viewAllScans: ['admin'],
  
  // AI prompt permissions
  runPrompts: ['user', 'manager', 'admin'],
  viewAllPrompts: ['admin'],
  
  // Competitor tracking permissions
  manageCompetitors: ['user', 'manager', 'admin'],
  viewAllCompetitors: ['admin'],
  
  // Report permissions
  generateReports: ['user', 'manager', 'admin'],
  viewAllReports: ['admin'],
  
  // Admin panel permissions
  accessAdminPanel: ['admin'],
  manageFeatureFlags: ['admin'],
  configurePlans: ['admin'],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(role: Role | null | undefined, action: Permission): boolean {
  if (!role) return false;
  return (permissions[action] as readonly string[]).includes(role);
}

export async function requireRole(req: Request, allowedRoles: Role[]): Promise<{
  success: true;
  user: AuthenticatedUser;
} | {
  success: false;
  response: Response;
}> {
  // First check authentication
  const authResult = await requireAuth(req);
  
  if (!authResult.success) {
    return authResult;
  }

  // Check if user has one of the allowed roles
  const userRole = authResult.user.role as Role;
  const hasRequiredRole = allowedRoles.includes(userRole);
  
  if (!hasRequiredRole) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({ 
          error: "Insufficient permissions",
          required_roles: allowedRoles,
          user_role: userRole
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  return {
    success: true,
    user: authResult.user
  };
}

export async function requirePermission(req: Request, permission: Permission): Promise<{
  success: true;
  user: AuthenticatedUser;
} | {
  success: false;
  response: Response;
}> {
  // First check authentication
  const authResult = await requireAuth(req);
  
  if (!authResult.success) {
    return authResult;
  }

  // Check if user has the required permission
  const userRole = authResult.user.role as Role;
  const hasRequiredPermission = hasPermission(userRole, permission);
  
  if (!hasRequiredPermission) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({ 
          error: "Insufficient permissions",
          required_permission: permission,
          user_role: userRole
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  return {
    success: true,
    user: authResult.user
  };
}

// Convenience function for admin-only routes
export async function requireAdmin(req: Request) {
  return requireRole(req, ['admin']);
}