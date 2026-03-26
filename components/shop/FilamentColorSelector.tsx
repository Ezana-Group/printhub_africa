"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorSwatch {
  id: string;
  name: string;
  hexCode: string;
  isAvailable: boolean;
}

interface Props {
  productSlug: string;
  selectedColorId?: string;
  onColorSelect: (color: ColorSwatch) => void;
}

export function FilamentColorSelector({ productSlug, selectedColorId, onColorSelect }: Props) {
  const [colors, setColors] = useState<ColorSwatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productSlug}/colors`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setColors(data);
          // Auto-select first available colour if none selected
          if (!selectedColorId && data.length > 0) {
            const firstAvailable = data.find(c => c.isAvailable) || data[0];
            onColorSelect(firstAvailable);
          }
        }
      })
      .catch(() => setColors([]))
      .finally(() => setLoading(false));
  }, [productSlug, selectedColorId, onColorSelect]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (colors.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900">
          Available Colours: <span className="text-primary font-bold ml-1">{colors.find(c => c.id === selectedColorId)?.name || "Select"}</span>
        </label>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = color.id === selectedColorId;
          const isAvailable = color.isAvailable;

          return (
            <button
              key={color.id}
              onClick={() => isAvailable && onColorSelect(color)}
              disabled={!isAvailable}
              className={cn(
                "group relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ring-offset-2",
                isSelected ? "ring-2 ring-primary scale-110" : "hover:scale-105",
                !isAvailable && "opacity-40 cursor-not-allowed grayscale"
              )}
              title={isAvailable ? color.name : `${color.name} (Out of stock)`}
            >
              <span
                className="h-full w-full rounded-full border border-slate-200 shadow-inner"
                style={{ backgroundColor: color.hexCode }}
              />
              {isSelected && (
                <Check className="absolute h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              )}
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1.5px] bg-slate-400 rotate-45 transform" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-[11px] text-slate-500 italic">
        * Note: Printed colours may vary slightly from screen representation.
      </p>
    </div>
  );
}
