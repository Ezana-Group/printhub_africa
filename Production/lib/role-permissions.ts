/**
 * Role defaults for permissions when no UserPermission row exists.
 * SUPER_ADMIN has wildcard.
 */
export const ROLE_DEFAULTS: Record<string, string[]> = {
  STAFF: [
    "orders:view",
    "products:view",
    "customers:view",
    "inventory:view",
    "inventory:add_stock",
    "quotes:view",
  ],
  ADMIN: [
    "orders:view",
    "orders:edit",
    "orders:cancel",
    "orders:refund",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "customers:view",
    "customers:edit",
    "customers:export",
    "quotes:view",
    "quotes:create",
    "quotes:price",
    "quotes:approve",
    "finance:view",
    "finance:edit_costs",
    "finance:view_reports",
    "finance:export",
    "inventory:view",
    "inventory:add_stock",
    "inventory:edit",
    "inventory:delete",
    "pricing:view",
    "pricing:edit_rates",
    "pricing:edit_margins",
    "marketing:view",
    "marketing:create",
    "marketing:publish",
    "settings:view",
    "settings:edit_business",
    "settings:edit_payments",
    "staff:view",
    "reports:view",
    "reports:export",
    "audit:view",
  ],
  SUPER_ADMIN: ["*"],
};

export async function userCan(
  prisma: import("@prisma/client").PrismaClient,
  userId: string,
  permission: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: { where: { permission } } },
  });
  if (!user) return false;
  if (user.permissions[0] != null) return user.permissions[0].granted;
  if (user.role === "SUPER_ADMIN") return true;
  const defaults = ROLE_DEFAULTS[user.role];
  return defaults?.includes(permission) ?? false;
}
