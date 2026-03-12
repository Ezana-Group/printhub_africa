"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type SavedAddressItem = {
  id: string;
  label: string;
  recipientName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  county: string;
  isDefault: boolean;
};

export function SavedAddressesList({ addresses }: { addresses: SavedAddressItem[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [defaultingId, setDefaultingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddressItem | null>(null);
  const [form, setForm] = useState({ label: "", recipientName: "", phone: "", line1: "", line2: "", city: "", county: "" });
  const [saving, setSaving] = useState(false);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/account/settings/addresses/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setDefaultingId(id);
    try {
      const res = await fetch(`/api/account/settings/addresses/${id}/default`, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setDefaultingId(null);
    }
  };

  const openEdit = (a: SavedAddressItem) => {
    setEditing(a);
    setForm({
      label: a.label,
      recipientName: a.recipientName ?? "",
      phone: a.phone ?? "",
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      county: a.county,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/account/settings/addresses/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label || undefined,
          recipientName: form.recipientName || undefined,
          phone: form.phone || undefined,
          line1: form.line1 || undefined,
          line2: form.line2 || undefined,
          city: form.city || undefined,
          county: form.county || undefined,
        }),
      });
      if (res.ok) {
        setEditOpen(false);
        setEditing(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ul className="mt-8 space-y-4">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{a.label}{a.isDefault ? " (Default)" : ""}</p>
                {(a.recipientName || a.phone) && (
                  <p className="mt-0.5 text-slate-600 text-sm">
                    {[a.recipientName, a.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-slate-600 text-sm">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""} — {a.city}, {a.county}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">You can also choose or change this address at checkout.</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(a.id)} disabled={!!defaultingId}>
                    {defaultingId === a.id ? "…" : "Set default"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)} disabled={!!deletingId}>
                  {deletingId === a.id ? "…" : "Delete"}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-label">Label (e.g. Home)</Label>
              <Input id="edit-label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-recipient">Recipient name</Label>
              <Input id="edit-recipient" value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-line1">Address line 1 *</Label>
              <Input id="edit-line1" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-line2">Address line 2 (optional)</Label>
              <Input id="edit-line2" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input id="edit-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-county">County *</Label>
                <Input id="edit-county" value={form.county} onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !form.line1?.trim() || !form.city?.trim() || !form.county?.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
