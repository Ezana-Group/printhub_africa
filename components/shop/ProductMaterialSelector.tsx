"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MaterialOption {
  id: string;
  name: string;
  brand: string;
  colorHex: string;
  quantity: number;
  isDefaultOption: boolean;
}

interface MaterialGroup {
  name: string;
  kind: string;
  isDefaultGroup: boolean;
  options: MaterialOption[];
}

interface Props {
  productSlug: string;
  onSelectionChange: (material: MaterialOption | null) => void;
}

export function ProductMaterialSelector({ productSlug, onSelectionChange }: Props) {
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productSlug}/materials`)
      .then((res) => res.json())
      .then((data: MaterialGroup[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setGroups(data);
          
          // Auto-select default group and option
          const defaultGroup = data.find(g => g.isDefaultGroup) || data[0];
          setSelectedGroupName(defaultGroup.name);
          
          const defaultOption = defaultGroup.options.find(o => o.isDefaultOption) || 
                               defaultGroup.options.find(o => o.quantity > 0) || 
                               defaultGroup.options[0];
          
          if (defaultOption) {
            setSelectedOptionId(defaultOption.id);
            onSelectionChange(defaultOption);
          }
        }
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [productSlug]);

  const handleGroupSelect = (groupName: string) => {
    setSelectedGroupName(groupName);
    const group = groups.find(g => g.name === groupName);
    if (group && group.options.length > 0) {
      // Pick first in-stock option or just the first option
      const option = group.options.find(o => o.quantity > 0) || group.options[0];
      setSelectedOptionId(option.id);
      onSelectionChange(option);
    }
  };

  const handleOptionSelect = (option: MaterialOption) => {
    setSelectedOptionId(option.id);
    onSelectionChange(option);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-100 rounded" />
          <div className="flex gap-2">
            {[1, 2].map(i => <div key={i} className="h-10 w-20 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-100 rounded" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-10 rounded-full bg-slate-100" />)}
          </div>
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  const currentGroup = groups.find(g => g.name === selectedGroupName);
  const currentOption = currentGroup?.options.find(o => o.id === selectedOptionId);

  return (
    <div className="space-y-8">
      {/* Material Type Selection */}
      <div className="space-y-3">
        <label className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
          Material: <span className="text-[#FF4D00] ml-1">{selectedGroupName}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.name}
              onClick={() => handleGroupSelect(group.name)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                selectedGroupName === group.name
                  ? "bg-[#FF4D00] border-[#FF4D00] text-white shadow-lg shadow-orange-200"
                  : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
              )}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
            Colour: <span className="text-[#FF4D00] ml-1">{currentOption?.name || "Select"}</span>
          </label>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {currentGroup?.options.map((option) => {
            const isSelected = option.id === selectedOptionId;
            const inStock = option.quantity > 0;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  "group relative h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ring-offset-4",
                  isSelected ? "ring-2 ring-[#FF4D00] scale-110 shadow-lg" : "hover:scale-105 active:scale-95",
                  !inStock && "opacity-50"
                )}
                title={`${option.name} ${inStock ? "" : "(Out of stock)"}`}
              >
                <span
                  className="h-full w-full rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: option.colorHex }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  </div>
                )}
                {!inStock && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="w-full h-[2px] bg-slate-900/40 rotate-45 transform scale-110" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <p className="text-[11px] text-slate-400 font-medium italic">
        * Note: Selection updates availability based on current stock.
      </p>
    </div>
  );
}
