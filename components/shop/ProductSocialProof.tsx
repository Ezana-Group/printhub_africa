"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";

export function ProductSocialProof({ soldThisMonth }: { soldThisMonth?: number }) {
  if (!soldThisMonth || soldThisMonth <= 0) return null;

  return (
    <div className="flex flex-col gap-2.5 my-5 animate-in fade-in slide-in-from-left-4 duration-500">
      {soldThisMonth && soldThisMonth > 0 && (
         <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-orange-50/50 border border-orange-100 rounded-xl px-4 py-2 self-start shadow-sm">
            <ShoppingBag className="h-4 w-4 text-[#FF4D00] fill-[#FF4D00]/10" />
            <span><span className="text-[#FF4D00] font-bold">{soldThisMonth}</span> people bought this recently</span>
         </div>
      )}
      
      {/* Viewing simulation removed per user request */}
    </div>
  );
}
