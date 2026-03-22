"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Eye } from "lucide-react";

export function ProductSocialProof({ soldThisMonth }: { soldThisMonth?: number }) {
  const [viewers, setViewers] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Simulated live viewers
    setViewers(Math.floor(Math.random() * 8) + 2);
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return <div className="h-10" />;

  return (
    <div className="flex flex-col gap-2.5 my-5 animate-in fade-in slide-in-from-left-4 duration-500">
      {soldThisMonth && soldThisMonth > 0 && (
         <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-orange-50/50 border border-orange-100 rounded-xl px-4 py-2 self-start shadow-sm">
            <ShoppingBag className="h-4 w-4 text-[#FF4D00] fill-[#FF4D00]/10" />
            <span><span className="text-[#FF4D00] font-bold">{soldThisMonth}</span> people bought this recently</span>
         </div>
      )}
      
      <div className="flex items-center gap-2 text-[13px] text-slate-600 px-4">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <Eye className="h-3.5 w-3.5" />
          <span>{viewers} people are viewing this right now</span>
        </div>
      </div>
    </div>
  );
}
