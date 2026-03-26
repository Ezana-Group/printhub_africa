"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Consumable {
  id: string;
  name: string;
  colourHex: string | null;
}

interface Props {
  consumables: Consumable[];
  selectedConsumableId?: string;
  onConsumableSelect: (consumable: Consumable) => void;
}

export function ConsumableColorSelector({ 
  consumables, 
  selectedConsumableId, 
  onConsumableSelect 
}: Props) {
  if (consumables.length === 0) return null;

  // Filter out consumables without hex colors
  const itemsWithColor = consumables.filter(c => !!c.colourHex);
  if (itemsWithColor.length === 0) return null;

  const selectedConsumable = consumables.find(c => c.id === selectedConsumableId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900">
          Color: <span className="text-secondary font-bold ml-1">
            {selectedConsumable?.name || "Select Color"}
          </span>
        </label>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {itemsWithColor.map((item) => {
          const isSelected = item.id === selectedConsumableId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onConsumableSelect(item)}
              className={cn(
                "group relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ring-offset-2",
                isSelected ? "ring-2 ring-primary scale-110 shadow-md" : "hover:scale-105 hover:shadow-sm"
              )}
              title={item.name}
            >
              <span
                className="h-full w-full rounded-full border border-slate-200 shadow-inner"
                style={{ backgroundColor: item.colourHex! }}
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
