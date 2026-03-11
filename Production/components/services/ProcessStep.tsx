"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProcessStep({
  number,
  icon,
  title,
  children,
  className,
  index = 0,
  variant = "dark",
}: {
  number: string;
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
  index?: number;
  /** "dark" = white text (for dark sections), "light" = dark text (for white/light sections) */
  variant?: "dark" | "light";
}) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isLight = variant === "light";
  const titleClass = isLight
    ? "font-display text-lg font-bold text-[var(--brand-black)]"
    : "font-display text-lg font-bold text-[var(--brand-white)]";
  const bodyClass = isLight
    ? "mt-2 text-base text-[#374151] font-body leading-relaxed max-w-xl"
    : "mt-2 text-sm text-white/80 font-body leading-relaxed";

  const content = (
    <div className={cn("flex gap-6", className)}>
      <div className="flex shrink-0 flex-col items-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--brand-orange)] font-mono text-sm font-bold text-white">
          {number}
        </span>
        {icon && (
          <span className={cn("mt-2 text-2xl", isLight ? "text-slate-500" : "opacity-80")} aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {title && <h3 className={titleClass}>{title}</h3>}
        <div className={bodyClass}>{children}</div>
      </div>
    </div>
  );

  if (prefersReducedMotion) return content;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {content}
    </motion.div>
  );
}
