"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  type SelectOption,
} from "@/components/ui/select";

// User roles (from schema). Use Department for Marketing, Sales, etc.
const roleOptions: SelectOption[] = [
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
];

const departmentOptions: SelectOption[] = [
  { value: "", label: "Select department (optional)" },
  { value: "Marketing", label: "Marketing" },
  { value: "Sales", label: "Sales" },
  { value: "Production", label: "Production" },
  { value: "Design", label: "Design" },
  { value: "Finance", label: "Finance" },
  { value: "Operations", label: "Operations" },
  { value: "Other", label: "Other" },
];

export function InviteStaffSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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
          role,
          department: department || undefined,
          position: position || undefined,
          phone: phone || undefined,
          invite: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send invite");
        return;
      }
      setName("");
      setEmail("");
      setDepartment("");
      setPosition("");
      setPhone("");
      onSuccess();
      handleClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onOpenChange(false);
  };

  // Defer close to next tick so Radix focus trap doesn't block the main thread (fixes Cancel freeze)
  const onCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(handleClose, 0);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="sm:max-w-[480px] bg-white border-[#E5E7EB]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#111]">Invite new staff member</DialogTitle>
        </DialogHeader>
        <form id="invite-staff-form" onSubmit={handleSubmit} className="flex flex-col mt-2 gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="invite-name">Full Name *</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="invite-email">Email Address *</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Role *</Label>
            <Select
              id="invite-role"
              options={roleOptions}
              value={role}
              onChange={(e) => setRole(e.target.value as "STAFF" | "ADMIN")}
              className="mt-1"
            />
            <p className="text-xs text-[#6B7280] mt-0.5">Use Department for Marketing, Sales, Production, etc.</p>
          </div>
          <div>
            <Label htmlFor="invite-department">Department</Label>
            <Select
              id="invite-department"
              options={departmentOptions}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="invite-position">Position / Title</Label>
            <Input
              id="invite-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
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
              placeholder="+254 7XX XXX XXX"
              className="mt-1"
            />
          </div>
          <p className="text-xs text-[#6B7280]">
            An invite email will be sent so they can set their own password. Link expires in 48 hours.
          </p>
        </form>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancelClick}>
            Cancel
          </Button>
          <Button type="submit" form="invite-staff-form" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Sending…" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
