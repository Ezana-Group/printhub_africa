"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getInitials, nameToHue, formatRelativeTime, formatDateForDisplay } from "@/lib/admin-utils";
import {
  Search,
  Plus,
  MoreHorizontal,
  User,
  Mail,
  Key,
  Activity,
  UserX,
  Trash2,
} from "lucide-react";

export type StaffRow = {
  id: string;
  name: string | null;
  email: string;
  personalEmail: string | null;
  role: string;
  status: string | null;
  department: string | null;
  position: string | null;
  departmentObj: { id: string; name: string; colour: string | null } | null;
  createdAt: Date;
  lastActiveAt: Date | null;
};

function RoleBadge({ role }: { role: string }) {
  if (role === "SUPER_ADMIN")
    return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-[#111] text-white border-[#111]">Super Admin</span>;
  if (role === "ADMIN")
    return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/30">Admin</span>;
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]">Staff</span>;
}

export function StaffAdminClient({
  staff,
  canInvite,
}: {
  staff: StaffRow[];
  canInvite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reset2faTarget, setReset2faTarget] = useState<StaffRow | null>(null);
  const [reset2faLoading, setReset2faLoading] = useState(false);
  const router = useRouter();

  const handleDeleteClick = useCallback((s: StaffRow) => setDeleteTarget(s), []);
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to delete");
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, router]);

  const handleReset2faClick = useCallback((s: StaffRow) => setReset2faTarget(s), []);

  const handleReset2faConfirm = useCallback(async () => {
    if (!reset2faTarget) return;
    setReset2faLoading(true);
    try {
      const res = await fetch(`/api/admin/settings/users/${reset2faTarget.id}/reset-2fa`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to reset 2FA");
        return;
      }
      setReset2faTarget(null);
      router.refresh();
    } finally {
      setReset2faLoading(false);
    }
  }, [reset2faTarget, router]);

  const roleOptions: SelectOption[] = [
    { value: "", label: "All roles" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ADMIN", label: "Admin" },
    { value: "STAFF", label: "Staff" },
  ];
  const statusOptions: SelectOption[] = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Invite Pending" },
    { value: "suspended", label: "Suspended" },
  ];

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !(
        s.name?.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.personalEmail && s.personalEmail.toLowerCase().includes(q))
      )
    )
      return false;
    if (roleFilter && s.role !== roleFilter) return false;
    const st = s.status ?? "ACTIVE";
    if (statusFilter === "active" && (st === "INVITE_PENDING" || st === "DEACTIVATED")) return false;
    if (statusFilter === "pending" && st !== "INVITE_PENDING") return false;
    if (statusFilter === "suspended" && st !== "DEACTIVATED") return false;
    return true;
  });

  const columns: ColumnDef<StaffRow>[] = [
    {
      accessorKey: "name",
      header: "Staff Member",
      cell: ({ row }) => {
        const s = row.original;
        const hue = nameToHue(s.email);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
            >
              {getInitials(s.name)}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/staff/${s.id}`}
                className="font-semibold text-sm text-[#111] hover:text-primary hover:underline block truncate"
              >
                {s.name ?? "—"}
              </Link>
              <span className="text-[12px] text-[#6B7280] block truncate">{s.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => {
        const s = row.original;
        const deptName = s.departmentObj?.name ?? s.department;
        const colour = s.departmentObj?.colour ?? null;
        return (
          <div className="text-sm">
            {deptName ? (
              colour ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: `${colour}18`,
                    color: colour,
                    border: `1px solid ${colour}40`,
                  }}
                >
                  {deptName}
                </span>
              ) : (
                <span className="text-[#111]">{deptName}</span>
              )
            ) : (
              <span className="text-[#6B7280]">—</span>
            )}
            {s.position && (
              <span className="block text-[12px] text-[#6B7280]">{s.position}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const st = row.original.status ?? "ACTIVE";
        if (st === "INVITE_PENDING") {
          return (
            <span className="flex items-center gap-1.5 text-sm text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Invite pending
            </span>
          );
        }
        if (st === "DEACTIVATED") {
          return (
            <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />
              Suspended
            </span>
          );
        }
        return (
          <span className="flex items-center gap-1.5 text-sm text-[#10B981]">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            Active
          </span>
        );
      },
    },
    {
      accessorKey: "lastActiveAt",
      header: "Last Active",
      cell: ({ row }) => {
        const d = row.original.lastActiveAt;
        if (!d) return <span className="text-[#6B7280]">—</span>;
        return <span title={formatDateForDisplay(d)}>{formatRelativeTime(d)}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/staff/${s.id}`}>
                  <User className="mr-2 h-4 w-4" />
                  View profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/staff/${s.id}#profile`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Edit details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/staff/${s.id}`}>
                  <Key className="mr-2 h-4 w-4" />
                  Reset password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReset2faClick(s);
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                Reset 2FA
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/staff/${s.id}#activity`}>
                  <Activity className="mr-2 h-4 w-4" />
                  View activity log
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-muted-foreground">
                <UserX className="mr-2 h-4 w-4" />
                Suspend account (coming soon)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteClick(s);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 56,
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <AdminBreadcrumbs items={[{ label: "Staff" }]} />
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#111]">Staff</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {staff.length} member{staff.length === 1 ? "" : "s"}
          </p>
        </div>
        {canInvite && (
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/admin/staff/invite">
              <Plus className="mr-2 h-4 w-4" />
              Invite Staff
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-[140px] h-9"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[120px] h-9"
        />
      </div>

      <Card className="mt-6 border-[#E5E7EB] bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <User className="h-12 w-12 text-[#9CA3AF] mb-4" />
                <p className="text-base font-medium text-[#111]">No staff found</p>
                <p className="text-sm text-[#6B7280] mt-1 text-center max-w-sm">
                  Invite your first team member or adjust your filters.
                </p>
                {canInvite && (
                  <Button asChild className="mt-4 bg-primary">
                    <Link href="/admin/staff/invite">
                      <Plus className="mr-2 h-4 w-4" />
                      Invite Staff
                    </Link>
                  </Button>
                )}
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
                      onClick={() => window.location.href = `/admin/staff/${row.original.id}`}
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

      {/* AUDIT FIX: Delete confirmation dialog before deleting staff */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This will permanently remove {deleteTarget.name ?? deleteTarget.email} from staff. They will no longer be able to log in. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteLoading} onClick={handleDeleteConfirm}>
              {deleteLoading ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset 2FA confirmation dialog */}
      <AlertDialog open={!!reset2faTarget} onOpenChange={(open) => !open && setReset2faTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              {reset2faTarget && (
                <>
                  This will clear 2FA for {reset2faTarget.name ?? reset2faTarget.email}. The next time
                  they sign in, they will need to set up 2FA again before accessing admin tools.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={reset2faLoading} onClick={handleReset2faConfirm}>
              {reset2faLoading ? "Resetting…" : "Reset 2FA"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
