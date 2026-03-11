"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ServiceCard({
  icon,
  title,
  description,
  specs,
  href = "#",
  index = 0,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  specs?: string;
  href?: string;
  index?: number;
  className?: string;
}) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const card = (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-white/5 bg-[var(--surface-card)] p-6 transition-colors",
        "hover:border-[var(--brand-orange)]/30 hover:border-l-4 hover:border-l-[var(--brand-orange)]",
        className
      )}
    >
      <span className="text-2xl opacity-80" aria-hidden>{icon}</span>
      <h3 className="font-display text-lg font-bold text-[var(--brand-white)] mt-3 group-hover:text-[var(--brand-orange)] transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">{description}</p>
      {specs && (
        <p className="mt-2 font-mono text-xs text-white/40">Sizes: {specs}</p>
      )}
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-orange)]">
        Learn more →
      </span>
    </Link>
  );

  if (prefersReducedMotion) return card;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      {card}
    </motion.div>
  );
}
