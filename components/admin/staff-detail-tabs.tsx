"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EditableSection } from "@/components/admin/editable-section";
import { formatRelativeTime, formatDateForDisplay } from "@/lib/admin-utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export type StaffDetailTab = "profile" | "permissions" | "activity" | "performance";

export interface StaffDetailUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  staff?: {
    department: string | null;
    position: string | null;
    permissions?: string[];
  } | null;
}

const TABS: { id: StaffDetailTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "permissions", label: "Permissions" },
  { id: "activity", label: "Activity" },
  { id: "performance", label: "Performance" },
];

// Permission categories and keys for the Permissions tab
const PERMISSION_GROUPS: { category: string; permissions: { key: string; label: string }[] }[] = [
  {
    category: "Orders",
    permissions: [
      { key: "orders_view", label: "View orders" },
      { key: "orders_edit", label: "Edit orders" },
      { key: "orders_delete", label: "Delete orders" },
    ],
  },
  {
    category: "Products",
    permissions: [
      { key: "products_view", label: "View products" },
      { key: "products_edit", label: "Edit products" },
      { key: "products_delete", label: "Delete products" },
    ],
  },
  {
    category: "Finance",
    permissions: [
      { key: "finance_view", label: "View only" },
      { key: "finance_edit", label: "Edit / record payments" },
    ],
  },
  {
    category: "Inventory",
    permissions: [
      { key: "inventory_view", label: "View inventory" },
      { key: "inventory_edit", label: "Update stock" },
    ],
  },
];

