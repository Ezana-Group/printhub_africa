"use client";

import { useState, useEffect, useMemo } from "react";
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

type DeliveryZone = {
  id: string;
  name: string;
  counties: string | null;
  feeKes: number | null;
  minDays: number | null;
  maxDays: number | null;
  isActive: boolean;
  sortOrder: number;
};

const ZONES_API = "/api/admin/settings/shipping/zones";

export function DeliveryZonesSection() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [feeKes, setFeeKes] = useState("");
  const [minDays, setMinDays] = useState("3");
  const [maxDays, setMaxDays] = useState("5");
  const [isActive, setIsActive] = useState(true);

  const loadZones = () => {
    setLoading(true);
    fetch(ZONES_API)
      .then((r) => r.json())
      .then((data) => setZones(Array.isArray(data) ? data : []))
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadZones();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setSelectedCounties([]);
    setFeeKes("");
    setMinDays("3");
    setMaxDays("5");
    setIsActive(true);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setName(zone.name);
    setSelectedCounties(
      zone.counties ? zone.counties.split(",").map((c) => c.trim()).filter(Boolean) : []
    );
    setFeeKes(zone.feeKes != null ? String(zone.feeKes) : "");
    setMinDays(zone.minDays != null ? String(zone.minDays) : "3");
    setMaxDays(zone.maxDays != null ? String(zone.maxDays) : "5");
    setIsActive(zone.isActive);
    setError(null);
    setDialogOpen(true);
  };

  const toggleCounty = (county: string) => {
    setSelectedCounties((prev) =>
      prev.includes(county) ? prev.filter((c) => c !== county) : [...prev, county]
    );
  };

  const selectAllCounties = () => setSelectedCounties([...KENYA_COUNTIES]);
  const clearCounties = () => setSelectedCounties([]);

  const assignedCounties = useMemo(() => {
    const set = new Set<string>();
    zones.forEach((z) => {
      if (z.counties) {
        z.counties.split(",").forEach((c) => set.add(c.trim()));
      }
    });
    return set;
  }, [zones]);

  const unassignedCounties = KENYA_COUNTIES.filter((c) => !assignedCounties.has(c));
  const allAssigned = unassignedCounties.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setError("Zone name is required.");
      return;
    }
    if (selectedCounties.length === 0) {
      setError("Select at least one county.");
      return;
    }
    const fee = Number(feeKes);
    if (Number.isNaN(fee) || fee < 0) {
      setError("Fee must be a number ≥ 0.");
      return;
    }
    const min = parseInt(minDays, 10);
    const max = parseInt(maxDays, 10);
    if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0 || min > max) {
      setError("Days must be valid numbers (min ≤ max).");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: nameTrim,
        counties: selectedCounties,
        feeKes: fee,
        minDays: min,
        maxDays: max,
        isActive,
        sortOrder: editingId ? undefined : zones.length,
      };
      if (editingId) {
        const res = await fetch(`${ZONES_API}/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update zone");
        }
      } else {
        const res = await fetch(ZONES_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create zone");
        }
      }
      loadZones();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this zone? Counties in it will become unassigned.")) return;
    try {
      const res = await fetch(`${ZONES_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      loadZones();
    } catch {
      setError("Failed to delete zone");
    }
  };

  if (loading) {
    return (
      <SectionCard
        title="Delivery Zones"
        description="Set delivery fees per county. Customers see these at checkout."
      >
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading zones…
        </p>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Delivery Zones"
        description="Set delivery fees per county. Customers see these at checkout."
      >
        <p className="text-sm text-muted-foreground mb-2">
          Zone Name | Counties | Fee (KES) | Days | Active. All 47 counties must be assigned.
        </p>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Zone Name</th>
                <th className="text-left p-3 font-medium">Counties</th>
                <th className="text-right p-3 font-medium">Fee (KES)</th>
                <th className="text-center p-3 font-medium">Days</th>
                <th className="text-center p-3 font-medium">Active</th>
                <th className="w-24 p-3" />
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No zones yet. Click &quot;+ Add Zone&quot; to create one.
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id} className="border-b last:border-b-0">
                    <td className="p-3">{zone.name}</td>
                    <td className="p-3 max-w-[200px] truncate" title={zone.counties ?? ""}>
                      {zone.counties ? zone.counties.replace(/,/g, ", ") : "—"}
                    </td>
                    <td className="p-3 text-right">{zone.feeKes != null ? zone.feeKes : "—"}</td>
                    <td className="p-3 text-center">
                      {zone.minDays != null && zone.maxDays != null
                        ? `${zone.minDays}–${zone.maxDays}`
                        : "—"}
                    </td>
                    <td className="p-3 text-center">{zone.isActive ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(zone)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(zone.id)}
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
          + Add Zone
        </Button>
        {!allAssigned && (
          <p className="text-sm text-amber-600 mt-2">
            Unassigned counties: {unassignedCounties.join(", ")}
          </p>
        )}
        {allAssigned && zones.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">All 47 counties are assigned.</p>
        )}
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit zone" : "Add zone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">
            <div>
              <Label htmlFor="zone-name">Zone name</Label>
              <Input
                id="zone-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eldoret & North Rift"
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Counties</Label>
                <span className="text-xs text-muted-foreground">
                  <button type="button" onClick={selectAllCounties} className="underline mr-2">
                    Select all
                  </button>
                  <button type="button" onClick={clearCounties} className="underline">
                    Clear
                  </button>
                </span>
              </div>
              <div className="border rounded-md p-3 max-h-[180px] overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-1">
                {KENYA_COUNTIES.map((county) => (
                  <label key={county} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCounties.includes(county)}
                      onChange={() => toggleCounty(county)}
                      className="rounded border-input"
                    />
                    {county}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCounties.length} of 47 selected
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="zone-fee">Fee (KES)</Label>
                <Input
                  id="zone-fee"
                  type="number"
                  min={0}
                  step={1}
                  value={feeKes}
                  onChange={(e) => setFeeKes(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zone-mindays">Min days</Label>
                <Input
                  id="zone-mindays"
                  type="number"
                  min={0}
                  value={minDays}
                  onChange={(e) => setMinDays(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zone-maxdays">Max days</Label>
                <Input
                  id="zone-maxdays"
                  type="number"
                  min={0}
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="zone-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="zone-active">Active (shown at checkout)</Label>
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
                {editingId ? "Save changes" : "Add zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
