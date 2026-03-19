"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyBar } from "./PropertyBar";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import type { Material3D } from "@/app/(public)/services/3d-printing/page";

const FILTER_OPTIONS = ["All", "Beginner-Friendly", "Engineering", "Flexible", "Most Popular"] as const;

const BRAND_ORANGE = "#E8440A";

/** Picks Strength, Heat Resistance, Ease of Print for the card (in that order). */
function getTopThreeSpecs(strengthSpecs: { label: string; value: number }[]) {
  const byKey: Record<string, number> = {};
  strengthSpecs.forEach((s) => {
    byKey[s.label] = s.value;
  });
  return [
    { label: "Strength", value: byKey["Strength"] ?? 0 },
    { label: "Heat", value: byKey["Heat Resistance"] ?? 0 },
    { label: "Ease", value: byKey["Ease of Print"] ?? 0 },
  ];
}

function parseTags(str: string): string[] {
  return str
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "PLA (Polylactic Acid)" -> { name: "PLA", chemical: "Polylactic Acid" } */
function splitTitle(title: string): { name: string; chemical: string } {
  const match = title.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (match) return { name: match[1].trim(), chemical: match[2].trim() };
  return { name: title, chemical: "" };
}

function TagList({
  tags,
  variant,
  maxVisible = 4,
}: {
  tags: string[];
  variant: "best" | "avoid";
  maxVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tags : tags.slice(0, maxVisible);
  const remaining = tags.length - maxVisible;

  if (tags.length === 0) return null;

  const isGreen = variant === "best";
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {visible.map((t, i) => (
        <span
          key={i}
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            isGreen
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          )}
        >
          {t}
        </span>
      ))}
      {!expanded && remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full px-2 py-0.5 text-xs text-white/60 hover:text-white border border-white/20"
        >
          +{remaining} more
        </button>
      )}
    </div>
  );
}

