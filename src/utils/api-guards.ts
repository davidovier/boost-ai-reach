import { supabase } from '@/integrations/supabase/client';
import { hasPermission, Permission, Role } from './rbac';

/**
 * Utility functions for API route protection
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Get the authenticated user and their profile from the request
 * This would typically be used in API routes or server-side functions
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return null;
    }

    // Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Check if the current user has permission for a specific action
 * Returns { authorized: boolean, user: AuthenticatedUser | null }
 */
export async function checkPermission(permission: Permission): Promise<{
  authorized: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return {
      authorized: false,
      user: null,
      error: 'Authentication required',
    };
  }

  const authorized = hasPermission(user.role, permission);
  
  if (!authorized) {
    return {
      authorized: false,
      user,
      error: 'Insufficient permissions',
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Middleware-style function to protect API routes
 * Usage: const authResult = await requirePermission('manageUsers');
 */
export async function requirePermission(permission: Permission): Promise<{
  success: true;
  user: AuthenticatedUser;
} | {
  success: false;
  error: string;
  statusCode: number;
}> {
  const result = await checkPermission(permission);
  
  if (!result.authorized) {
    return {
      success: false,
      error: result.error || 'Access denied',
      statusCode: result.user ? 403 : 401,
    };
  }

  return {
    success: true,
    user: result.user!,
  };
}

/**
 * Check if user owns a resource (for user-specific data access)
 */
export async function checkResourceOwnership(resourceUserId: string): Promise<{
  authorized: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return {
      authorized: false,
      user: null,
      error: 'Authentication required',
    };
  }

  // Admin can access any resource
  if (user.role === 'admin') {
    return {
      authorized: true,
      user,
    };
  }

  // User can only access their own resources
  const authorized = user.id === resourceUserId;
  
  return {
    authorized,
    user,
    error: authorized ? undefined : 'Resource access denied',
  };
}

/**
 * Require user to own a resource or have admin permissions
 */
export async function requireResourceOwnership(resourceUserId: string): Promise<{
  success: true;
  user: AuthenticatedUser;
} | {
  success: false;
  error: string;
  statusCode: number;
}> {
  const result = await checkResourceOwnership(resourceUserId);
  
  if (!result.authorized) {
    return {
      success: false,
      error: result.error || 'Access denied',
      statusCode: result.user ? 403 : 401,
    };
  }

  return {
    success: true,
    user: result.user!,
  };
}