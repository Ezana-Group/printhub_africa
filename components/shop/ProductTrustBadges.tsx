import React from "react";
import { Truck, ShieldCheck, Award, Zap } from "lucide-react";

export function ProductTrustBadges() {
  const badges = [
    { icon: <Truck className="h-5 w-5 text-[#FF4D00]" />, label: "Fast Shipping", subtext: "Delivery across Kenya" },
    { icon: <ShieldCheck className="h-5 w-5 text-[#FF4D00]" />, label: "Secure Payment", subtext: "MPESA & Cards" },
    { icon: <Award className="h-5 w-5 text-[#FF4D00]" />, label: "Quality Guarenteed", subtext: "Hand-inspected" },
    { icon: <Zap className="h-5 w-5 text-[#FF4D00]" />, label: "Quick Turnaround", subtext: "POD specialists" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6 my-6">
      {badges.map((b, i) => (
        <div key={i} className="flex items-start gap-3 group">
          <div className="flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
            {b.icon}
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-800 leading-tight">{b.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{b.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
