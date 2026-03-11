"use client";

import { useState, useCallback, useMemo } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Spool,
  Package,
  MoreHorizontal,
  Pencil,
  PackagePlus,
  Trash2,
  Plus,
  Minus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
  ClipboardList,
  Download,
  MapPin,
} from "lucide-react";
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

const MATERIAL_BADGE: Record<string, string> = {
  "PLA+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PETG: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ABS: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  TPU: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  PLA: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Resin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Nylon: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ASA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const FILTER_MATERIALS = ["All", "PLA", "PLA+", "PETG", "ABS", "TPU", "Resin", "Nylon"] as const;
const FILTER_STATUS = ["All", "In Stock", "Low Stock", "Out of Stock"] as const;

type FilamentRow = {
  id: string;
  kind: string;
  name: string;
  specification: string | null;
  colourHex: string | null;
  brand: string | null;
  quantity: number;
  weightPerSpoolKg: number | null;
  lowStockThreshold: number;
  location: string | null;
  costPerKgKes: number | null;
  unitCostKes: number | null;
  notes: string | null;
  totalWeightKg?: number;
  totalValueKes?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};

type ThreeDConsumable = FilamentRow & { kind: string };

/** Accepts API shape where some fields may be missing or null; normalized inside. */
export type ThreeDConsumableInput = {
  id: string;
  kind: string;
  name: string;
  specification?: string | null;
  colourHex?: string | null;
  brand?: string | null;
  quantity: number;
  weightPerSpoolKg?: number | null;
  lowStockThreshold: number;
  location?: string | null;
  costPerKgKes?: number | null;
  unitCostKes?: number | null;
  notes?: string | null;
  totalWeightKg?: number | null;
  totalValueKes?: number | null;
  stockStatus?: string;
};

const TAB_CONFIG = [
  { id: "filament" as const, label: "Filament", icon: Spool },
  { id: "other" as const, label: "Other consumables", icon: Package },
];

export function Inventory3DSection({
  consumables,
}: {
  consumables: ThreeDConsumableInput[];
}) {
  const normalized = useMemo(
    () =>
      consumables.map((c) => ({
        ...c,
        specification: c.specification ?? null,
        colourHex: c.colourHex ?? null,
        brand: c.brand ?? null,
        weightPerSpoolKg: c.weightPerSpoolKg ?? null,
        location: c.location ?? null,
        costPerKgKes: c.costPerKgKes ?? null,
        unitCostKes: c.unitCostKes ?? null,
        notes: c.notes ?? null,
      })) as ThreeDConsumable[],
    [consumables]
  );
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

  const filamentItems = normalized.filter((c) => c.kind === "FILAMENT") as FilamentRow[];
  const otherItems = normalized.filter((c) => c.kind !== "FILAMENT");

  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [brandFilter, setBrandFilter] = useState<string>("All");

  const filteredFilaments = useMemo(() => {
    let list = filamentItems;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.specification?.toLowerCase().includes(q)) ||
          (c.brand?.toLowerCase().includes(q))
      );
    }
    if (materialFilter !== "All") {
      list = list.filter((c) => c.name === materialFilter);
    }
    if (statusFilter !== "All") {
      const status = statusFilter === "In Stock" ? "IN_STOCK" : statusFilter === "Low Stock" ? "LOW_STOCK" : "OUT_OF_STOCK";
      list = list.filter((c) => c.stockStatus === status);
    }
    if (brandFilter !== "All") {
      list = list.filter((c) => (c.brand ?? "") === brandFilter);
    }
    return list;
  }, [filamentItems, searchQuery, materialFilter, statusFilter, brandFilter]);

  const filamentsByMaterial = useMemo(() => {
    const map = new Map<string, FilamentRow[]>();
    for (const c of filteredFilaments) {
      const key = c.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredFilaments]);

  const summary = useMemo(() => {
    const items = filamentItems;
    const count = items.length;
    const totalSpools = items.reduce((s, c) => s + c.quantity, 0);
    const totalKg = items.reduce((s, c) => s + (c.totalWeightKg ?? c.quantity * (c.weightPerSpoolKg ?? 1)), 0);
    const totalValue = items.reduce((s, c) => s + (c.totalValueKes ?? 0), 0);
    const lowStockCount = items.filter((c) => c.stockStatus === "LOW_STOCK" || c.stockStatus === "OUT_OF_STOCK").length;
    return { count, totalSpools, totalKg, totalValue, lowStockCount };
  }, [filamentItems]);

  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    filamentItems.forEach((c) => {
      if (c.brand?.trim()) set.add(c.brand.trim());
    });
    return ["All", ...Array.from(set).sort()];
  }, [filamentItems]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editFilament, setEditFilament] = useState<ThreeDConsumable | null>(null);
  const [adjustFilament, setAdjustFilament] = useState<ThreeDConsumable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ThreeDConsumable | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const s = localStorage.getItem("filament-group-collapsed");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });
  const toggleGroup = useCallback((material: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(material)) next.delete(material);
      else next.add(material);
      try {
        localStorage.setItem("filament-group-collapsed", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const [addStockTarget, setAddStockTarget] = useState<ThreeDConsumable | null>(null);
  const [movementsTarget, setMovementsTarget] = useState<ThreeDConsumable | null>(null);
  const [movementsList, setMovementsList] = useState<Array<{ id: string; type: string; quantity: number; performedBy: string; reference: string | null; createdAt: string }>>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const [addStockSpools, setAddStockSpools] = useState<number>(1);
  const [addStockCostPerKg, setAddStockCostPerKg] = useState<number | "">("");
  const [addStockSupplier, setAddStockSupplier] = useState("");
  const [addStockReference, setAddStockReference] = useState("");
  const [addStockNotes, setAddStockNotes] = useState("");
  const [addStockSaving, setAddStockSaving] = useState(false);
  const [bulkLocationOpen, setBulkLocationOpen] = useState(false);
  const [bulkLocationValue, setBulkLocationValue] = useState("");
  const [bulkLocationSaving, setBulkLocationSaving] = useState(false);

  const openAddStockModal = useCallback((c: ThreeDConsumable) => {
    setAddStockTarget(c);
    setAddStockSpools(1);
    setAddStockCostPerKg(c.costPerKgKes ?? "");
    setAddStockSupplier("");
    setAddStockReference("");
    setAddStockNotes("");
  }, []);

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleAddStockSubmit = useCallback(async () => {
    if (!addStockTarget) return;
    const qty = Math.max(0, addStockSpools);
    if (qty === 0) return;
    setAddStockSaving(true);
    try {
      const res = await fetch(`/api/admin/3d-consumables/${addStockTarget.id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECEIVED",
          quantity: qty,
          costPerKgKes: addStockCostPerKg === "" ? null : Number(addStockCostPerKg),
          supplier: addStockSupplier.trim() || null,
          reference: addStockReference.trim() || null,
          notes: addStockNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(typeof data.error === "string" ? data.error : "Failed to add stock");
        return;
      }
      setAddStockTarget(null);
      showToast("Stock added");
      refresh();
    } finally {
      setAddStockSaving(false);
    }
  }, [addStockTarget, addStockSpools, addStockCostPerKg, addStockSupplier, addStockReference, addStockNotes, refresh, showToast]);

  const handleBulkSetLocation = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLocationSaving(true);
    try {
      const location = bulkLocationValue.trim() || null;
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/3d-consumables/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location }),
          })
        )
      );
      setBulkLocationOpen(false);
      setBulkLocationValue("");
      showToast("Location updated");
      refresh();
    } finally {
      setBulkLocationSaving(false);
    }
  }, [selectedIds, bulkLocationValue, refresh, showToast]);

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
    setColourHex(c.colourHex && /^#[0-9A-Fa-f]{6}$/.test(c.colourHex) ? c.colourHex : "#1f2937");
    setColourName(c.specification ?? "");
    setBrand(c.brand ?? "");
    const w = c.weightPerSpoolKg ?? 1;
    const wOpt = WEIGHT_OPTIONS.find((o) => o.value === w);
    setWeightPerSpool(wOpt ? w : "custom");
    setWeightCustomKg(wOpt ? 1 : w);
    setSpools(c.quantity);
    setFilamentCostPerKg(c.costPerKgKes ?? "");
    setFilamentLocation(c.location ?? "");
    setFilamentThreshold(c.lowStockThreshold);
    setNotes(c.notes ?? "");
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
            colourHex: colourHex.trim() || null,
            brand: brand.trim() || null,
            quantity: Number(spools) || 0,
            weightPerSpoolKg: weightKg || null,
            lowStockThreshold: Number(filamentThreshold) || 2,
            location: filamentLocation.trim() || null,
            costPerKgKes: filamentCostPerKg === "" ? null : Number(filamentCostPerKg),
            notes: notes.trim() || null,
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
          colourHex: colourHex.trim() || undefined,
          brand: brand.trim() || undefined,
          quantity: q,
          weightPerSpoolKg: weightKg || undefined,
          lowStockThreshold: Number(filamentThreshold) || 2,
          location: filamentLocation.trim() || undefined,
          costPerKgKes: costKg,
          notes: notes.trim() || undefined,
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
      const isAdd = adjustTab === "add";
      const movementQty = isAdd ? delta : -delta;
      const newQty = isAdd ? adjustFilament.quantity + delta : Math.max(0, adjustFilament.quantity - delta);
      const res = await fetch(`/api/admin/3d-consumables/${adjustFilament.id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isAdd ? "RECEIVED" : "ADJUSTMENT",
          quantity: movementQty,
          notes: adjustReason.trim() || null,
        }),
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
      for (const id of Array.from(selectedIds)) {
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
            {/* Page header: title + primary action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">3D Printing — Filaments</h2>
              <Button type="button" onClick={openAddModal} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Filament
              </Button>
            </div>

            {/* Summary KPI cards */}
            {filamentItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Filaments in stock</p>
                  <p className="text-xl font-semibold">{summary.count}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Total spools</p>
                  <p className="text-xl font-semibold">{summary.totalSpools}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Total weight</p>
                  <p className="text-xl font-semibold">{summary.totalKg.toFixed(1)} kg</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Total value</p>
                  <p className="text-xl font-semibold">KES {Math.round(summary.totalValue).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Low stock warning bar */}
            {summary.lowStockCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2 text-sm">
                <span className="text-amber-700 dark:text-amber-400">⚠ {summary.lowStockCount} filament{summary.lowStockCount !== 1 ? "s" : ""} below low stock threshold</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-amber-800 dark:text-amber-300 h-auto p-0"
                  onClick={() => setStatusFilter("Low Stock")}
                >
                  View
                </Button>
              </div>
            )}

            {/* Search + filters */}
            {filamentItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by material, colour, brand…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <select
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {FILTER_MATERIALS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {FILTER_STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm">
                <span className="font-medium">{selectedIds.size} filament{selectedIds.size !== 1 ? "s" : ""} selected</span>
                <Button type="button" variant="outline" size="sm" onClick={() => { setBulkLocationValue(""); setBulkLocationOpen(true); }}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Set Location
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { const f = filamentItems.find((f) => selectedIds.has(f.id)); if (f) openAddStockModal(f); }}>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Add Stock
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { const first = filamentItems.find((f) => selectedIds.has(f.id)); if (first) openAdjustModal(first); }}>
                  Adjust stock
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { const ids = filamentItems.filter((f) => selectedIds.has(f.id)); if (ids.length) { const csv = ["Material,Brand,Colour,Spools,Weight (kg),Cost/kg (KES),Value (KES),Location,Status"]; ids.forEach((c) => { const w = c.totalWeightKg ?? (c.quantity * (c.weightPerSpoolKg ?? 1)); const v = c.totalValueKes ?? w * (c.costPerKgKes ?? 0); csv.push([c.name, c.brand ?? "", c.specification ?? "", c.quantity, w.toFixed(1), (c.costPerKgKes ?? 0).toLocaleString(), Math.round(v).toLocaleString(), c.location ?? "", c.stockStatus ?? ""].join(",")); }); const blob = new Blob([csv.join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "filaments-export.csv"; a.click(); URL.revokeObjectURL(a.href); showToast("CSV exported"); } }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setBulkDeleteConfirm(true)} disabled={deleteLoading}>
                  Delete selected
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
              </div>
            )}

            {/* Table: grouped by material */}
            {filteredFilaments.length > 0 ? (
              <div className="space-y-2">
                {filamentsByMaterial.map(([material, rows]) => {
                  const isCollapsed = collapsedGroups.has(material);
                  const groupSpools = rows.reduce((s, c) => s + c.quantity, 0);
                  const groupKg = rows.reduce((s, c) => s + (c.totalWeightKg ?? c.quantity * (c.weightPerSpoolKg ?? 1)), 0);
                  const groupValue = rows.reduce((s, c) => s + (c.totalValueKes ?? 0), 0);
                  return (
                    <div key={material} className="rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 bg-muted/50 hover:bg-muted/70 px-4 py-2.5 text-left font-medium text-sm"
                        onClick={() => toggleGroup(material)}
                      >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {material} — {rows.length} {rows.length === 1 ? "entry" : "entries"} · {groupSpools} spools · {groupKg.toFixed(1)} kg · KES {Math.round(groupValue).toLocaleString()}
                      </button>
                      {!isCollapsed && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/30">
                                <th className="w-10 p-3"><input type="checkbox" checked={rows.every((c) => selectedIds.has(c.id))} onChange={() => rows.forEach((c) => toggleSelect(c.id))} className="rounded border-input" /></th>
                                <th className="w-12 p-3 font-medium">Colour</th>
                                <th className="p-3 font-medium">Material</th>
                                <th className="p-3 font-medium w-[120px]">Brand</th>
                                <th className="p-3 font-medium w-[100px]">Colour/Spec</th>
                                <th className="p-3 font-medium text-right">Stock</th>
                                <th className="p-3 font-medium text-right">Cost/kg</th>
                                <th className="p-3 font-medium text-right">Value</th>
                                <th className="p-3 font-medium">Location</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="w-10 p-3" />
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((c) => {
                                const weightKg = c.totalWeightKg ?? c.quantity * (c.weightPerSpoolKg ?? 1);
                                const status = c.stockStatus ?? (c.quantity === 0 ? "OUT_OF_STOCK" : c.quantity <= c.lowStockThreshold ? "LOW_STOCK" : "IN_STOCK");
                                const statusLabel = status === "OUT_OF_STOCK" ? "Out of Stock" : status === "LOW_STOCK" ? "Low Stock" : "In Stock";
                                const statusClass = status === "OUT_OF_STOCK" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : status === "LOW_STOCK" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
                                const matClass = MATERIAL_BADGE[c.name] ?? MATERIAL_BADGE.Other;
                                const hex = c.colourHex && /^#[0-9A-Fa-f]{6}$/.test(c.colourHex) ? c.colourHex : "#6b7280";
                                return (
                                  <tr
                                    key={c.id}
                                    className={cn(
                                      "border-b hover:bg-muted/20 cursor-pointer transition-colors",
                                      selectedIds.has(c.id) && "bg-primary/5",
                                      lastAddedId === c.id && "bg-green-100 dark:bg-green-900/20"
                                    )}
                                    onClick={() => openEditModal(c)}
                                  >
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-input" />
                                    </td>
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                      <span
                                        className="inline-block w-5 h-5 rounded-full shrink-0 border border-black/10"
                                        style={{ backgroundColor: hex }}
                                        title={hex}
                                      />
                                    </td>
                                    <td className="p-3">
                                      <Badge variant="secondary" className={cn("font-normal", matClass)}>{c.name}</Badge>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{c.brand ?? "—"}</td>
                                    <td className="p-3">{c.specification ?? "—"}</td>
                                    <td className="p-3 text-right">
                                      <span>{c.quantity} spool{c.quantity !== 1 ? "s" : ""}</span>
                                      <span className="block text-xs text-muted-foreground">{weightKg.toFixed(1)} kg</span>
                                    </td>
                                    <td className="p-3 text-right">{c.costPerKgKes != null ? `KES ${Number(c.costPerKgKes).toLocaleString()}` : "—"}</td>
                                    <td className="p-3 text-right text-muted-foreground">{c.totalValueKes != null ? `KES ${Math.round(c.totalValueKes).toLocaleString()}` : "—"}</td>
                                    <td
                                      className="p-3"
                                      onClick={(e) => { e.stopPropagation(); setInlineEdit({ id: c.id, field: "location", value: c.location ?? "" }); }}
                                    >
                                      {inlineEdit?.id === c.id && inlineEdit?.field === "location" ? (
                                        <div className="flex items-center gap-1">
                                          <Input className="h-8 min-w-[80px]" value={inlineEdit.value} onChange={(e) => setInlineEdit((p) => (p ? { ...p, value: e.target.value } : null))} onBlur={() => inlineEdit && handleInlineSave(c.id, "location", inlineEdit.value)} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} autoFocus />
                                        </div>
                                      ) : c.location?.trim() ? (
                                        <span>{c.location}</span>
                                      ) : (
                                        <button type="button" className="text-muted-foreground hover:text-foreground text-xs underline">+ Add location</button>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <span title={`Threshold: ${c.lowStockThreshold} spools`} className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusClass)}>{statusLabel}</span>
                                    </td>
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => openAddStockModal(c)}><PackagePlus className="mr-2 h-4 w-4" /> Add Stock</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openAdjustModal(c)}><Minus className="mr-2 h-4 w-4" /> Use / Adjust</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openEditModal(c)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => { setMovementsTarget(c); setMovementsList([]); setMovementsLoading(true); try { const r = await fetch(`/api/admin/3d-consumables/${c.id}/movements`); const data = await r.json(); setMovementsList(Array.isArray(data) ? data : []); } finally { setMovementsLoading(false); } }}><ClipboardList className="mr-2 h-4 w-4" /> View Movements</DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : filamentItems.length > 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No filaments match the current filters.</p>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No filament entries yet. Use &quot;Add Filament&quot; above.</p>
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
                        <Label htmlFor="adjust-stock-qty">Quantity to {adjustTab === "add" ? "add" : "remove"} (spools)</Label>
                        <Input
                          id="adjust-stock-qty"
                          type="number"
                          min={0}
                          value={adjustQty === "" ? "" : adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="mt-1"
                          aria-label={`Quantity to ${adjustTab === "add" ? "add" : "remove"} (spools)`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjust-reason">Reason / notes (optional)</Label>
                        <Input id="adjust-reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Damaged spool, received delivery" className="mt-1" />
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

            {/* Add Stock modal */}
            <Dialog open={!!addStockTarget} onOpenChange={(open) => !open && setAddStockTarget(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Stock — {addStockTarget ? `${addStockTarget.name} ${addStockTarget.specification ?? ""}`.trim() : ""}</DialogTitle>
                </DialogHeader>
                {addStockTarget && (
                  <>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label>Spools received</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setAddStockSpools((s) => Math.max(0, s - 1))}>−</Button>
                          <Input type="number" min={0} value={addStockSpools} onChange={(e) => setAddStockSpools(Math.max(0, parseInt(e.target.value, 10) || 0))} className="w-20 text-center" />
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setAddStockSpools((s) => s + 1)}>+</Button>
                        </div>
                      </div>
                      <div>
                        <Label>Cost per kg (KES)</Label>
                        <Input type="number" min={0} value={addStockCostPerKg === "" ? "" : addStockCostPerKg} onChange={(e) => setAddStockCostPerKg(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))} className="mt-1" placeholder="e.g. 3000" />
                        <p className="text-xs text-muted-foreground mt-1">Update cost? Current: KES {(addStockTarget.costPerKgKes ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label>Supplier (optional)</Label>
                        <Input value={addStockSupplier} onChange={(e) => setAddStockSupplier(e.target.value)} placeholder="e.g. eSUN" className="mt-1" />
                      </div>
                      <div>
                        <Label>Reference / PO # (optional)</Label>
                        <Input value={addStockReference} onChange={(e) => setAddStockReference(e.target.value)} placeholder="PO-2026-001" className="mt-1" />
                      </div>
                      <div>
                        <Label>Notes (optional)</Label>
                        <Input value={addStockNotes} onChange={(e) => setAddStockNotes(e.target.value)} placeholder="Optional notes" className="mt-1" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        New total after adding: <strong>{addStockTarget.quantity + addStockSpools} spools</strong> ({(addStockTarget.quantity + addStockSpools) * (addStockTarget.weightPerSpoolKg ?? 1)} kg)
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddStockTarget(null)}>Cancel</Button>
                      <Button onClick={handleAddStockSubmit} disabled={addStockSaving || addStockSpools <= 0} className="bg-orange-500 hover:bg-orange-600">
                        {addStockSaving ? "Adding…" : "Add Stock"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* View Movements sheet */}
            <Sheet open={!!movementsTarget} onOpenChange={(open) => !open && setMovementsTarget(null)}>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Stock Movements — {movementsTarget ? `${movementsTarget.name} ${movementsTarget.specification ?? ""}`.trim() : ""}</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  {movementsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : movementsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No movements yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Date</th>
                          <th className="text-left py-2 font-medium">Type</th>
                          <th className="text-right py-2 font-medium">Qty</th>
                          <th className="text-left py-2 font-medium">By</th>
                          <th className="text-left py-2 font-medium">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movementsList.map((m) => (
                          <tr key={m.id} className="border-b">
                            <td className="py-2">{new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                            <td className="py-2">{m.type}</td>
                            <td className="py-2 text-right">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                            <td className="py-2">{m.performedBy}</td>
                            <td className="py-2 text-muted-foreground">{m.reference ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Bulk Set Location modal */}
            <Dialog open={bulkLocationOpen} onOpenChange={setBulkLocationOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Set location for {selectedIds.size} filament{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  <Label>Location</Label>
                  <Input value={bulkLocationValue} onChange={(e) => setBulkLocationValue(e.target.value)} placeholder="e.g. Shelf A3" className="mt-1" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkLocationOpen(false)}>Cancel</Button>
                  <Button onClick={handleBulkSetLocation} disabled={bulkLocationSaving}>{bulkLocationSaving ? "Saving…" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {deleteTarget ? `${deleteTarget.name} ${deleteTarget.specification ?? ""}`.trim() : "filament"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove {deleteTarget ? `${deleteTarget.name} ${deleteTarget.specification ?? ""}`.trim() : "this filament"} from inventory. Any reserved stock will be released.
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
