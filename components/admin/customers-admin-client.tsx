"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { getInitials, nameToHue, formatRelativeTime, formatDateTimeForDisplay } from "@/lib/admin-utils";
import {
  Search,
  MoreHorizontal,
  Download,
  Mail,
  FileText,
  Star,
  Building2,
  UserX,
  Ban,
} from "lucide-react";

export type CustomerRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  isTopSpender: boolean;
  isCorporate: boolean;
};

export function CustomersAdminClient({
  customers,
  kpis,
}: {
  customers: CustomerRow[];
  kpis: { total: number; activeThisMonth: number; newThisMonth: number; corporate: number };
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const typeOptions: SelectOption[] = [
    { value: "", label: "All" },
    { value: "regular", label: "Regular" },
    { value: "corporate", label: "Corporate" },
    { value: "vip", label: "VIP" },
  ];
  const statusOptions: SelectOption[] = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const filtered = useMemo(() => {
    let list = [...customers];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          (c.name?.toLowerCase().includes(q)) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone?.includes(q))
      );
    }
    if (typeFilter === "corporate") list = list.filter((c) => c.isCorporate);
    if (typeFilter === "vip") list = list.filter((c) => c.isTopSpender); // treat top spenders as VIP for now
    if (typeFilter === "regular") list = list.filter((c) => !c.isCorporate && !c.isTopSpender);
    if (statusFilter) {
      // We don't have active/inactive on User; use "has orders" as proxy for active
      if (statusFilter === "active") list = list.filter((c) => c.ordersCount > 0);
      if (statusFilter === "inactive") list = list.filter((c) => c.ordersCount === 0);
    }
    if (sorting.length) {
      const [s] = sorting;
      const key = s.id as keyof CustomerRow;
      const dir = s.desc ? -1 : 1;
      list.sort((a, b) => {
        let av = a[key];
        let bv = b[key];
        if (key === "createdAt" || key === "lastOrderAt") {
          av = av != null ? new Date(av as string | Date).getTime() : 0;
          bv = bv != null ? new Date(bv as string | Date).getTime() : 0;
        }
        if (typeof av === "string" && typeof bv === "string") return dir * (av?.localeCompare(bv ?? "") ?? 0);
        if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
        if (av instanceof Date && bv instanceof Date) return dir * (av.getTime() - bv.getTime());
        if (av == null && bv == null) return 0;
        return av == null ? 1 : bv == null ? -1 : 0;
      });
    }
    return list;
  }, [customers, search, typeFilter, statusFilter, sorting]);

  const columns: ColumnDef<CustomerRow>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => {
          const c = row.original;
          const hue = nameToHue(c.email);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
              >
                {getInitials(c.name)}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="font-semibold text-sm text-[#111] hover:text-primary hover:underline block truncate"
                >
                  {c.name ?? "—"}
                </Link>
                <span className="text-[12px] text-[#6B7280]">
                  Joined {new Date(c.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="text-[13px] text-[#6B7280] min-w-0 max-w-[200px]">
              <div className="truncate" title={c.email}>{c.email}</div>
              <div>{c.phone ? `+254 ${c.phone.replace(/\D/g, "").slice(-9)}` : "—"}</div>
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const c = row.original;
          if (c.isTopSpender) return <Badge className="bg-amber-100 text-amber-800 border-0">⭐ VIP</Badge>;
          if (c.isCorporate) return <Badge className="bg-blue-100 text-blue-800 border-0">Corporate</Badge>;
          return <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280]">Regular</Badge>;
        },
      },
      {
        accessorKey: "ordersCount",
        header: "Orders",
        cell: ({ row }) => (
          <Link
            href={`/admin/customers/${row.original.id}#orders`}
            className="font-semibold text-sm text-[#111] hover:text-primary hover:underline"
          >
            {row.original.ordersCount}
          </Link>
        ),
      },
      {
        accessorKey: "totalSpent",
        header: "Total Spent",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <span className={`font-semibold text-sm ${c.isTopSpender ? "text-primary" : "text-[#111]"}`}>
              {formatPrice(c.totalSpent)}
            </span>
          );
        },
      },
      {
        accessorKey: "lastOrderAt",
        header: "Last Order",
        cell: ({ row }) => {
          const d = row.original.lastOrderAt;
          if (!d) return <span className="text-[#6B7280]">Never</span>;
          return (
            <span title={formatDateTimeForDisplay(d)}>
              {formatRelativeTime(d)}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: () => (
          <span className="flex items-center gap-1.5 text-sm text-[#10B981]">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            Active
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/customers/${c.id}`}>View customer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Send email
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/customers/${c.id}#orders`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Add internal note</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Star className="mr-2 h-4 w-4" /> Mark as VIP</DropdownMenuItem>
                <DropdownMenuItem><Building2 className="mr-2 h-4 w-4" /> Mark as Corporate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><UserX className="mr-2 h-4 w-4" /> Suspend account</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Ban className="mr-2 h-4 w-4" /> Ban account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 56,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Orders", "Total Spent", "Joined"];
    const lines = [headers.join(",")];
    for (const c of filtered) {
      lines.push([
        (c.name ?? "").replace(/"/g, '""'),
        c.email.replace(/"/g, '""'),
        (c.phone ?? "").replace(/"/g, '""'),
        c.ordersCount,
        c.totalSpent,
        c.createdAt.toISOString().slice(0, 10),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <AdminBreadcrumbs items={[{ label: "Customers" }]} />
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#111]">Customers</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Total Customers</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Active This Month</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{kpis.activeThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">New This Month</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{kpis.newThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Corporate</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{kpis.corporate}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[120px] h-9"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-[140px] h-9"
        />
      </div>

      <Card className="mt-6 border-[#E5E7EB] bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Search className="h-12 w-12 text-[#9CA3AF] mb-4" />
                <p className="text-base font-medium text-[#111]">No customers found</p>
                <p className="text-sm text-[#6B7280] mt-1 text-center max-w-sm">
                  They&apos;ll appear here when someone registers or adjust your filters.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider"
                          style={{ width: h.getSize() || undefined }}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] h-14 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/admin/customers/${row.original.id}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-0 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
