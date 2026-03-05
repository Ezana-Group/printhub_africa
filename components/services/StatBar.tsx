"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  inView,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  inView: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const duration = 1.5;
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const step = (t: number) => {
      if (start.current === null) start.current = t;
      const elapsed = (t - start.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function StatBar({
  stats,
  className,
}: {
  stats: Array<{
    value: number;
    decimals?: number;
    suffix?: string;
    prefix?: string;
    label: string;
    sublabel: string;
  }>;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = !prefersReducedMotion;

  return (
    <motion.div
      ref={ref}
      initial={animate ? { opacity: 0, y: 24 } : false}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 py-12",
        className
      )}
    >
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <div className="font-display text-3xl md:text-4xl font-extrabold text-[var(--brand-orange)]">
            {animate ? (
              <AnimatedNumber
                value={stat.value}
                decimals={stat.decimals}
                suffix={stat.suffix}
                prefix={stat.prefix}
                inView={inView}
              />
            ) : (
              <>
                {stat.prefix}
                {stat.decimals != null
                  ? stat.value.toFixed(stat.decimals)
                  : stat.value.toLocaleString()}
                {stat.suffix}
              </>
            )}
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-white/70">
            {stat.label}
          </p>
          <p className="mt-0.5 text-sm text-white/50">{stat.sublabel}</p>
        </div>
      ))}
    </motion.div>
  );
}
