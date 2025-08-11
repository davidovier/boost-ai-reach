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

export function hasAnyPermission(role: Role | null | undefined, actions: Permission[]): boolean {
  if (!role) return false;
  return actions.some(action => hasPermission(role, action));
}

export function hasAllPermissions(role: Role | null | undefined, actions: Permission[]): boolean {
  if (!role) return false;
  return actions.every(action => hasPermission(role, action));
}

// Role hierarchy helpers
export function isAdmin(role: Role | null | undefined): boolean {
  return role === 'admin';
}

export function isManagerOrAdmin(role: Role | null | undefined): boolean {
  return role === 'manager' || role === 'admin';
}

export function isUser(role: Role | null | undefined): boolean {
  return role === 'user';
}

// Get all permissions for a role
export function getRolePermissions(role: Role | null | undefined): Permission[] {
  if (!role) return [];
  return (Object.keys(permissions) as Permission[]).filter(permission => 
    hasPermission(role, permission)
  );
}