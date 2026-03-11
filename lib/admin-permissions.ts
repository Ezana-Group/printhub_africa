/**
 * Admin permission keys and route mapping.
 * Used for: saving staff permissions, sidebar visibility, route guards, API checks.
 */

// All permission keys used in the Permissions tab (must match staff-detail-tabs PERMISSION_GROUPS)
export const PERMISSION_KEYS = [
  "orders_view",
  "orders_edit",
  "orders_delete",
  "products_view",
  "products_edit",
  "products_delete",
  "finance_view",
  "finance_edit",
  "inventory_view",
  "inventory_edit",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** Minimum permission required to access a section (view = can see section). */
export const ROUTE_TO_PERMISSION: Record<string, PermissionKey | string> = {
  "/admin/dashboard": "orders_view",
  "/admin/orders": "orders_view",
  "/admin/products": "products_view",
  "/admin/categories": "products_view",
  "/admin/customers": "orders_view",
  "/admin/quotes": "orders_view",
  "/admin/uploads": "orders_view",
  "/admin/print-jobs": "orders_view",
  "/admin/production-queue": "orders_view",
  "/admin/corporate-accounts": "orders_view",
  "/admin/finance": "finance_view",
  "/admin/inventory": "inventory_view",
  "/admin/marketing": "products_view",
  "/admin/staff": "staff_manage",   // not in PERMISSION_KEYS → only ADMIN/SUPER_ADMIN
  "/admin/reports": "orders_view",
  "/admin/settings": "settings_manage", // not in PERMISSION_KEYS → only ADMIN/SUPER_ADMIN
};

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Returns true if the user (by role + permissions) can access the given route.
 * ADMIN and SUPER_ADMIN can access everything. STAFF need the required permission.
 */
export function canAccessRoute(
  path: string,
  role: string,
  permissions: string[] | null | undefined
): boolean {
  if (ADMIN_ROLES.includes(role)) return true;
  if (role !== "STAFF") return false;
  // Dashboard: any staff with at least one permission can see it
  if (path === "/admin/dashboard") return (permissions?.length ?? 0) > 0;
  const required = ROUTE_TO_PERMISSION[path];
  if (!required) return true;
  return permissions?.includes(required) ?? false;
}

/**
 * Returns true if the user has at least one of the given permission keys.
 * Used for API checks (e.g. finance_view or finance_edit for finance section).
 */
export function hasPermission(
  role: string,
  permissions: string[] | null | undefined,
  required: PermissionKey
): boolean {
  if (ADMIN_ROLES.includes(role)) return true;
  if (role !== "STAFF") return false;
  return permissions?.includes(required) ?? false;
}

/**
 * For Finance: require finance_view (read) or finance_edit (write).
 */
export function hasFinanceAccess(
  role: string,
  permissions: string[] | null | undefined,
  needEdit: boolean
): boolean {
  if (ADMIN_ROLES.includes(role)) return true;
  if (role !== "STAFF") return false;
  if (needEdit) return permissions?.includes("finance_edit") ?? false;
  return permissions?.includes("finance_view") ?? permissions?.includes("finance_edit") ?? false;
}
