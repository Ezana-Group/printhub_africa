"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DepartmentOption = { id: string; name: string };

export function InviteStaffPageClient({
  departments,
  currentUserRole,
}: {
  departments: DepartmentOption[];
  currentUserRole: "ADMIN" | "SUPER_ADMIN";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [role, setRole] = useState<"STAFF" | "ADMIN" | "SUPER_ADMIN">("STAFF");
  const [departmentId, setDepartmentId] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          personalEmail: personalEmail.trim() || undefined,
          role,
          departmentId: departmentId || undefined,
          position: position || undefined,
          phone: phone || undefined,
          invite: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send invite");
        return;
      }
      router.push("/admin/staff");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invite-name">Full Name *</Label>
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="invite-email">Work email (login) *</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="mt-1"
            placeholder="name@printhub.africa"
          />
          <p className="text-xs text-[#6B7280] mt-1">Must end with @printhub.africa — used to sign in after they set a password.</p>
        </div>
        <div>
          <Label htmlFor="invite-personal-email">Personal email</Label>
          <Input
            id="invite-personal-email"
            type="email"
            value={personalEmail}
            onChange={(e) => setPersonalEmail(e.target.value)}
            autoComplete="email"
            className="mt-1"
            placeholder="Optional — invite link sent here instead of work email"
          />
          <p className="text-xs text-[#6B7280] mt-1">If set, must be different from the work email. Leave blank to send the invite to the work address.</p>
        </div>
        <div>
          <Label htmlFor="invite-role">Role *</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "STAFF" | "ADMIN" | "SUPER_ADMIN")}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
            {currentUserRole === "SUPER_ADMIN" && (
              <option value="SUPER_ADMIN">Super Admin</option>
            )}
          </select>
        </div>
        <div>
          <Label htmlFor="invite-department">Department</Label>
          <select
            id="invite-department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select department (optional)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="invite-position">Position / Title</Label>
          <Input
            id="invite-position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            autoComplete="organization-title"
            placeholder="e.g. Print Operator, Sales Rep"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="invite-phone">Phone (optional)</Label>
          <Input
            id="invite-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+254 7XX XXX XXX"
            className="mt-1"
          />
        </div>
      </div>

      <p className="text-xs text-[#6B7280]">
        An email with a link to set their password is sent to the personal email when provided, otherwise to the work
        email. The link expires in 48 hours.
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/staff")}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
          {loading ? "Sending..." : "Send Invite"}
        </Button>
      </div>
    </form>
  );
}
