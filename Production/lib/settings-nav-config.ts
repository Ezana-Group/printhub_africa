/**
 * Admin settings nav config — server-safe (no React components).
 * Used by server components for redirect and by layout; client SettingsNav maps to icons.
 */

export type SettingsNavItemSerializable = {
  href: string;
  label: string;
  group?: string;
};

const STAFF_NAV: SettingsNavItemSerializable[] = [
  { href: "/admin/settings/my-account", label: "My Account", group: "My Account" },
  { href: "/admin/settings/my-account/notifications", label: "Notifications", group: "My Account" },
  { href: "/admin/settings/my-account/activity", label: "My Activity", group: "My Account" },
];

const BUSINESS_NAV: SettingsNavItemSerializable[] = [
  { href: "/admin/settings/business", label: "Business Profile", group: "Business" },
  { href: "/admin/settings/shipping", label: "Shipping & Delivery", group: "Business" },
  { href: "/admin/settings/payments", label: "Payments & Checkout", group: "Business" },
  { href: "/admin/settings/notifications", label: "Notifications & Comms", group: "Business" },
  { href: "/admin/settings/integrations", label: "Integrations", group: "Business" },
  { href: "/admin/settings/security", label: "Security & Access", group: "Business" },
  { href: "/admin/settings/system", label: "System", group: "Business" },
];

const SUPER_ADMIN_NAV: SettingsNavItemSerializable[] = [
  { href: "/admin/settings/users", label: "Users & Roles", group: "Super Admin" },
  { href: "/admin/settings/audit-log", label: "Audit Log", group: "Super Admin" },
  { href: "/admin/settings/danger", label: "Danger Zone", group: "Super Admin" },
];

const MARKETING_NAV: SettingsNavItemSerializable[] = [
  { href: "/admin/settings/seo", label: "SEO", group: "Marketing" },
  { href: "/admin/settings/loyalty", label: "Loyalty Programme", group: "Marketing" },
  { href: "/admin/settings/referral", label: "Referral Programme", group: "Marketing" },
  { href: "/admin/settings/discounts", label: "Discount Settings", group: "Marketing" },
];

export function getSettingsNavForRole(role: string): SettingsNavItemSerializable[] {
  const myAccount = STAFF_NAV;
  if (role === "STAFF") return STAFF_NAV;
  if (role === "SUPER_ADMIN") {
    return [...myAccount, ...BUSINESS_NAV, ...SUPER_ADMIN_NAV, ...MARKETING_NAV];
  }
  if (role === "ADMIN") {
    return [...myAccount, ...BUSINESS_NAV, ...MARKETING_NAV];
  }
  return STAFF_NAV;
}

export function getFirstSettingsHref(role: string): string {
  const items = getSettingsNavForRole(role);
  return items[0]?.href ?? "/admin/settings/my-account";
}
