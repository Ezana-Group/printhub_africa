"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  name: string;
  kind: string;
  colourHex: string | null;
  isDefault: boolean;
}

interface Props {
  materials: Material[];
  selectedMaterialId?: string;
  onMaterialSelect: (material: Material) => void;
}

export function MaterialSelector({ materials, selectedMaterialId, onMaterialSelect }: Props) {
  if (materials.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-900">
        Material: <span className="text-primary font-bold ml-1">
          {materials.find(m => m.id === selectedMaterialId)?.name || "Select"}
        </span>
      </label>
      
      <div className="flex flex-wrap gap-2">
        {materials.map((material) => {
          const isSelected = material.id === selectedMaterialId;

          return (
            <Button
              key={material.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl h-9 px-4 transition-all duration-200",
                isSelected && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={() => onMaterialSelect(material)}
            >
              <div className="flex items-center gap-2">
                {material.colourHex && (
                  <span 
                    className="h-3 w-3 rounded-full border border-white/20 shadow-sm" 
                    style={{ backgroundColor: material.colourHex }}
                  />
                )}
                <span>{material.name}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
