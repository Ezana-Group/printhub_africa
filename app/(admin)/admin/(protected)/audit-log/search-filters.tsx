"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

export function SearchFilters({
  initialFilters,
  staff,
}: {
  initialFilters: any;
  staff: { id: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    from: initialFilters.from || "",
    to: initialFilters.to || "",
    userId: initialFilters.userId || "",
    category: initialFilters.category || "",
    q: initialFilters.q || "",
  });

  const updateFilter = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset page on filter change
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Search</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Action, ID, Entity..."
          value={filters.q}
          onChange={(e) => updateFilter("q", e.target.value)}
        />
      </div>
      
      <div className="w-48">
        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">User</label>
        <select
          className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          value={filters.userId}
          onChange={(e) => updateFilter("userId", e.target.value)}
        >
          <option value="">All Users</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
          ))}
        </select>
      </div>

      <div className="w-48">
        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Category</label>
        <select
          className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="ORDER">ORDER</option>
          <option value="PAYMENT">PAYMENT</option>
          <option value="REFUND">REFUND</option>
          <option value="USER">USER</option>
          <option value="PRODUCT">PRODUCT</option>
          <option value="SETTINGS">SETTINGS</option>
          <option value="AUTH">AUTH</option>
          <option value="SECURITY">SECURITY</option>
        </select>
      </div>

      <div className="w-40">
        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">From</label>
        <input
          type="date"
          className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          value={filters.from}
          onChange={(e) => updateFilter("from", e.target.value)}
        />
      </div>

      <div className="w-40">
        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">To</label>
        <input
          type="date"
          className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          value={filters.to}
          onChange={(e) => updateFilter("to", e.target.value)}
        />
      </div>
    </div>
  );
}
