"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface UseTableUrlStateOptions {
  defaultPerPage?: number;
}

/**
 * Sync table state (search, filters, sort, pagination) to URL query params.
 * Use with TableToolbar and TablePagination for shareable/bookmarkable table views.
 */
export function useTableUrlState(options: UseTableUrlStateOptions = {}) {
  const { defaultPerPage = 25 } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string, defaultValue = "") => {
      return searchParams.get(key) ?? defaultValue;
    },
    [searchParams]
  );

  const set = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === null) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      const q = next.toString();
      router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const q = get("q");
  const page = Math.max(1, parseInt(get("page", "1"), 10) || 1);
  const perPage = Math.min(100, Math.max(10, parseInt(get("perPage", String(defaultPerPage)), 10) || defaultPerPage));
  const sort = get("sort", "");
  const dir = (get("dir", "asc") === "desc" ? "desc" : "asc") as "asc" | "desc";

  const setSearch = useCallback((v: string) => set({ q: v || undefined, page: 1 }), [set]);
  const setPage = useCallback((p: number) => set({ page: p > 1 ? p : undefined }), [set]);
  const setPerPage = useCallback((n: number) => set({ perPage: n, page: 1 }), [set]);
  const setSort = useCallback((field: string, direction: "asc" | "desc") => set({ sort: field || undefined, dir: direction, page: 1 }), [set]);

  const clearFilters = useCallback(() => {
    const keysToRemove = ["q", "page", "sort", "dir", "perPage"];
    const next = new URLSearchParams(searchParams.toString());
    keysToRemove.forEach((k) => next.delete(k));
    // Remove any filter keys that look like filter names (e.g. category, status, type)
    const filterKeys = ["category", "status", "type", "subType", "categoryId", "parent", "payment", "dateRange", "amount", "amountRange", "stockStatus", "categoryName"];
    filterKeys.forEach((k) => next.delete(k));
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return {
    q,
    page,
    perPage,
    sort,
    dir,
    get,
    set,
    setSearch,
    setPage,
    setPerPage,
    setSort,
    clearFilters,
  };
}
