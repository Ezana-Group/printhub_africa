"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useScroll, useTransform, motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ServiceHero({
  label,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  ctaPrimary,
  ctaPrimaryHref,
  ctaSecondary,
  ctaSecondaryHref,
  trustBadge,
  floatingBadge,
  className,
}: {
  label: string;
  title: React.ReactNode;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary: string;
  ctaSecondaryHref?: string;
  trustBadge?: React.ReactNode;
  floatingBadge?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const src = imageSrc?.trim() || "";
  const isExternal = src.startsWith("http");
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      className={cn(
        "relative min-h-screen flex flex-col md:flex-row bg-[var(--brand-black)] overflow-hidden",
        className
      )}
    >
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-20 md:px-12 lg:px-16 md:max-w-[55%]">
        <SectionLabel className="text-[var(--brand-orange)]">{label}</SectionLabel>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl xl:text-[96px] font-extrabold text-[var(--brand-white)] leading-[1.05] tracking-tight">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-lg md:text-xl text-white/70 font-body">
          {subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button
            asChild
            className="bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white rounded-xl px-8 py-6 text-base font-semibold h-auto min-h-[44px]"
          >
            <Link href={ctaPrimaryHref}>{ctaPrimary}</Link>
          </Button>
          {ctaSecondaryHref && (
            <Button
              asChild
              variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl px-8 py-6 text-base font-medium h-auto min-h-[44px] border border-white/20"
            >
              <Link href={ctaSecondaryHref}>{ctaSecondary}</Link>
            </Button>
          )}
        </div>
        {trustBadge && (
          <p className="mt-12 text-sm text-white/60 font-mono">{trustBadge}</p>
        )}
      </div>
      <div className="relative flex-1 min-h-[50vh] md:min-h-screen">
        <motion.div
          style={prefersReducedMotion ? undefined : { y }}
          className="absolute inset-0"
        >
          {isExternal ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={imageAlt}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <Image
              src={src}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent md:bg-gradient-to-r from-black/80 to-transparent"
            aria-hidden
          />
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--brand-black)] to-transparent md:w-32" aria-hidden />
        </motion.div>
        {floatingBadge && (
          <div className="absolute bottom-8 right-8 z-20 rounded-xl bg-black/70 backdrop-blur px-4 py-2 font-mono text-sm text-white/90 border border-white/10">
            {floatingBadge}
          </div>
        )}
      </div>
    </section>
  );
}
