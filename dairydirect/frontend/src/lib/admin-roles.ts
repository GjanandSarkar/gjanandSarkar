/**
 * Admin Platform Role-Based Access Control (RBAC) Foundation
 * This provides the architectural foundation for Phase 21.
 */

export type AdminRole = 'super_admin' | 'operations_manager' | 'inventory_manager' | 'support_agent';

export interface RolePermissions {
  manage_products: boolean;
  manage_inventory: boolean;
  manage_orders: boolean;
  manage_subscriptions: boolean;
  manage_customers: boolean;
  view_analytics: boolean;
  manage_admins: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  super_admin: {
    manage_products: true,
    manage_inventory: true,
    manage_orders: true,
    manage_subscriptions: true,
    manage_customers: true,
    view_analytics: true,
    manage_admins: true,
  },
  operations_manager: {
    manage_products: false,
    manage_inventory: true,
    manage_orders: true,
    manage_subscriptions: true,
    manage_customers: true,
    view_analytics: true,
    manage_admins: false,
  },
  inventory_manager: {
    manage_products: true,
    manage_inventory: true,
    manage_orders: false,
    manage_subscriptions: false,
    manage_customers: false,
    view_analytics: false,
    manage_admins: false,
  },
  support_agent: {
    manage_products: false,
    manage_inventory: false,
    manage_orders: true,
    manage_subscriptions: true,
    manage_customers: true,
    view_analytics: false,
    manage_admins: false,
  },
};

/**
 * Utility to check if a role has a specific permission.
 * In Phase 21, this will be integrated with the auth state.
 */
export function hasPermission(role: AdminRole | undefined, permission: keyof RolePermissions): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