function MaterialGridCard({
  material,
  index,
  isComparing,
  onCompareToggle,
}: {
  material: Material3D;
  index: number;
  isComparing: boolean;
  onCompareToggle: () => void;
}) {
  const { name, chemical } = splitTitle(material.title);
  const topSpecs = getTopThreeSpecs(material.strengthSpecs);
  const bestForTags = parseTags(material.bestFor);
  const avoidTags = material.notSuitableFor ? parseTags(material.notSuitableFor) : [];
  const src = material.imageSrc?.trim() || "";
  const isExternal = src.startsWith("http");

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={cn(
        "rounded-xl border bg-[#1A1A1A] overflow-hidden",
        "transition-all duration-200 hover:border-[#E8440A]/40 hover:shadow-[0_0_24px_rgba(232,68,10,0.15)]",
        "hover:-translate-y-1",
        "border-[#2A2A2A] flex flex-col"
      )}
    >
      {/* Image: 200px tall, object-cover, gradient overlay at bottom */}
      <div className="relative h-[200px] w-full shrink-0 bg-[#0D0D0D]">
        {isExternal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={material.imageAlt} className="h-full w-full object-cover" />
        ) : (
          <Image
            src={src}
            alt={material.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(13,13,13,0.85) 0%, transparent 50%)",
          }}
        />
        {material.badge && (
          <span
            className="absolute top-3 left-3 rounded-lg px-2 py-1 font-mono text-xs font-medium text-white shadow-lg"
            style={{ backgroundColor: material.badgeColor || BRAND_ORANGE }}
          >
            {material.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold text-[var(--brand-white)]">{name}</h3>
        {chemical && (
          <p className="text-sm text-white/50 mt-0.5">{chemical}</p>
        )}
        <p className="mt-2 text-sm text-white/70 leading-snug line-clamp-2">
          {material.description}
        </p>

        {/* Property bars — top 3 */}
        <div className="mt-4 space-y-2">
          {topSpecs.map((spec, i) => (
            <PropertyBar key={i} value={spec.value} label={spec.label} />
          ))}
        </div>

        {/* Best for / Avoid */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs text-emerald-400 shrink-0">✅ Best for:</span>
            <TagList tags={bestForTags} variant="best" maxVisible={4} />
          </div>
          {avoidTags.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-red-400 shrink-0">❌ Avoid if:</span>
              <TagList tags={avoidTags} variant="avoid" maxVisible={4} />
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 hover:text-white/80">
            <input
              type="checkbox"
              checked={isComparing}
              onChange={onCompareToggle}
              className="rounded border-white/30 bg-white/5 text-[#E8440A] focus:ring-[#E8440A]"
            />
            Compare
          </label>
          <Link
            href="/get-a-quote"
            className="flex-1 min-w-0 flex justify-center items-center py-2.5 px-4 rounded-lg font-medium text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            Get a Quote →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function ComparisonModal({
  materials,
  onClose,
}: {
  materials: Material3D[];
  onClose: () => void;
}) {
  const allSpecLabels = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) =>
      m.strengthSpecs.forEach((s) => set.add(s.label))
    );
    return Array.from(set);
  }, [materials]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compare materials"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-white">
            Compare materials
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="pb-3 pr-4 text-sm font-medium text-white/60 border-b border-[#2A2A2A]">
                  Property
                </th>
                {materials.map((m) => (
                  <th
                    key={m.title}
                    className="pb-3 px-4 text-sm font-semibold text-white border-b border-[#2A2A2A]"
                  >
                    {splitTitle(m.title).name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSpecLabels.map((label) => (
                <tr key={label} className="border-b border-[#2A2A2A]/80">
                  <td className="py-3 pr-4 font-mono text-xs text-white/70">
                    {label}
                  </td>
                  {materials.map((m) => {
                    const spec = m.strengthSpecs.find((s) => s.label === label);
                    const value = spec?.value ?? "—";
                    return (
                      <td key={m.title} className="py-3 px-4 text-sm text-white">
                        {typeof value === "number" ? `${value}/5` : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-b border-[#2A2A2A]/80">
                <td className="py-3 pr-4 font-mono text-xs text-white/70">
                  Best for
                </td>
                {materials.map((m) => (
                  <td key={m.title} className="py-3 px-4 text-xs text-white/80">
                    {m.bestFor}
                  </td>
                ))}
              </tr>
              {materials.some((m) => m.notSuitableFor) && (
                <tr className="border-b border-[#2A2A2A]/80">
                  <td className="py-3 pr-4 font-mono text-xs text-white/70">
                    Not suitable for
                  </td>
                  {materials.map((m) => (
                    <td key={m.title} className="py-3 px-4 text-xs text-white/80">
                      {m.notSuitableFor ?? "—"}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export function MaterialsSection({ materials }: { materials: Material3D[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  const filtered = useMemo(() => {
    if (activeFilter === "All") return materials;
    return materials.filter(
      (m) => m.filterTags && m.filterTags.includes(activeFilter)
    );
  }, [materials, activeFilter]);

  const comparedList = useMemo(
    () => materials.filter((m) => compareSet.has(m.title)),
    [materials, compareSet]
  );

  const toggleCompare = (title: string) => {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <SectionLabel className="block text-center">02 — MATERIALS</SectionLabel>
        {/* Header — centered */}
        <div className="text-center mt-4">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
            Choose Your
            <br />
            Material.
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-white/70">
            The material you choose determines strength, flexibility, surface
            finish, and durability. Our team will always advise the best
            material for your specific application — but here&apos;s a full
            breakdown to help you decide.
          </p>

          {/* Filter pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 overflow-x-auto pb-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setActiveFilter(opt)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  activeFilter === opt
                    ? "bg-[#E8440A] text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white border border-white/10"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 2-col grid, 1 col mobile */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((mat, i) => (
              <MaterialGridCard
                key={mat.title}
                material={mat}
                index={i}
                isComparing={compareSet.has(mat.title)}
                onCompareToggle={() => toggleCompare(mat.title)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-white/50 py-12">
            No materials match this filter.
          </p>
        )}
      </div>

      {/* Sticky compare bar */}
      {comparedList.length >= 2 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-4 py-4 px-6 bg-[#1A1A1A] border-t border-[#2A2A2A] shadow-[0_-8px 24px rgba(0,0,0,0.4)]"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <span className="text-white font-medium">
            Comparing {comparedList.length} materials
          </span>
          <button
            type="button"
            onClick={() => setShowComparison(true)}
            className="rounded-lg px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            View Comparison
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showComparison && comparedList.length >= 2 && (
          <ComparisonModal
            materials={comparedList}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
