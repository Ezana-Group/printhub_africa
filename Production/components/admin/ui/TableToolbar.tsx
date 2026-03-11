"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  width?: string;
}

export interface SortOption {
  label: string;
  value: string;
}

export interface TableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearch: (query: string) => void;
  filters?: FilterConfig[];
  sortOptions?: SortOption[];
  currentSort?: string;
  currentSortDir?: "asc" | "desc";
  onSortChange?: (field: string, dir: "asc" | "desc") => void;
  totalCount: number;
  filteredCount: number;
  actions?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  debounceMs?: number;
  className?: string;
}

export function TableToolbar({
  searchPlaceholder = "Search…",
  searchValue,
  onSearch,
  filters = [],
  sortOptions,
  currentSort,
  currentSortDir = "asc",
  onSortChange,
  totalCount,
  filteredCount,
  actions,
  onClearFilters,
  hasActiveFilters = false,
  debounceMs = 300,
  className,
}: TableToolbarProps) {
  const [localSearch, setLocalSearch] = React.useState(searchValue);
  // Sync external searchValue into local when it changes (e.g. URL)
  React.useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(localSearch);
      debounceRef.current = null;
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, debounceMs, onSearch]);

  const showClear =
    hasActiveFilters ?? (localSearch.trim() !== "" || filters.some((f) => f.value !== ""));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8 h-9"
            aria-label="Search"
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            style={f.width ? { width: f.width } : { minWidth: "140px" }}
            aria-label={f.label}
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {sortOptions && sortOptions.length > 0 && onSortChange && currentSort && (
          <div className="flex items-center gap-1">
            <select
              value={`${currentSort}:${currentSortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(":") as [string, "asc" | "desc"];
                onSortChange(field, dir);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm min-w-[160px]"
              aria-label="Sort by"
            >
              {sortOptions.map((opt) => (
                <option key={`${opt.value}:asc`} value={`${opt.value}:asc`}>
                  {opt.label} (A→Z / Low→High)
                </option>
              ))}
              {sortOptions.map((opt) => (
                <option key={`${opt.value}:desc`} value={`${opt.value}:desc`}>
                  {opt.label} (Z→A / High→Low)
                </option>
              ))}
            </select>
          </div>
        )}
        {actions != null && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          Showing {filteredCount} of {totalCount}
        </span>
        {showClear && onClearFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-muted-foreground">
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

