"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  options: string[];
  selectedOption?: string;
  onOptionSelect: (option: string) => void;
  label?: string;
}

export function MaterialSelector({ options, selectedOption, onOptionSelect, label = "Material" }: Props) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-900">
        {label}: <span className="text-primary font-bold ml-1">
          {selectedOption || "Select"}
        </span>
      </label>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option === selectedOption;

          return (
            <Button
              key={option}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl h-9 px-4 transition-all duration-200",
                isSelected && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={() => onOptionSelect(option)}
            >
              <span>{option}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
