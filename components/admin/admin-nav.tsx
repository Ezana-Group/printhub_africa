"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  DollarSign,
  Warehouse,
  Settings,
  BarChart3,
  Megaphone,
  UserCog,
  FolderTree,
  Printer,
  ListTodo,
  Handshake,
  TrendingUp,
  HelpCircle,
  Scale,
  Mail,
  ImageIcon,
  Briefcase,
  Layers,
  Truck,
} from "lucide-react";
import { canAccessRoute } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "quotes";
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "SHOP",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/deliveries", label: "Deliveries", icon: Truck },
      { href: "/admin/support", label: "Support", icon: HelpCircle },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/reviews", label: "Reviews", icon: BarChart3 },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/catalogue", label: "Catalogue", icon: Layers },
    ],
  },
  {
    label: "PRINT SERVICES",
    items: [
      { href: "/admin/orders?tab=print-jobs", label: "Print Jobs", icon: Printer },
      { href: "/admin/production-queue", label: "Production Queue", icon: ListTodo },
      { href: "/admin/quotes", label: "Quotes & Uploads", icon: FileText, badge: "quotes" },
    ],
  },
  {
    label: "CUSTOMERS & SALES",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/corporate", label: "Corporate", icon: Handshake },
      { href: "/admin/corporate-accounts", label: "Corporate Accounts", icon: Handshake },
      { href: "/admin/reports/sales", label: "Sales Reports", icon: TrendingUp },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
      { href: "/admin/finance", label: "Finance", icon: DollarSign },
      { href: "/admin/refunds", label: "Refunds", icon: DollarSign },
      { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/admin/content/legal", label: "Legal Pages", icon: Scale },
      { href: "/admin/content/faq", label: "FAQ Manager", icon: HelpCircle },
      { href: "/admin/content/email-templates", label: "Email Templates", icon: Mail },
      { href: "/admin/content/site-images", label: "Site Images", icon: ImageIcon },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/admin/staff", label: "Staff", icon: UserCog },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/careers", label: "Careers", icon: Briefcase },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminNavProps {
  role: string;
  permissions?: string[] | null;
  newQuotesCount?: number;
}

export function AdminNav({ role, permissions, newQuotesCount = 0 }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="p-2 space-y-4">
      <Link
        href="/admin/dashboard"
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          pathname === "/admin/dashboard"
            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px pl-[11px]"
            : "hover:bg-muted text-foreground hover:text-primary"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) =>
          canAccessRoute(item.href.split("?")[0], role, permissions ?? [])
        );
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const basePath = item.href.split("?")[0];
                const isActive =
                  pathname === basePath ||
                  (basePath !== "/admin/dashboard" && pathname.startsWith(basePath + "/"));
                const showBadge = item.badge === "quotes" && newQuotesCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px pl-[11px]"
                        : "hover:bg-muted text-foreground hover:text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                        {newQuotesCount > 99 ? "99+" : newQuotesCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
