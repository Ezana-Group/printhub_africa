"use client";

import { useState, useEffect } from "react";
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
import { SectionCard } from "@/components/settings/section-card";
import { KENYA_COUNTIES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

type PickupLocation = {
  id: string;
  name: string;
  city: string;
  county: string;
  street: string;
  postalCode: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
};

const API = "/api/admin/settings/shipping/pickup-locations";

export function PickupLocationsSection() {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const load = () => {
    setLoading(true);
    fetch(API)
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setCity("");
    setCounty("");
    setStreet("");
    setPostalCode("");
    setInstructions("");
    setIsActive(true);
    setSortOrder(String(locations.length));
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (loc: PickupLocation) => {
    setEditingId(loc.id);
    setName(loc.name);
    setCity(loc.city);
    setCounty(loc.county);
    setStreet(loc.street);
    setPostalCode(loc.postalCode ?? "");
    setInstructions(loc.instructions ?? "");
    setIsActive(loc.isActive);
    setSortOrder(String(loc.sortOrder));
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nameTrim = name.trim();
    const cityTrim = city.trim();
    const countyTrim = county.trim();
    const streetTrim = street.trim();
    if (!nameTrim) {
      setError("Location name is required.");
      return;
    }
    if (!cityTrim) {
      setError("City is required.");
      return;
    }
    if (!countyTrim) {
      setError("County is required.");
      return;
    }
    if (!streetTrim) {
      setError("Street / address is required.");
      return;
    }
    const order = parseInt(sortOrder, 10);
    if (Number.isNaN(order) || order < 0) {
      setError("Sort order must be a number ≥ 0.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: nameTrim,
        city: cityTrim,
        county: countyTrim,
        street: streetTrim,
        postalCode: postalCode.trim() || undefined,
        instructions: instructions.trim() || undefined,
        isActive,
        sortOrder: order,
      };
      if (editingId) {
        const res = await fetch(`${API}/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update");
        }
      } else {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create");
        }
      }
      load();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pickup location? It will no longer appear at checkout.")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      load();
    } catch {
      setError("Failed to delete");
    }
  };

  if (loading) {
    return (
      <SectionCard
        title="Pickup locations"
        description="Add pickup points across the country. Customers choose one at checkout when they select Pick up."
      >
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Pickup locations"
        description="Add pickup points across the country. Customers choose one at checkout when they select Pick up."
      >
        <p className="text-sm text-muted-foreground mb-2">
          Name | City | County | Address | Active
        </p>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">City</th>
                <th className="text-left p-3 font-medium">County</th>
                <th className="text-left p-3 font-medium max-w-[200px]">Address</th>
                <th className="text-center p-3 font-medium">Active</th>
                <th className="w-24 p-3" />
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No pickup locations yet. Click &quot;+ Add pickup location&quot; to create one.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="border-b last:border-b-0">
                    <td className="p-3">{loc.name}</td>
                    <td className="p-3">{loc.city}</td>
                    <td className="p-3">{loc.county}</td>
                    <td className="p-3 max-w-[200px] truncate" title={loc.street}>{loc.street}</td>
                    <td className="p-3 text-center">{loc.isActive ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(loc)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(loc.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" className="mt-4" onClick={openAdd}>
          + Add pickup location
        </Button>
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit pickup location" : "Add pickup location"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">
            <div>
              <Label htmlFor="pl-name">Location name (shown at checkout)</Label>
              <Input
                id="pl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nairobi — Westlands"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pl-city">City</Label>
                <Input
                  id="pl-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pl-county">County</Label>
                <select
                  id="pl-county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select county</option>
                  {KENYA_COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="pl-street">Street / full address</Label>
              <Input
                id="pl-street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. 123 Westlands Ave"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pl-postal">Postal code (optional)</Label>
              <Input
                id="pl-postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 00100"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pl-instructions">Pickup instructions (optional)</Label>
              <Input
                id="pl-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Gate B, call on arrival"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pl-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="pl-active">Active (shown at checkout)</Label>
              </div>
              <div>
                <Label htmlFor="pl-sort" className="text-xs">Sort order</Label>
                <Input
                  id="pl-sort"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="mt-1 w-20"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save changes" : "Add location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
