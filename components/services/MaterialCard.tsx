"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { StrengthBar } from "./StrengthBar";
import { cn } from "@/lib/utils";

export type SpecRow = { label: string; value: string };
export type StrengthSpec = { label: string; value: number };

export function MaterialCard({
  title,
  imageSrc,
  imageAlt,
  badge,
  badgeColor,
  description,
  specs,
  strengthSpecs,
  bestFor,
  notSuitableFor,
  specialNotes,
  postProcessing,
  index = 0,
  className,
}: {
  title: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  specs?: SpecRow[];
  strengthSpecs?: StrengthSpec[];
  bestFor?: string;
  notSuitableFor?: string;
  specialNotes?: string;
  postProcessing?: string;
  index?: number;
  className?: string;
}) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = imageSrc?.trim() || "";
  const isExternal = src.startsWith("http");

  const card = (
    <article
      className={cn(
        "rounded-2xl border border-white/10 bg-[var(--surface-card)] overflow-hidden",
        "flex flex-col md:flex-row",
        className
      )}
    >
      <div className="relative h-48 md:h-auto md:w-64 shrink-0 bg-[var(--surface-dark)]">
        {isExternal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image
            src={src}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            className="object-cover"
          />
        )}
        {badge && (
          <span
            className="absolute top-3 left-3 rounded-lg px-2 py-1 font-mono text-xs font-medium text-white"
            style={{ backgroundColor: badgeColor || "var(--brand-orange)" }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold text-[var(--brand-white)]">{title}</h3>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">{description}</p>
        {strengthSpecs && strengthSpecs.length > 0 && (
          <div className="mt-4 space-y-2">
            {strengthSpecs.map((s, i) => (
              <StrengthBar key={i} value={s.value} label={s.label} />
            ))}
          </div>
        )}
        {specs && specs.length > 0 && (
          <ul className="mt-4 space-y-1 font-mono text-xs text-white/60">
            {specs.map((row, i) => (
              <li key={i}>
                <span className="text-white/40">{row.label}:</span> {row.value}
              </li>
            ))}
          </ul>
        )}
        {bestFor && (
          <p className="mt-3 text-xs text-white/60">
            <span className="text-[var(--brand-orange)]">Best for:</span> {bestFor}
          </p>
        )}
        {notSuitableFor && (
          <p className="mt-1 text-xs text-white/50">
            <span className="text-white/60">Not suitable for:</span> {notSuitableFor}
          </p>
        )}
        {specialNotes && (
          <p className="mt-2 text-xs text-white/50 italic">{specialNotes}</p>
        )}
        {postProcessing && (
          <p className="mt-2 text-xs text-white/50">
            <span className="text-white/60">Post-processing:</span> {postProcessing}
          </p>
        )}
      </div>
    </article>
  );

  if (prefersReducedMotion) return card;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {card}
    </motion.div>
  );
}
