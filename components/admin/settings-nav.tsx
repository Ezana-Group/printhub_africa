"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Bell,
  Activity,
  Building2,
  Truck,
  CreditCard,
  Mail,
  Plug,
  Shield,
  Settings,
  Users,
  FileText,
  AlertTriangle,
  Search,
  Gift,
  Share2,
  Tag,
} from "lucide-react";
import type { SettingsNavItemSerializable } from "@/lib/settings-nav-config";

type NavItemWithIcon = SettingsNavItemSerializable & {
  icon: React.ComponentType<{ className?: string }>;
};

const HREF_TO_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin/settings/my-account": User,
  "/admin/settings/my-account/notifications": Bell,
  "/admin/settings/my-account/activity": Activity,
  "/admin/settings/business": Building2,
  "/admin/settings/shipping": Truck,
  "/admin/settings/payments": CreditCard,
  "/admin/settings/notifications": Mail,
  "/admin/settings/integrations": Plug,
  "/admin/settings/security": Shield,
  "/admin/settings/system": Settings,
  "/admin/settings/users": Users,
  "/admin/settings/audit-log": FileText,
  "/admin/settings/danger": AlertTriangle,
  "/admin/settings/seo": Search,
  "/admin/settings/loyalty": Gift,
  "/admin/settings/referral": Share2,
  "/admin/settings/discounts": Tag,
};

interface SettingsNavProps {
  items: SettingsNavItemSerializable[];
}

export function SettingsNav({ items }: SettingsNavProps) {
  const pathname = usePathname();
  const itemsWithIcons: NavItemWithIcon[] = items.map((item) => ({
    ...item,
    icon: HREF_TO_ICON[item.href] ?? User,
  }));

  const groups = itemsWithIcons.reduce<Record<string, NavItemWithIcon[]>>((acc, item) => {
    const g = item.group ?? "Settings";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return (
    <nav className="p-2 space-y-4 w-56 shrink-0 sticky top-0 self-start overflow-y-auto max-h-screen border-r border-border">
      {Object.entries(groups).map(([groupName, groupItems]) => (
        <div key={groupName}>
          <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {groupName}
          </p>
          <div className="space-y-0.5 mt-1">
            {groupItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md text-sm py-2 pr-3 pl-[11px] border-l-4 ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-primary -ml-px"
                      : "border-transparent hover:bg-muted text-foreground hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
