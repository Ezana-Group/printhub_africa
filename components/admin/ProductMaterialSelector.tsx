"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

interface Consumable {
  id: string;
  name: string;
  kind: string;
  brand: string;
  colourHex: string | null;
  specification: string | null;
  quantity: number;
}

interface ProductMaterial {
  id: string;
  productId: string;
  consumableId: string;
  isDefault: boolean;
  consumable: Consumable;
}

interface ProductMaterialSelectorProps {
  productId: string;
}

export function ProductMaterialSelector({ productId }: ProductMaterialSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState<Consumable[]>([]);
  const [selected, setSelected] = useState<{ consumableId: string; isDefault: boolean }[]>([]);

  useEffect(() => {
    async function load() {
      if (!productId || productId === "new") {
         setLoading(false);
         return;
      }
      try {
        const [availRes, currentRes] = await Promise.all([
          fetch("/api/admin/inventory/3d-consumables/available"),
          fetch(`/api/admin/products/${productId}/materials`),
        ]);

        if (availRes.ok && currentRes.ok) {
          const availData = await availRes.json();
          const currentData: ProductMaterial[] = await currentRes.json();
          setAvailable(availData);
          setSelected(currentData.map(m => ({ consumableId: m.consumableId, isDefault: m.isDefault })));
        }
      } catch (e) {
        console.error("Load materials error:", e);
        toast.error("Failed to load materials data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const handleToggle = (id: string) => {
    setSelected(prev => {
      const exists = prev.find(m => m.consumableId === id);
      let next;
      if (exists) {
        next = prev.filter(m => m.consumableId !== id);
      } else {
        next = [...prev, { consumableId: id, isDefault: prev.length === 0 }];
      }
      saveMaterials(next);
      return next;
    });
  };

  const handleSetDefault = (id: string) => {
    setSelected(prev => {
      const next = prev.map(m => ({
        ...m,
        isDefault: m.consumableId === id
      }));
      saveMaterials(next);
      return next;
    });
  };

  const saveMaterials = async (materials: { consumableId: string; isDefault: boolean }[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/materials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Syncing materials...", { duration: 1000, position: "top-center" });
    } catch {
      toast.error("Failed to sync materials");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!productId || productId === "new") return <div className="p-4 text-sm text-muted-foreground italic">Save the product first to manage materials.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Printable Materials</h3>
          <p className="text-xs text-muted-foreground">Select materials available for this product. Changes are saved automatically.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-primary font-medium text-xs animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving changes...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {available.map((c) => {
          const isSel = selected.find(m => m.consumableId === c.id);
          const isDef = isSel?.isDefault;

          return (
            <div 
              key={c.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isSel ? "bg-primary/5 border-primary/20" : "bg-white border-muted-foreground/10 hover:border-primary/20"
              }`}
            >
              <Checkbox 
                id={`mat-${c.id}`} 
                checked={!!isSel} 
                onCheckedChange={() => handleToggle(c.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{c.kind}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{c.brand}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className={`text-[11px] ${c.quantity < 5 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                    Stock: {c.quantity}
                  </span>
                </div>
              </div>
              {c.colourHex && (
                <div className="flex items-center gap-2">
                  {c.specification && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      {c.specification}
                    </span>
                  )}
                  <div 
                    className="h-5 w-5 rounded-full border border-black/10 shadow-sm" 
                    style={{ backgroundColor: c.colourHex }}
                    title={`Color: ${c.specification || c.colourHex}`}
                  />
                </div>
              )}
              {isSel && (
                <Button 
                  size="sm" 
                  variant={isDef ? "default" : "secondary"} 
                  className="h-7 px-2 text-[10px]"
                  onClick={() => handleSetDefault(c.id)}
                >
                  {isDef ? <><Check className="mr-1 h-3 w-3" /> Default</> : "Set Default"}
                </Button>
              )}
            </div>
          );
        })}
        {available.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            No materials with stock &gt; 0 found.
          </div>
        )}
      </div>
    </div>
  );
}
