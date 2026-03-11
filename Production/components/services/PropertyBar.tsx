"use client";

import { cn } from "@/lib/utils";

/** 5-segment bar with color by score: green high, amber mid, red low. Shows label and "4/5" on the right. */
export function PropertyBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const segmentColor = (i: number) => {
    if (i + 1 > value) return "bg-white/20";
    if (value >= 4) return "bg-emerald-500";
    if (value >= 3) return "bg-amber-500";
    return "bg-red-500/90";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-mono text-xs text-white/70 min-w-[72px]">{label}</span>
      <div className="flex flex-1 gap-0.5 h-1.5 rounded-full overflow-hidden bg-white/10">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn("flex-1 min-w-0 rounded-sm transition-colors", segmentColor(i - 1))}
            aria-hidden
          />
        ))}
      </div>
      <span className="font-mono text-xs text-white/60 tabular-nums w-6 text-right">
        {value}/5
      </span>
    </div>
  );
}