// Placeholder activity log entries
const PLACEHOLDER_ACTIVITY = [
  { id: "1", action: "Updated order #1234", timestamp: new Date(Date.now() - 1000 * 60 * 15) },
  { id: "2", action: "Added product \"Business Cards A4\"", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: "3", action: "Logged in", timestamp: new Date(Date.now() - 1000 * 60 * 120) },
  { id: "4", action: "Processed quote #567", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "5", action: "Updated inventory: Matte Paper", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
];

// Placeholder performance chart data
const PLACEHOLDER_PERF_DATA = [
  { week: "Week 1", orders: 12, quotes: 8 },
  { week: "Week 2", orders: 18, quotes: 14 },
  { week: "Week 3", orders: 15, quotes: 11 },
  { week: "Week 4", orders: 22, quotes: 16 },
];

export function StaffDetailTabs({
  user,
  canEditProfile = true,
  canEditPermissions = true,
}: {
  user: StaffDetailUser;
  canEditProfile?: boolean;
  canEditPermissions?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StaffDetailTab>("profile");

  const [profile, setProfile] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    department: user.staff?.department ?? "",
    position: user.staff?.position ?? "",
  });

  useEffect(() => {
    setProfile({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      department: user.staff?.department ?? "",
      position: user.staff?.position ?? "",
    });
  }, [user]);

  const savedPermissions = user.staff?.permissions ?? [];
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) =>
      g.permissions.forEach((p) => {
        initial[p.key] = savedPermissions.includes(p.key);
      })
    );
    return initial;
  });

  const setPermission = useCallback((key: string, value: boolean) => {
    setPermissions((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <>
      <div className="mt-8 flex border-b border-[#E5E7EB] gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-[#6B7280] hover:text-[#111]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div id="profile" className="mt-6 scroll-mt-4">
          <EditableSection
            id="staff-profile"
            title="Profile"
            description="Name, email, phone, department, position."
            canEdit={canEditProfile}
            viewContent={
              <div className="space-y-0">
                {[
                  { label: "Name", value: user.name ?? "—" },
                  { label: "Email", value: user.email },
                  { label: "Phone", value: user.phone ?? "—" },
                  { label: "Department", value: user.staff?.department ?? "—" },
                  { label: "Position", value: user.staff?.position ?? "—" },
                  { label: "Joined", value: formatDateForDisplay(user.createdAt) },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded px-1 -mx-1"
                  >
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            }
            editContent={({ setHasChanges }) => (
              <div className="space-y-4" onChange={() => setHasChanges(true)} onInput={() => setHasChanges(true)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} className="focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+254 XXX XXX XXX" className="focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} className="focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Input value={profile.position} onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))} className="focus-visible:ring-orange-500" />
                </div>
              </div>
            )}
            onSave={async () => {
              let res: Response;
              try {
                res = await fetch(`/api/admin/staff/${user.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: profile.name || undefined,
                    email: profile.email || undefined,
                    phone: profile.phone || null,
                    department: profile.department || null,
                    position: profile.position || null,
                  }),
                });
              } catch (err) {
                throw new Error(err instanceof Error ? err.message : "Network error");
              }
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error ?? "Failed to save");
              router.refresh();
            }}
          />
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="mt-6">
          <EditableSection
            id="staff-permissions"
            title="Permissions"
            description="Granular access for orders, products, finance, inventory."
            canEdit={canEditPermissions}
            viewContent={
              <div className="space-y-6">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <h4 className="text-sm font-medium text-[#111]">{group.category}</h4>
                    <div className="space-y-2 pl-2">
                      {group.permissions.map((p) => (
                        <div key={p.key} className="flex items-center justify-between gap-4 opacity-75">
                          <Label className="text-sm text-[#374151]">{p.label}</Label>
                          <Switch id={`view-${p.key}`} checked={permissions[p.key] ?? false} disabled className="opacity-70" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
            editContent={({ setHasChanges }) => (
              <div className="space-y-6" onChangeCapture={() => setHasChanges(true)}>
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <h4 className="text-sm font-medium text-[#111]">{group.category}</h4>
                    <div className="space-y-2 pl-2">
                      {group.permissions.map((p) => (
                        <div key={p.key} className="flex items-center justify-between gap-4">
                          <Label htmlFor={p.key} className="text-sm text-[#374151] cursor-pointer">
                            {p.label}
                          </Label>
                          <Switch
                            id={p.key}
                            checked={permissions[p.key] ?? false}
                            onCheckedChange={(checked) => setPermission(p.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            onSave={async () => {
              const payload = Object.entries(permissions)
                .filter(([, v]) => v)
                .map(([k]) => k);
              let res: Response;
              try {
                res = await fetch(`/api/admin/staff/${user.id}/permissions`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ permissions: payload }),
                });
              } catch (err) {
                throw new Error(err instanceof Error ? err.message : "Network error");
              }
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error ?? "Failed to save permissions");
              let getRes: Response;
              try {
                getRes = await fetch(`/api/admin/staff/${user.id}/permissions`);
              } catch {
                router.refresh();
                return;
              }
              const getData = await getRes.json().catch(() => ({}));
              if (getRes.ok && Array.isArray(getData.permissions)) {
                const next: Record<string, boolean> = {};
                PERMISSION_GROUPS.forEach((g) =>
                  g.permissions.forEach((p) => {
                    next[p.key] = getData.permissions.includes(p.key);
                  })
                );
                setPermissions(next);
              }
              router.refresh();
            }}
          />
        </div>
      )}

      {activeTab === "activity" && (
        <Card className="mt-6 bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0 divide-y divide-[#E5E7EB]">
              {PLACEHOLDER_ACTIVITY.map((item) => (
                <li key={item.id} className="py-3 first:pt-0 flex justify-between items-start gap-4">
                  <span className="text-sm text-[#111]">{item.action}</span>
                  <span className="text-xs text-[#6B7280] shrink-0">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {activeTab === "performance" && (
        <Card className="mt-6 bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs uppercase tracking-wider text-[#6B7280]">Orders processed</p>
                <p className="text-2xl font-bold text-[#111] mt-1">67</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs uppercase tracking-wider text-[#6B7280]">Quotes handled</p>
                <p className="text-2xl font-bold text-[#111] mt-1">49</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <p className="text-xs uppercase tracking-wider text-[#6B7280]">Avg. response time</p>
                <p className="text-2xl font-bold text-[#111] mt-1">2.4h</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#374151] mb-3">Activity (last 4 weeks)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PLACEHOLDER_PERF_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#FF4D00" name="Orders" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="quotes" fill="#00C896" name="Quotes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
