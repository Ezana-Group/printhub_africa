"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorOption {
  hex: string;
  name: string;
}

interface Props {
  colors: ColorOption[];
  selectedColorHex?: string;
  onColorSelect: (hex: string) => void;
}

export function ConsumableColorSelector({ 
  colors, 
  selectedColorHex, 
  onColorSelect 
}: Props) {
  if (colors.length === 0) return null;

  const selectedColor = colors.find(c => c.hex === selectedColorHex);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900">
          Colour: <span className="text-secondary font-bold ml-1">
            {selectedColor?.name || "Select Colour"}
          </span>
        </label>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = color.hex === selectedColorHex;

          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => onColorSelect(color.hex)}
              className={cn(
                "group relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ring-offset-2",
                isSelected ? "ring-2 ring-primary scale-110 shadow-md" : "hover:scale-105 hover:shadow-sm"
              )}
              title={color.name}
            >
              <span
                className="h-full w-full rounded-full border border-slate-200 shadow-inner"
                style={{ backgroundColor: color.hex }}
              />
              {isSelected && (
                <Check className="absolute h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
