"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Settings,
  LogOut,
  FileText,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/quotes", label: "My Quotes", icon: FileText },
  { href: "/account/uploads", label: "My Uploads", icon: Upload },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#FFF8F5] flex flex-col lg:flex-row">
      {/* Sidebar — hidden on mobile, shown lg+ */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0",
          "bg-white border-r border-slate-200/80",
          "shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        )}
      >
        <nav className="p-4 space-y-0.5" aria-label="Account navigation">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-[#E8440A]/10 text-[#E8440A] border-l-[3px] border-[#E8440A] -ml-[3px] pl-[calc(1rem+3px)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#E8440A] border-l-[3px] border-transparent"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors border-l-[3px] border-transparent mt-2"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        aria-label="Account navigation"
      >
        <div className="flex items-center justify-around h-16">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[64px] rounded-lg text-xs font-medium transition-colors",
                  active ? "text-[#E8440A]" : "text-slate-500"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[64px] rounded-lg text-xs font-medium text-slate-500 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
