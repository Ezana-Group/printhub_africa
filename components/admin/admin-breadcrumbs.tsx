import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: string; href?: string };

export function AdminBreadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-[#6B7280]", className)}
    >
      <Link
        href="/admin/dashboard"
        className="hover:text-[#111] transition-colors"
      >
        Admin
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[#111] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#111] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
