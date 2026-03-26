"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mail, MessageCircle } from "lucide-react";

export function TemplateTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Email Templates",
      href: "/admin/content/email-templates",
      icon: Mail,
      isActive: pathname.startsWith("/admin/content/email-templates"),
    },
    {
      label: "WhatsApp Templates",
      href: "/admin/content/whatsapp-templates",
      icon: MessageCircle,
      isActive: pathname.startsWith("/admin/content/whatsapp-templates"),
    },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab.isActive
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
