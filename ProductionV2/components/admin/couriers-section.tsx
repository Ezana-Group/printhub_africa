"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Courier = {
  id: string;
  name: string;
  trackingUrl: string | null;
  phone: string | null;
  logo: string | null;
  isActive: boolean;
  sortOrder: number;
};

export function CouriersSection() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/couriers")
      .then((r) => r.json())
      .then((data) => {
        setCouriers(data.couriers ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          trackingUrl: trackingUrl.trim() || null,
          phone: phone.trim() || null,
          isActive: true,
          sortOrder: couriers.length,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCouriers((prev) => [...prev, data.courier]);
      setName("");
      setTrackingUrl("");
      setPhone("");
      setShowForm(false);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this courier?")) return;
    try {
      const res = await fetch(`/api/admin/settings/couriers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setCouriers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Add courier
        </Button>
      ) : (
        <form onSubmit={handleAdd} className="p-4 border rounded-lg space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. G4S Courier Kenya"
              required
            />
          </div>
          <div>
            <Label>Tracking URL (use &#123;trackingNumber&#125; as placeholder)</Label>
            <Input
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://g4s.co.ke/track/{trackingNumber}"
            />
          </div>
          <div>
            <Label>Phone (for customer tracking queries)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 XXX XXX XXX"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              Add
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {couriers.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
          >
            <span>
              {c.name}
              {!c.isActive && (
                <span className="ml-2 text-muted-foreground">(inactive)</span>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(c.id)}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
