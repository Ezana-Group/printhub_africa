/**
 * Admin permission keys and route mapping.
 * Used for: saving staff permissions, sidebar visibility, route guards, API checks.
 */

export const PERMISSION_GROUPS = [
  {
    category: "Orders",
    permissions: [
      { key: "orders_view", label: "View orders" },
      { key: "orders_edit", label: "Edit orders" },
      { key: "orders_delete", label: "Delete / cancel orders" },
    ],
  },
  {
    category: "Deliveries",
    permissions: [
      { key: "deliveries_view", label: "View deliveries" },
      { key: "deliveries_edit", label: "Update delivery status / assignments" },
    ],
  },
  {
    category: "Support",
    permissions: [
      { key: "support_view", label: "View support tickets" },
      { key: "support_reply", label: "Reply / resolve support tickets" },
    ],
  },
  {
    category: "Quotes & Uploads",
    permissions: [
      { key: "quotes_view", label: "View quote requests and uploads" },
      { key: "quotes_edit", label: "Edit / prepare quotes" },
      { key: "quotes_approve", label: "Approve / send final quote" },
    ],
  },
  {
    category: "Customers & Corporate",
    permissions: [
      { key: "customers_view", label: "View customers" },
      { key: "customers_edit", label: "Edit customer profiles" },
      { key: "corporate_view", label: "View corporate requests / accounts" },
      { key: "corporate_manage", label: "Approve / manage corporate accounts" },
    ],
  },
  {
    category: "Products & Catalogue",
    permissions: [
      { key: "products_view", label: "View products / categories / reviews" },
      { key: "products_edit", label: "Edit products / categories" },
      { key: "products_delete", label: "Delete products" },
      { key: "catalogue_view", label: "View catalogue" },
      { key: "catalogue_edit", label: "Create/edit/import catalogue items" },
      { key: "catalogue_import", label: "Import 3D models (URL/API)" },
      { key: "catalogue_review", label: "Review and approve imported models" },
    ],
  },
  {
    category: "Production & Inventory",
    permissions: [
      { key: "production_view", label: "View production queue" },
      { key: "production_update", label: "Update production statuses" },
      { key: "inventory_view", label: "View inventory" },
      { key: "inventory_edit", label: "Update inventory stock" },
    ],
  },
  {
    category: "Finance & Refunds",
    permissions: [
      { key: "finance_view", label: "View finance and invoices" },
      { key: "finance_edit", label: "Record/edit payments and finance data" },
      { key: "refunds_view", label: "View refunds" },
      { key: "refunds_process", label: "Approve/process refunds" },
    ],
  },
  {
    category: "Marketing & Content",
    permissions: [
      { key: "marketing_view", label: "View marketing tools" },
      { key: "marketing_edit", label: "Edit marketing campaigns" },
      { key: "content_view", label: "View legal/FAQ/email content" },
      { key: "content_edit", label: "Create/edit content pages" },
    ],
  },
  {
    category: "Email",
    permissions: [
      { key: "email_view", label: "View email inbox/threads" },
      { key: "email_manage", label: "Manage email threads/mailboxes" },
    ],
  },
  {
    category: "Admin Areas",
    permissions: [
      { key: "reports_view", label: "View reports" },
      { key: "careers_view", label: "View careers and applications" },
      { key: "careers_edit", label: "Manage careers and applications" },
      { key: "staff_view", label: "View staff list/profiles" },
      { key: "staff_manage", label: "Invite/edit staff and permissions" },
      { key: "settings_view", label: "View settings pages" },
      { key: "settings_manage", label: "Manage business settings" },
    ],
  },
] as const;

export type PermissionKey = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];
export const PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key)
) as PermissionKey[];

/** Prefix-based route policy for STAFF users (SUPER_ADMIN/ADMIN always bypass). */
const ROUTE_PREFIX_POLICIES: { prefix: string; permission: PermissionKey }[] = [
  { prefix: "/admin/orders", permission: "orders_view" },
  { prefix: "/admin/deliveries", permission: "deliveries_view" },
  { prefix: "/admin/support", permission: "support_view" },
  { prefix: "/admin/quotes", permission: "quotes_view" },
  { prefix: "/admin/uploads", permission: "quotes_view" },
  { prefix: "/admin/customers", permission: "customers_view" },
  { prefix: "/admin/corporate-accounts", permission: "corporate_view" },
  { prefix: "/admin/corporate", permission: "corporate_view" },
  { prefix: "/admin/products", permission: "products_view" },
  { prefix: "/admin/reviews", permission: "products_view" },
  { prefix: "/admin/categories", permission: "products_view" },
  { prefix: "/admin/catalogue", permission: "catalogue_view" },
  { prefix: "/admin/production-queue", permission: "production_view" },
  { prefix: "/admin/inventory", permission: "inventory_view" },
  { prefix: "/admin/finance", permission: "finance_view" },
  { prefix: "/admin/refunds", permission: "refunds_view" },
  { prefix: "/admin/marketing", permission: "marketing_view" },
  { prefix: "/admin/content", permission: "content_view" },
  { prefix: "/admin/reports", permission: "reports_view" },
  { prefix: "/admin/careers", permission: "careers_view" },
  { prefix: "/admin/staff", permission: "staff_view" },
  { prefix: "/admin/settings", permission: "settings_view" },
  { prefix: "/admin/email", permission: "email_view" },
  { prefix: "/admin/email/thread", permission: "email_view" },
  { prefix: "/admin/email/inbox", permission: "email_view" },
  { prefix: "/admin/email/settings", permission: "email_manage" },
  { prefix: "/api/admin/n8n/sso", permission: "settings_manage" },
];

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

  const normalizedPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  // Dashboard: any staff with at least one permission can see it.
  if (normalizedPath === "/admin/dashboard") return (permissions?.length ?? 0) > 0;

  // Match the most specific admin section first.
  const matched = ROUTE_PREFIX_POLICIES
    .filter((rule) => normalizedPath === rule.prefix || normalizedPath.startsWith(`${rule.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (matched) return permissions?.includes(matched.permission) ?? false;

  // Fail closed for unknown /admin routes.
  if (normalizedPath.startsWith("/admin")) return false;

  return true;
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
