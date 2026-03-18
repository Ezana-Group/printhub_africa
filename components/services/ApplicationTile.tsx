"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ApplicationTile({
  number,
  title,
  copy,
  imageSrc,
  imageAlt,
  index = 0,
  imageLeft = true,
  className,
}: {
  number: string;
  title: string;
  copy: string;
  imageSrc: string;
  imageAlt: string;
  index?: number;
  imageLeft?: boolean;
  className?: string;
}) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = imageSrc?.trim() || "";
  const isExternal = src.startsWith("http");

  const content = (
    <div
      className={cn(
        "grid md:grid-cols-2 gap-8 items-center",
        className
      )}
    >
      <div
        className={cn(
          "relative h-64 md:h-80 rounded-xl overflow-hidden",
          !imageLeft && "md:order-2"
        )}
      >
        {isExternal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <Image
            src={src}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <div className={cn(!imageLeft && "md:order-1")}>
        <span className="font-mono text-sm text-[var(--brand-orange)]">{number}</span>
        <h3 className="font-display text-xl font-bold text-[var(--brand-white)] mt-1">{title}</h3>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">{copy}</p>
      </div>
    </div>
  );

  if (prefersReducedMotion) return content;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {content}
    </motion.div>
  );
}
