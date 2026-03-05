"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";

export type QuoteFiltersState = {
  search: string;
  type: string;
  status: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
};

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "large_format", label: "Large Format" },
  { value: "three_d_print", label: "3D Print" },
  { value: "design_and_print", label: "I Have an Idea" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "in_production", label: "In Production" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminQuotesFilters({
  filters,
  onFiltersChange,
  staffList,
  onExportCsv,
  exportDisabled,
}: {
  filters: QuoteFiltersState;
  onFiltersChange: (f: QuoteFiltersState) => void;
  staffList: { id: string; name: string; email: string }[];
  onExportCsv: () => void;
  exportDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
      <div className="min-w-[180px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
        <Input
          placeholder="Name, email, quote #"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="h-9"
        />
      </div>
      <div className="w-[160px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
        <Select
          value={filters.type || "all"}
          onValueChange={(v) => onFiltersChange({ ...filters, type: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[160px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
        <Select
          value={filters.status || "all"}
          onValueChange={(v) => onFiltersChange({ ...filters, status: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[180px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Assigned to</label>
        <Select
          value={filters.assignedTo || "all"}
          onValueChange={(v) => onFiltersChange({ ...filters, assignedTo: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {staffList.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name || s.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="h-9 w-[140px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="h-9 w-[140px]"
          />
        </div>
      </div>
      <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onExportCsv} disabled={exportDisabled}>
        <Download className="mr-1.5 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
