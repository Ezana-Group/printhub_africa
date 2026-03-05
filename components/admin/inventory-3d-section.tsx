"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spool, Package, MoreHorizontal, Pencil, PackagePlus, Trash2, Plus, Minus, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MATERIAL_OPTIONS = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Nylon", "Resin", "Other"] as const;
const WEIGHT_OPTIONS = [
  { value: 0.25, label: "250g" },
  { value: 0.5, label: "500g" },
  { value: 1, label: "1kg" },
  { value: 2, label: "2kg" },
  { value: "custom", label: "Custom" },
] as const;
const PRESET_COLOURS = [
  { name: "Black", hex: "#1f2937" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Red", hex: "#dc2626" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Brown", hex: "#92400e" },
  { name: "Pink", hex: "#ec4899" },
];

type ThreeDConsumable = {
  id: string;
  kind: string;
  name: string;
  specification: string | null;
  quantity: number;
  lowStockThreshold: number;
  location: string | null;
  costPerKgKes: number | null;
  unitCostKes: number | null;
};

const TAB_CONFIG = [
  { id: "filament" as const, label: "Filament", icon: Spool },
  { id: "other" as const, label: "Other consumables", icon: Package },
];

export function Inventory3DSection({
  consumables,
}: {
  consumables: ThreeDConsumable[];
}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"filament" | "other">("filament");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const [materialOption, setMaterialOption] = useState<string>("PLA");
  const [materialOther, setMaterialOther] = useState("");
  const [colourHex, setColourHex] = useState("#1f2937");
  const [colourName, setColourName] = useState("");
  const [brand, setBrand] = useState("");
  const [weightPerSpool, setWeightPerSpool] = useState<number | "custom">(1);
  const [weightCustomKg, setWeightCustomKg] = useState<number | "">(1);
  const [spools, setSpools] = useState<number | "">(1);
  const [filamentCostPerKg, setFilamentCostPerKg] = useState<number | "">("");
  const [filamentLocation, setFilamentLocation] = useState("");
  const [filamentThreshold, setFilamentThreshold] = useState<number | "">(2);
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [filamentLoading, setFilamentLoading] = useState(false);
  const [filamentError, setFilamentError] = useState("");

  const [otherName, setOtherName] = useState("");
  const [otherKind, setOtherKind] = useState("OTHER");
  const [otherQty, setOtherQty] = useState<number | "">(0);
  const [otherThreshold, setOtherThreshold] = useState<number | "">(2);
  const [otherLocation, setOtherLocation] = useState("");
  const [otherUnitCost, setOtherUnitCost] = useState<number | "">("");
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherError, setOtherError] = useState("");

  const filamentItems = consumables.filter((c) => c.kind === "FILAMENT");
  const otherItems = consumables.filter((c) => c.kind !== "FILAMENT");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editFilament, setEditFilament] = useState<ThreeDConsumable | null>(null);
  const [adjustFilament, setAdjustFilament] = useState<ThreeDConsumable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ThreeDConsumable | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filamentItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filamentItems.map((c) => c.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const refresh = useCallback(() => router.refresh(), [router]);

  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: "quantity" | "location"; value: string } | null>(null);
  const handleInlineSave = async (id: string, field: "quantity" | "location", value: string) => {
    if (!value.trim() && field === "location") {
      setInlineEdit(null);
      return;
    }
    const num = field === "quantity" ? Math.max(0, parseInt(value, 10) || 0) : undefined;
    const payload = field === "quantity" ? { quantity: num } : { location: value.trim() || null };
    const res = await fetch(`/api/admin/3d-consumables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setInlineEdit(null);
    if (res.ok) {
      showToast("Saved");
      refresh();
    }
  };

  const filamentModalOpen = addModalOpen || editFilament !== null;
  const isEditMode = editFilament !== null;

  const resetFormToAddDefaults = () => {
    setMaterialOption("PLA");
    setMaterialOther("");
    setColourHex("#1f2937");
    setColourName("");
    setBrand("");
    setWeightPerSpool(1);
    setWeightCustomKg(1);
    setSpools(1);
    setFilamentCostPerKg("");
    setFilamentLocation("");
    setFilamentThreshold(2);
    setNotes("");
    setNotesOpen(false);
    setFilamentError("");
  };

  const openAddModal = () => {
    setFilamentError("");
    setEditFilament(null);
    resetFormToAddDefaults();
    setAddModalOpen(true);
  };

  const openEditModal = (c: ThreeDConsumable) => {
    setFilamentError("");
    setEditFilament(c);
    setAddModalOpen(false);
    const matMatch = MATERIAL_OPTIONS.includes(c.name as (typeof MATERIAL_OPTIONS)[number]);
    setMaterialOption(matMatch ? c.name : "Other");
    setMaterialOther(matMatch ? "" : c.name);
    setColourHex("#1f2937");
    setColourName(c.specification ?? "");
    setBrand("");
    setWeightPerSpool(1);
    setWeightCustomKg(1);
    setSpools(c.quantity);
    setFilamentCostPerKg(c.costPerKgKes ?? "");
    setFilamentLocation(c.location ?? "");
    setFilamentThreshold(c.lowStockThreshold);
    setNotes("");
    setNotesOpen(false);
  };

  const closeFilamentModal = () => {
    setAddModalOpen(false);
    setEditFilament(null);
  };

  const weightKg = weightPerSpool === "custom" ? (Number(weightCustomKg) || 0) : weightPerSpool;
  const totalWeightKg = (Number(spools) || 0) * weightKg;
  const totalStockValueKes = totalWeightKg * (Number(filamentCostPerKg) || 0);
  const materialNameForApi = materialOption === "Other" ? materialOther.trim() : materialOption;
  const canSubmitFilament = materialNameForApi.length > 0 && (filamentCostPerKg !== "" && Number(filamentCostPerKg) >= 0);

  const handleFilamentSubmit = async () => {
    if (isEditMode && editFilament) {
      setFilamentLoading(true);
      try {
        const res = await fetch(`/api/admin/3d-consumables/${editFilament.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: materialNameForApi,
            specification: colourName.trim() || null,
            quantity: Number(spools) || 0,
            lowStockThreshold: Number(filamentThreshold) || 2,
            location: filamentLocation.trim() || null,
            costPerKgKes: filamentCostPerKg === "" ? null : Number(filamentCostPerKg),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFilamentError(typeof data.error === "string" ? data.error : "Failed to update");
          return;
        }
        setFilamentError("");
        closeFilamentModal();
        showToast("Filament updated successfully");
        refresh();
      } finally {
        setFilamentLoading(false);
      }
      return;
    }
    setFilamentLoading(true);
    try {
      const q = Number(spools);
      if (q < 0) {
        setFilamentError("Quantity must be 0 or more.");
        setFilamentLoading(false);
        return;
      }
      const costKg = Number(filamentCostPerKg);
      if (filamentCostPerKg === "" || costKg < 0) {
        setFilamentError("Cost per kg (KES) is required and must be ≥ 0.");
        setFilamentLoading(false);
        return;
      }
      const res = await fetch("/api/admin/3d-consumables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "FILAMENT",
          name: materialNameForApi,
          specification: colourName.trim() || undefined,
          quantity: q,
          lowStockThreshold: Number(filamentThreshold) || 2,
          location: filamentLocation.trim() || undefined,
          costPerKgKes: costKg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFilamentError(typeof data.error === "string" ? data.error : "Failed to add.");
        setFilamentLoading(false);
        return;
      }
      const newId = data.id as string;
      closeFilamentModal();
      showToast(`${materialNameForApi} ${colourName.trim() ? colourName.trim() : ""} added to inventory`.trim());
      setLastAddedId(newId);
      refresh();
      setTimeout(() => setLastAddedId(null), 2500);
    } finally {
      setFilamentLoading(false);
    }
  };

  const [adjustTab, setAdjustTab] = useState<"add" | "remove">("add");
  const [adjustQty, setAdjustQty] = useState<number | "">(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);
  const openAdjustModal = (c: ThreeDConsumable) => {
    setAdjustFilament(c);
    setAdjustTab("add");
    setAdjustQty(0);
    setAdjustReason("");
  };
  const closeAdjustModal = () => setAdjustFilament(null);
  const newStockAfterAdjust = adjustFilament
    ? adjustTab === "add"
      ? adjustFilament.quantity + (Number(adjustQty) || 0)
      : Math.max(0, adjustFilament.quantity - (Number(adjustQty) || 0))
    : 0;
  const handleSaveAdjust = async () => {
    if (!adjustFilament) return;
    const delta = Number(adjustQty) || 0;
    if (delta <= 0) return;
    setAdjustSaving(true);
    try {
      const newQty =
        adjustTab === "add"
          ? adjustFilament.quantity + delta
          : Math.max(0, adjustFilament.quantity - delta);
      const res = await fetch(`/api/admin/3d-consumables/${adjustFilament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) {
        setFilamentError("Failed to update stock");
        return;
      }
      closeAdjustModal();
      showToast("Stock updated successfully");
      refresh();
    } finally {
      setAdjustSaving(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/3d-consumables/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        setFilamentError("Failed to delete");
        setDeleteTarget(null);
        return;
      }
      showToast(`${deleteTarget.name} ${deleteTarget.specification ?? ""} deleted`.trim());
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      refresh();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleteLoading(true);
    setBulkDeleteConfirm(false);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/3d-consumables/${id}`, { method: "DELETE" });
      }
      showToast(`${selectedIds.size} item(s) deleted`);
      clearSelection();
      refresh();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddOther = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtherError("");
    if (!otherName.trim()) {
      setOtherError("Item name is required.");
      return;
    }
    const q = Number(otherQty);
    if (q < 0) {
      setOtherError("Quantity must be 0 or more.");
      return;
    }
    setOtherLoading(true);
    try {
      const res = await fetch("/api/admin/3d-consumables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: otherKind,
          name: otherName.trim(),
          quantity: q,
          lowStockThreshold: Number(otherThreshold) || 2,
          location: otherLocation.trim() || undefined,
          unitCostKes:
            otherUnitCost === "" ? undefined : Number(otherUnitCost),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtherError(typeof data.error === "string" ? data.error : "Failed to add.");
        return;
      }
      setOtherName("");
      setOtherQty(0);
      setOtherThreshold(2);
      setOtherLocation("");
      setOtherUnitCost("");
      setShowOtherForm(false);
      router.refresh();
    } finally {
      setOtherLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">3D printing inventory</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track filament and other 3D consumables. For printers and hardware use the Hardware tab above.
        </p>
        <div className="flex gap-2 border-b border-border pt-2">
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                subTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {subTab === "filament" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={openAddModal}>
                Add filament
              </Button>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm">
                <span className="font-medium">{selectedIds.size} item(s) selected</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const first = filamentItems.find((f) => selectedIds.has(f.id));
                    if (first) openAdjustModal(first);
                  }}
                >
                  Adjust stock
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setBulkDeleteConfirm(true)} disabled={deleteLoading}>
                  Delete selected
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                  Clear selection
                </Button>
              </div>
            )}
            {filamentItems.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-10 p-4">
                        <input
                          type="checkbox"
                          checked={filamentItems.length > 0 && selectedIds.size === filamentItems.length}
                          onChange={toggleSelectAll}
                          className="rounded border-input"
                        />
                      </th>
                      <th className="text-left p-4 font-medium">Material</th>
                      <th className="text-left p-4 font-medium">Colour / spec</th>
                      <th className="text-right p-4 font-medium">Quantity</th>
                      <th className="text-right p-4 font-medium">Cost/kg (KES)</th>
                      <th className="text-left p-4 font-medium">Location</th>
                      <th className="text-right p-4 font-medium">Low stock</th>
                      <th className="w-10 p-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filamentItems.map((c) => (
                      <tr
                        key={c.id}
                        className={cn(
                          "border-b hover:bg-muted/30 cursor-pointer transition-colors",
                          selectedIds.has(c.id) && "bg-primary/5",
                          lastAddedId === c.id && "bg-green-100 dark:bg-green-900/20"
                        )}
                        onClick={() => openEditModal(c)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleSelect(c.id)}
                            className="rounded border-input"
                          />
                        </td>
                        <td className="p-4 font-medium">{c.name}</td>
                        <td className="p-4">{c.specification ?? "—"}</td>
                        <td
                          className="p-4 text-right"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineEdit({ id: c.id, field: "quantity", value: String(c.quantity) });
                          }}
                        >
                          {inlineEdit?.id === c.id && inlineEdit?.field === "quantity" ? (
                            <Input
                              type="number"
                              min={0}
                              className="h-8 w-20 text-right"
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit((prev) => (prev ? { ...prev, value: e.target.value } : null))}
                              onBlur={() => inlineEdit && handleInlineSave(c.id, "quantity", inlineEdit.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span>{c.quantity}</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {c.costPerKgKes != null ? Number(c.costPerKgKes).toLocaleString() : "—"}
                        </td>
                        <td
                          className="p-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineEdit({ id: c.id, field: "location", value: c.location ?? "" });
                          }}
                        >
                          {inlineEdit?.id === c.id && inlineEdit?.field === "location" ? (
                            <Input
                              className="h-8 min-w-[100px]"
                              value={inlineEdit.value}
                              onChange={(e) => setInlineEdit((prev) => (prev ? { ...prev, value: e.target.value } : null))}
                              onBlur={() => inlineEdit && handleInlineSave(c.id, "location", inlineEdit.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                              }}
                              autoFocus
                            />
                          ) : (
                            <span>{c.location ?? "—"}</span>
                          )}
                        </td>
                        <td className="p-4 text-right">{c.lowStockThreshold}</td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(c)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit filament
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAdjustModal(c)}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Adjust stock
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete filament
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No filament entries yet. Use &quot;Add filament&quot; above.
              </p>
            )}

            {/* Add / Edit filament modal */}
            <Dialog open={filamentModalOpen} onOpenChange={(open) => !open && closeFilamentModal()}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Spool className="h-5 w-5 text-orange-500" />
                    {isEditMode && editFilament
                      ? `Edit Filament — ${editFilament.name} ${editFilament.specification ?? ""}`.trim()
                      : "Add Filament"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {isEditMode ? "Update filament details." : "Add a new filament to your 3D printing inventory."}
                  </p>
                </DialogHeader>
                {filamentError && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                    {filamentError}
                  </p>
                )}
                <div className="space-y-6 py-2">
                  {/* Section 1 — Material & Colour */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Material</Label>
                      <select
                        value={materialOption}
                        onChange={(e) => setMaterialOption(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {MATERIAL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {materialOption === "Other" && (
                        <Input
                          className="mt-1.5"
                          placeholder="Custom material name"
                          value={materialOther}
                          onChange={(e) => setMaterialOther(e.target.value)}
                        />
                      )}
                    </div>
                    <div>
                      <Label>Colour</Label>
                      <div className="mt-1.5 flex items-center gap-3">
                        <input
                          type="color"
                          value={colourHex}
                          onChange={(e) => setColourHex(e.target.value)}
                          className="h-9 w-9 rounded-full border-2 border-border cursor-pointer shrink-0"
                          style={{ padding: 2 }}
                        />
                        <Input
                          placeholder="e.g. Matte Black, Galaxy Purple"
                          value={colourName}
                          onChange={(e) => setColourName(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {PRESET_COLOURS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              setColourHex(preset.hex);
                              setColourName((prev) => prev || preset.name);
                            }}
                            className="h-6 w-6 rounded-full border-2 border-border hover:border-orange-400 shrink-0"
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 2 — Stock details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Brand (optional)</Label>
                      <Input
                        placeholder="e.g. eSUN, Bambu, Polymaker"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Weight per spool</Label>
                      <select
                        value={weightPerSpool === "custom" ? "custom" : String(weightPerSpool)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setWeightPerSpool(v === "custom" ? "custom" : Number(v));
                        }}
                        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        {WEIGHT_OPTIONS.map((opt) => (
                          <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                        ))}
                      </select>
                      {weightPerSpool === "custom" && (
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          placeholder="kg"
                          value={weightCustomKg === "" ? "" : weightCustomKg}
                          onChange={(e) => setWeightCustomKg(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="mt-1.5"
                        />
                      )}
                    </div>
                    <div>
                      <Label>Number of spools</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setSpools((s) => (s === "" ? 0 : Math.max(0, s - 1)))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          value={spools === "" ? "" : spools}
                          onChange={(e) => setSpools(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setSpools((s) => (s === "" ? 1 : s + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Total weight</Label>
                      <p className="mt-1.5 text-sm text-muted-foreground font-medium">
                        {totalWeightKg.toFixed(1)} kg
                      </p>
                    </div>
                  </div>

                  {/* Section 3 — Cost */}
                  <div>
                    <Label>Cost per kg (KES) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={filamentCostPerKg === "" ? "" : filamentCostPerKg}
                      onChange={(e) => setFilamentCostPerKg(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="e.g. 2500"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used by the 3D quote calculator to ensure quotes stay profitable.
                    </p>
                    <div className="mt-2 rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-sm font-medium">
                        Total value: KES {totalStockValueKes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Section 4 — Storage & alerts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Location (optional)</Label>
                      <Input
                        placeholder="e.g. Shelf A3, Cabinet 2"
                        value={filamentLocation}
                        onChange={(e) => setFilamentLocation(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Low stock alert threshold</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setFilamentThreshold((t) => (t === "" ? 0 : Math.max(0, t - 1)))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          value={filamentThreshold === "" ? "" : filamentThreshold}
                          onChange={(e) => setFilamentThreshold(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 2))}
                          className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setFilamentThreshold((t) => (t === "" ? 1 : t + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">spools</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Alert when stock drops to this level.</p>
                    </div>
                  </div>

                  {/* Section 5 — Notes (collapsible) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setNotesOpen((o) => !o)}
                      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      {notesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Add notes
                    </button>
                    {notesOpen && (
                      <Textarea
                        placeholder="Optional notes…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                <DialogFooter className="flex-row justify-between sm:justify-between border-t pt-4">
                  <p className="text-xs text-muted-foreground">* Required fields</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={closeFilamentModal}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleFilamentSubmit}
                      disabled={!canSubmitFilament || filamentLoading}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {filamentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isEditMode ? "Save changes" : "Add filament"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Adjust stock modal */}
            <Dialog open={!!adjustFilament} onOpenChange={(open) => !open && closeAdjustModal()}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adjust stock</DialogTitle>
                  {adjustFilament && (
                    <p className="text-sm text-muted-foreground">
                      Current stock: {adjustFilament.quantity} spools
                    </p>
                  )}
                </DialogHeader>
                {adjustFilament && (
                  <>
                    <div className="flex gap-2 border-b pb-2">
                      <Button variant={adjustTab === "add" ? "default" : "outline"} size="sm" onClick={() => setAdjustTab("add")} className={adjustTab === "add" ? "bg-orange-500" : ""}>
                        + Add stock
                      </Button>
                      <Button variant={adjustTab === "remove" ? "default" : "outline"} size="sm" onClick={() => setAdjustTab("remove")} className={adjustTab === "remove" ? "bg-orange-500" : ""}>
                        − Remove stock
                      </Button>
                    </div>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label>Quantity to {adjustTab === "add" ? "add" : "remove"} (spools)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={adjustQty === "" ? "" : adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="mt-1"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        New stock will be: <strong>{newStockAfterAdjust} spools</strong>
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={closeAdjustModal}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveAdjust} disabled={adjustSaving || (Number(adjustQty) || 0) <= 0} className="bg-orange-500 hover:bg-orange-600">
                        {adjustSaving ? "Saving…" : "Save"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {deleteTarget ? `${deleteTarget.name} ${deleteTarget.specification ?? ""}`.trim() : "filament"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this filament from inventory. Current stock: {deleteTarget?.quantity ?? 0} spools — make sure this is intentional.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteLoading ? "Deleting…" : "Delete filament"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Bulk delete confirmation */}
            <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} selected filament(s)?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the selected items from inventory. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteLoading ? "Deleting…" : "Delete selected"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {toast && (
              <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-background px-4 py-2 text-sm shadow-lg">
                {toast}
              </div>
            )}
          </div>
        )}

        {subTab === "other" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOtherForm((v) => !v)}
              >
                {showOtherForm ? "Cancel" : "Add consumable"}
              </Button>
            </div>
            {showOtherForm && (
              <form
                onSubmit={handleAddOther}
                className="rounded-lg border bg-muted/30 p-4 space-y-4"
              >
                {otherError && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                    {otherError}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Item name</Label>
                    <Input
                      value={otherName}
                      onChange={(e) => setOtherName(e.target.value)}
                      placeholder="e.g. Resin 1L, Nozzle 0.4mm"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select
                      value={otherKind}
                      onChange={(e) => setOtherKind(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="RESIN">Resin</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      value={otherQty === "" ? "" : otherQty}
                      onChange={(e) =>
                        setOtherQty(
                          e.target.value === ""
                            ? ""
                            : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Low stock threshold</Label>
                    <Input
                      type="number"
                      min={0}
                      value={otherThreshold === "" ? "" : otherThreshold}
                      onChange={(e) =>
                        setOtherThreshold(
                          e.target.value === ""
                            ? ""
                            : Math.max(0, parseInt(e.target.value, 10) || 2)
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Cost per unit (KES) optional</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={otherUnitCost === "" ? "" : otherUnitCost}
                      onChange={(e) =>
                        setOtherUnitCost(
                          e.target.value === ""
                            ? ""
                            : Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      placeholder="e.g. 1200"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For margin and profit checks.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Location (optional)</Label>
                    <Input
                      value={otherLocation}
                      onChange={(e) => setOtherLocation(e.target.value)}
                      placeholder="e.g. Storage B"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={otherLoading}>
                  {otherLoading ? "Adding…" : "Add consumable"}
                </Button>
              </form>
            )}
            {otherItems.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Item</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-right p-4 font-medium">Quantity</th>
                      <th className="text-right p-4 font-medium">Cost/unit (KES)</th>
                      <th className="text-left p-4 font-medium">Location</th>
                      <th className="text-right p-4 font-medium">Low stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherItems.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-medium">{c.name}</td>
                        <td className="p-4">{c.kind}</td>
                        <td className="p-4 text-right">{c.quantity}</td>
                        <td className="p-4 text-right">
                          {c.unitCostKes != null
                            ? Number(c.unitCostKes).toLocaleString()
                            : "—"}
                        </td>
                        <td className="p-4">{c.location ?? "—"}</td>
                        <td className="p-4 text-right">{c.lowStockThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No other consumables. Use &quot;Add consumable&quot; above.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
