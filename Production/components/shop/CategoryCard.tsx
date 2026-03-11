"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  index: number;
  type: "SERVICE" | "SHOP";
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  ctaText: string;
  badge: string;
  fromPrice: string;
  productCount: number;
}

export function CategoryCard({
  index,
  type,
  name,
  description,
  imageUrl,
  imageAlt,
  href,
  ctaText,
  badge,
  fromPrice,
  productCount,
}: CategoryCardProps) {
  const indexStr = String(index).padStart(2, "0");

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-white/0 transition-[border-color] duration-300",
        "md:min-h-[320px]",
        "hover:border-white/10"
      )}
    >
      {/* Background image with zoom on hover */}
      <div className="absolute inset-0 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--surface-card)]" />
        )}
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"
          aria-hidden
        />
      </div>

      {/* Content */}
      <div className="relative flex min-h-[240px] flex-col justify-end p-6 md:min-h-[320px] md:p-8">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--brand-orange)]">
          {indexStr} — {type}
        </span>
        <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-[var(--brand-white)] md:text-[32px]">
          {name}
        </h2>
        <p className="mt-2 line-clamp-2 font-body text-sm text-white/55">
          {description}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-white/40">
            ● {productCount} product{productCount !== 1 ? "s" : ""}
          </span>
          <span className="font-mono text-xs text-[var(--brand-orange)]">
            {fromPrice}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded border border-white/20 px-2 py-0.5 font-mono text-[10px] uppercase text-white/60">
            {badge}
          </span>
          <span className="inline-flex items-center gap-1 font-body text-sm font-medium text-white">
            {ctaText}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </span>
        </div>
      </div>

      {/* Orange bottom border — grows on hover */}
      <span
        className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--brand-orange)] transition-[width] duration-300 ease-out group-hover:w-full"
        aria-hidden
      />
    </Link>
  );
}
