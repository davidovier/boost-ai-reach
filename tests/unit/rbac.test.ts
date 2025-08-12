import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isManagerOrAdmin,
  getRolePermissions,
  type Permission,
} from '@/utils/rbac';

const allPermissions = [
  'viewOwnData', 'viewTeamData', 'viewAllData',
  'manageUsers', 'changeRoles', 'viewTeamUsage',
  'configureDashboard', 'overrideQuotas', 'viewAuditLogs',
  'billingActions', 'manageSubscriptions',
  'manageSites', 'viewAllSites',
  'runScans', 'viewAllScans',
  'runPrompts', 'viewAllPrompts',
  'manageCompetitors', 'viewAllCompetitors',
  'generateReports', 'viewAllReports',
  'accessAdminPanel', 'manageFeatureFlags', 'configurePlans',
] as const satisfies Permission[];

describe('RBAC utilities', () => {
  it('grants admin all relevant permissions', () => {
    for (const p of allPermissions) {
      expect(hasPermission('admin', p)).toBe(true);
    }
    expect(isAdmin('admin')).toBe(true);
    expect(isManagerOrAdmin('admin')).toBe(true);
  });

  it('restricts user for admin-only actions', () => {
    expect(hasPermission('user', 'manageUsers')).toBe(false);
    expect(hasPermission('user', 'accessAdminPanel')).toBe(false);
    expect(isAdmin('user')).toBe(false);
    expect(isManagerOrAdmin('user')).toBe(false);
  });

  it('manager has team visibility but not admin powers', () => {
    expect(hasPermission('manager', 'viewTeamUsage')).toBe(true);
    expect(hasPermission('manager', 'manageUsers')).toBe(false);
    expect(isManagerOrAdmin('manager')).toBe(true);
  });

  it('hasAnyPermission and hasAllPermissions work as expected', () => {
    expect(hasAnyPermission('user', ['manageUsers', 'viewOwnData'])).toBe(true);
    expect(hasAnyPermission('user', ['manageUsers', 'accessAdminPanel'])).toBe(false);

    expect(hasAllPermissions('manager', ['viewTeamUsage'])).toBe(true);
    expect(hasAllPermissions('manager', ['viewTeamUsage', 'manageUsers'])).toBe(false);
  });

  it('getRolePermissions returns non-empty for admin', () => {
    const perms = getRolePermissions('admin');
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain('manageUsers');
  });
});
