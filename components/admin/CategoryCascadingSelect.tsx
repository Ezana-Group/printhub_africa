"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";

export type CategoryOption = {
  id: string;
  name: string;
  parentId?: string | null;
};

interface CategoryCascadingSelectProps {
  categories: CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CategoryCascadingSelect({
  categories,
  value,
  onChange,
}: CategoryCascadingSelectProps) {
  // Find the selected category and its lineage
  const findLineage = (id: string | null): string[] => {
    if (!id) return [];
    const lineage: string[] = [];
    let currentId: string | null = id;
    while (currentId) {
      lineage.unshift(currentId);
      const parent = categories.find((c) => c.id === currentId);
      currentId = parent?.parentId || null;
    }
    return lineage;
  };

  const initialLineage = useMemo(() => findLineage(value), [value, categories]);
  const [selectedPath, setSelectedPath] = useState<string[]>(initialLineage);

  // Sync state if value changes externally
  useEffect(() => {
    const newLineage = findLineage(value);
    if (JSON.stringify(newLineage) !== JSON.stringify(selectedPath)) {
      setSelectedPath(newLineage);
    }
  }, [value]);

  const levels = useMemo(() => {
    const result: CategoryOption[][] = [];
    // Start with top-level
    result.push(categories.filter((c) => !c.parentId));

    // For each item in the selected path, find its children for the next level
    for (let i = 0; i < selectedPath.length; i++) {
      const children = categories.filter((c) => c.parentId === selectedPath[i]);
      if (children.length > 0) {
        result.push(children);
      } else {
        break;
      }
    }
    return result;
  }, [categories, selectedPath]);

  const handleSelectChange = (levelIndex: number, newValue: string) => {
    const newPath = selectedPath.slice(0, levelIndex);
    if (newValue) {
      newPath.push(newValue);
    }
    
    setSelectedPath(newPath);
    onChange(newValue || (newPath.length > 0 ? newPath[newPath.length - 1] : null));
  };

  return (
    <div className="grid gap-4 mt-1">
      {levels.map((options, index) => (
        <div key={index} className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
            {index === 0 ? "Main Category" : index === 1 ? "Subcategory" : `Level ${index + 1}`}
          </Label>
          <select
            value={selectedPath[index] || ""}
            onChange={(e) => handleSelectChange(index, e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select {index === 0 ? "Category" : "Subcategory"}...</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
