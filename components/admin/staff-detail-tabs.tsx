"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableSection } from "@/components/admin/editable-section";
import { FileUploader } from "@/components/upload/FileUploader";
import { formatDateForDisplay } from "@/lib/admin-utils";
import { PERMISSION_GROUPS, PERMISSION_KEYS } from "@/lib/admin-permissions";
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
  personalEmail?: string | null;
  phone: string | null;
  role: string;
  status?: string | null;
  emailVerified?: string | null;
  createdAt: string;
  staff?: {
    department: string | null;
    departmentId: string | null;
    departmentObj: { id: string; name: string; colour: string | null } | null;
    position: string | null;
    permissions?: string[];
    showOnAboutPage?: boolean;
    aboutPageOrder?: number;
    publicName?: string | null;
    publicRole?: string | null;
    publicBio?: string | null;
    profilePhotoUrl?: string | null;
  } | null;
}

const TABS: { id: StaffDetailTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "permissions", label: "Permissions" },
  { id: "activity", label: "Activity" },
  { id: "performance", label: "Performance" },
];

type StaffActivityLogRow = {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
};

type StaffActivityResponse = {
  logs: StaffActivityLogRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  availableTypes: string[];
};

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  STAFF_CREATED: "Created staff account",
  STAFF_INVITED: "Invited staff member",
  STAFF_PROFILE_UPDATED: "Updated profile details",
  STAFF_PERMISSIONS_UPDATED: "Updated permissions",
  STAFF_PUBLIC_PROFILE_UPDATED: "Updated About page profile",
  STAFF_PASSWORD_RESET_SENT: "Sent password reset email",
  STAFF_DELETED: "Deleted staff account",
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  STAFF: "Staff",
  SETTINGS: "Settings",
  ORDERS: "Orders",
  PRODUCTS: "Products",
  CATALOGUE: "Catalogue",
  USERS: "Users",
  DANGER: "Danger zone",
};

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
  const [departments, setDepartments] = useState<{ id: string; name: string; isActive: boolean }[]>([]);

  const [profile, setProfile] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    personalEmail: user.personalEmail ?? "",
    phone: user.phone ?? "",
    departmentId: user.staff?.departmentId ?? "",
    position: user.staff?.position ?? "",
  });

  useEffect(() => {
    fetch("/api/admin/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments ?? []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    setProfile({
      name: user.name ?? "",
      email: user.email ?? "",
      personalEmail: user.personalEmail ?? "",
      phone: user.phone ?? "",
      departmentId: user.staff?.departmentId ?? "",
      position: user.staff?.position ?? "",
    });
  }, [user]);

  const roleHasFullAccess = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const savedPermissions = roleHasFullAccess ? PERMISSION_KEYS : (user.staff?.permissions ?? []);
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

  const [activityData, setActivityData] = useState<StaffActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [appliedActivityFrom, setAppliedActivityFrom] = useState("");
  const [appliedActivityTo, setAppliedActivityTo] = useState("");
  const [appliedActivityType, setAppliedActivityType] = useState("");
  const [appliedActivityQuery, setAppliedActivityQuery] = useState("");

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(activityPage));
      params.set("perPage", "20");
      if (appliedActivityFrom) params.set("from", appliedActivityFrom);
      if (appliedActivityTo) params.set("to", appliedActivityTo);
      if (appliedActivityType) params.set("type", appliedActivityType);
      if (appliedActivityQuery.trim()) params.set("q", appliedActivityQuery.trim());

      const res = await fetch(`/api/admin/staff/${user.id}/activity?${params.toString()}`);
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || !Array.isArray(body.logs)) {
        setActivityData({
          logs: [],
          total: 0,
          page: 1,
          perPage: 20,
          totalPages: 1,
          availableTypes: [],
        });
        return;
      }
      setActivityData(body as StaffActivityResponse);
    } catch {
      setActivityData({
        logs: [],
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 1,
        availableTypes: [],
      });
    } finally {
      setActivityLoading(false);
    }
  }, [
    activityPage,
    appliedActivityFrom,
    appliedActivityTo,
    appliedActivityType,
    appliedActivityQuery,
    user.id,
  ]);

  useEffect(() => {
    if (activeTab !== "activity") return;
    void fetchActivity();
  }, [activeTab, fetchActivity]);

  const applyActivityFilters = () => {
    setActivityPage(1);
    setAppliedActivityFrom(activityFrom);
    setAppliedActivityTo(activityTo);
    setAppliedActivityType(activityType);
    setAppliedActivityQuery(activityQuery);
  };

  const resetActivityFilters = () => {
    setActivityFrom("");
    setActivityTo("");
    setActivityType("");
    setActivityQuery("");
    setActivityPage(1);
    setAppliedActivityFrom("");
    setAppliedActivityTo("");
    setAppliedActivityType("");
    setAppliedActivityQuery("");
  };

  const formatActivityTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return timestamp;
    }
  };

  const getActivityActionLabel = (action: string) =>
    ACTIVITY_ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

  const getActivityTypeLabel = (type: string) =>
    ACTIVITY_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

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
          {(user.status ?? "ACTIVE") === "INVITE_PENDING" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Invite pending</p>
              <p className="mt-1 text-amber-800/90">
                This person cannot sign in until they open the link in their email and set a password. Use{" "}
                “Resend invite email” if the link expired or they need a new message. You can update
                their personal email below, then resend.
              </p>
            </div>
          )}
          <EditableSection
            id="staff-profile"
            title="Profile"
            description="Work login email (@printhub.africa), personal email for invites, phone, department, position."
            canEdit={canEditProfile}
            viewContent={
              <div className="space-y-0">
                {[
                  { label: "Name", value: user.name ?? "—" },
                  { label: "Work email (login)", value: user.email },
                  {
                    label: "Personal email",
                    value: user.personalEmail?.trim() ? user.personalEmail : "— (invites sent to work email)",
                  },
                  { label: "Phone", value: user.phone ?? "—" },
                  { label: "Department", value: user.staff?.departmentObj?.name ?? user.staff?.department ?? "—" },
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
                  <Label>Work email (login)</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="focus-visible:ring-orange-500"
                    placeholder="name@printhub.africa"
                  />
                  <p className="text-xs text-muted-foreground">Must end with @printhub.africa. Changing it invalidates pending invite links until you resend.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Personal email</Label>
                  <Input
                    type="email"
                    value={profile.personalEmail}
                    onChange={(e) => setProfile((p) => ({ ...p, personalEmail: e.target.value }))}
                    className="focus-visible:ring-orange-500"
                    placeholder="Leave blank to send invites to work email"
                  />
                  <p className="text-xs text-muted-foreground">Invitation and password-setup emails are sent here when set; must differ from work email.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+254 XXX XXX XXX" className="focus-visible:ring-orange-500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <select
                    value={profile.departmentId}
                    onChange={(e) => setProfile((p) => ({ ...p, departmentId: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-orange-500 focus-visible:outline-none"
                  >
                    <option value="">No department</option>
                    {departments
                      .filter((d) => d.isActive)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
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
                    personalEmail: profile.personalEmail.trim() ? profile.personalEmail.trim() : null,
                    phone: profile.phone || null,
                    departmentId: profile.departmentId || null,
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

          <div className="border-t border-[#E5E7EB] pt-6 mt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#111]">About page visibility</p>
                <p className="text-xs text-[#6B7280]">Show this person in the Team section on /about</p>
              </div>
              <Switch
                checked={user.staff?.showOnAboutPage ?? false}
                onCheckedChange={async (checked) => {
                  try {
                    const res = await fetch(`/api/admin/staff/${user.id}/public-profile`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ showOnAboutPage: checked }),
                    });
                    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
                    router.refresh();
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Failed to update");
                  }
                }}
              />
            </div>
            {(user.staff?.showOnAboutPage ?? false) && (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-xs text-[#6B7280]">Profile photo</Label>
                    <div className="flex items-center gap-3 mt-1">
                      {user.staff?.profilePhotoUrl ? (
                        <img
                          src={user.staff?.profilePhotoUrl}
                          alt={user.name ?? "Staff"}
                          className="w-14 h-14 rounded-full object-cover border border-[#E5E7EB]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
                          {(user.staff?.publicName ?? user.name ?? "S").charAt(0)}
                        </div>
                      )}
                      <FileUploader
                        context="STAFF_PROFILE_PHOTO"
                        accept={["image/*"]}
                        maxSizeMB={5}
                        maxFiles={1}
                        label="Upload photo"
                        hint="Square photo, min 400×400px recommended"
                        onUploadComplete={async (files) => {
                          const url = files[0]?.publicUrl;
                          if (!url) return;
                          try {
                            const res = await fetch(`/api/admin/staff/${user.id}/public-profile`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ profilePhotoUrl: url }),
                            });
                            if (!res.ok) throw new Error();
                            router.refresh();
                          } catch {
                            alert("Failed to save photo");
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-[#6B7280]">Display name (leave blank to use account name)</Label>
                    <Input
                      defaultValue={user.staff?.publicName ?? ""}
                      onBlur={async (e) => {
                        const v = e.target.value.trim() || null;
                        try {
                          await fetch(`/api/admin/staff/${user.id}/public-profile`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ publicName: v }),
                          });
                          router.refresh();
                        } catch {
                          // ignore
                        }
                      }}
                      placeholder={user.name ?? "Full name"}
                      className="mt-1 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#6B7280]">Public role / title *</Label>
                    <Input
                      defaultValue={user.staff?.publicRole ?? ""}
                      onBlur={async (e) => {
                        const v = e.target.value.trim() || null;
                        try {
                          await fetch(`/api/admin/staff/${user.id}/public-profile`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ publicRole: v }),
                          });
                          router.refresh();
                        } catch {
                          // ignore
                        }
                      }}
                      placeholder="e.g. Head of Production, Lead Designer"
                      className="mt-1 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#6B7280]">Short bio (optional)</Label>
                    <textarea
                      defaultValue={user.staff?.publicBio ?? ""}
                      onBlur={async (e) => {
                        const v = e.target.value.trim() || null;
                        try {
                          await fetch(`/api/admin/staff/${user.id}/public-profile`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ publicBio: v }),
                          });
                          router.refresh();
                        } catch {
                          // ignore
                        }
                      }}
                      rows={2}
                      placeholder="1–2 sentences about this person's role..."
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-orange-500 resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#6B7280]">Display order (lower = first)</Label>
                    <Input
                      type="number"
                      min={0}
                      defaultValue={user.staff?.aboutPageOrder ?? 0}
                      onBlur={async (e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isNaN(n)) return;
                        try {
                          await fetch(`/api/admin/staff/${user.id}/public-profile`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ aboutPageOrder: n }),
                          });
                          router.refresh();
                        } catch {
                          // ignore
                        }
                      }}
                      className="mt-1 w-24 focus-visible:ring-orange-500"
                    />
                  </div>
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="mt-6" data-testid="staff-permissions-panel">
          <EditableSection
            id="staff-permissions"
            title="Permissions"
            description={
              roleHasFullAccess
                ? `${user.role.replace("_", " ")} has full access by role.`
                : "Granular access control for each admin section."
            }
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
              Activity log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                className="h-10 w-[160px]"
                value={activityFrom}
                onChange={(e) => setActivityFrom(e.target.value)}
              />
              <Input
                type="date"
                className="h-10 w-[160px]"
                value={activityTo}
                onChange={(e) => setActivityTo(e.target.value)}
              />
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All activity types</option>
                {(activityData?.availableTypes ?? []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Input
                type="search"
                placeholder="Search action or target"
                className="h-10 w-56"
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={applyActivityFilters}>
                Apply
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetActivityFilters}>
                Reset
              </Button>
            </div>

            {activityLoading ? (
              <p className="text-sm text-muted-foreground py-8">Loading activity...</p>
            ) : !activityData?.logs?.length ? (
              <p className="text-sm text-muted-foreground py-8">No activity found for the selected filters.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E7EB]">
                        <th className="text-left py-2 font-medium text-muted-foreground">Date & time</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Activity</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Target</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityData.logs.map((row) => (
                        <tr key={row.id} className="border-b border-[#E5E7EB]">
                          <td className="py-3 whitespace-nowrap">{formatActivityTimestamp(row.timestamp)}</td>
                          <td className="py-3 text-xs text-muted-foreground">{getActivityTypeLabel(row.entity)}</td>
                          <td className="py-3">{getActivityActionLabel(row.action)}</td>
                          <td className="py-3">{row.entityId ?? "—"}</td>
                          <td className="py-3 text-muted-foreground">{row.ipAddress ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {activityData.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={activityPage <= 1}
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {activityData.page} of {activityData.totalPages} ({activityData.total} total)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={activityPage >= activityData.totalPages}
                      onClick={() => setActivityPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
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
            <p className="text-sm text-muted-foreground">
              These metrics and the chart below are not connected to live data yet — they are UI placeholders until
              reporting is implemented.
            </p>
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
