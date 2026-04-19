import React from "react";
import { cn } from "@/lib/utils";

interface LicenceBadgeProps {
  licence: string | null | undefined;
  size?: "sm" | "md";
}

export const LicenceBadge = ({ licence, size = "md" }: LicenceBadgeProps) => {
  const l = (licence ?? "").toLowerCase();
  
  let label = "Verify Licence";
  let tooltip = "Licence unclear — verify before selling prints.";
  let bgColor = "bg-gray-100 text-gray-700";

  if (l.includes("cc0") || l.includes("public domain") || l.includes("public_domain") || l.includes("zero")) {
    label = "CC0 — Free Use";
    tooltip = "Public domain. No restrictions. Commercial use allowed.";
    bgColor = "bg-green-100 text-green-800 border-green-200";
  } else if (l.includes("cc-by-sa") || l.includes("cc by-sa") || l.includes("attribution_-_share_alike") || l.includes("share_alike")) {
    label = "CC BY-SA";
    tooltip = "Credit the designer. Derivatives must share same licence.";
    bgColor = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (l.includes("cc-by-nd") || l.includes("cc by-nd") || l.includes("no_derivatives")) {
    label = "CC BY-ND";
    tooltip = "Credit required. No modifications allowed.";
    bgColor = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (l.includes("cc-by") || l.includes("attribution")) {
    label = "CC BY — Credit";
    tooltip = "Commercial use allowed. You must credit the designer.";
    bgColor = "bg-teal-100 text-teal-800 border-teal-200";
  } else if (l.includes("nc") || l.includes("non-commercial") || l.includes("noncommercial") || l.includes("non_commercial")) {
    label = "NON-COMMERCIAL";
    tooltip = "Personal use only. Cannot be sold.";
    bgColor = "bg-red-100 text-red-800 border-red-200";
  } else if (l.includes("royalty-free") || l.includes("royalty free")) {
    label = "Royalty-Free";
    tooltip = "Commercial printing permitted per platform terms.";
    bgColor = "bg-green-100 text-green-800 border-green-200";
  }

  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0" : "text-xs px-2.5 py-0.5";

  return (
    <div 
      className={cn(baseClasses, sizeClasses, bgColor)}
      title={tooltip}
    >
      {label}
    </div>
  );
};
