"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  kinds: string[];
  selectedKind?: string;
  onKindSelect: (kind: string) => void;
}

export function MaterialSelector({ kinds, selectedKind, onKindSelect }: Props) {
  if (kinds.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-900">
        Material: <span className="text-primary font-bold ml-1">
          {selectedKind || "Select"}
        </span>
      </label>
      
      <div className="flex flex-wrap gap-2">
        {kinds.map((kind) => {
          const isSelected = kind === selectedKind;

          return (
            <Button
              key={kind}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl h-9 px-4 transition-all duration-200",
                isSelected && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={() => onKindSelect(kind)}
            >
              <span>{kind}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
