"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AddStaffForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [departmentId, setDepartmentId] = useState("");
  const [position, setPosition] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string; isActive: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/admin/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments ?? []))
      .catch(() => setDepartments([]));
  }, []);

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
          password,
          role,
          departmentId: departmentId || undefined,
          position: position || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add staff");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setDepartmentId("");
      setPosition("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add staff</CardTitle>
        <CardDescription>Create a new staff or admin account. They can sign in immediately.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Min 8 characters</p>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "STAFF" | "ADMIN")}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          {(role === "STAFF" || role === "ADMIN") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="department">Department (optional)</Label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select department (optional)</option>
                  {departments
                    .filter((d) => d.isActive)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label htmlFor="position">Position (optional)</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Sales Rep"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add staff"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
