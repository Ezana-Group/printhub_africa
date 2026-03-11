"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type LargeFormatServiceCard = {
  icon: string;
  title: string;
  description: string;
  specs?: string;
  detail?: string;
};

export function LargeFormatServiceGrid({
  cards,
}: {
  cards: LargeFormatServiceCard[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LargeFormatServiceCard | null>(null);

  const handleCardClick = (card: LargeFormatServiceCard) => {
    setSelected(card);
    setOpen(true);
  };

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const el = (
            <button
              type="button"
              onClick={() => handleCardClick(card)}
              className={cn(
                "group text-left rounded-xl border border-white/5 bg-[var(--surface-card)] p-6 transition-colors",
                "hover:border-[var(--brand-orange)]/30 hover:border-l-4 hover:border-l-[var(--brand-orange)]"
              )}
            >
              <span className="text-2xl opacity-80" aria-hidden>
                {card.icon}
              </span>
              <h3 className="font-display text-lg font-bold text-[var(--brand-white)] mt-3 group-hover:text-[var(--brand-orange)] transition-colors">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-2">
                {card.description}
              </p>
              {card.specs && (
                <p className="mt-2 font-mono text-xs text-white/40">Sizes: {card.specs}</p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-orange)]">
                Learn more →
              </span>
            </button>
          );
          if (prefersReducedMotion) {
            return <div key={card.title}>{el}</div>;
          }
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              {el}
            </motion.div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-[var(--surface-dark)] border-white/10 text-[var(--brand-white)]">
          <DialogHeader>
            {selected && (
              <>
                <span className="text-2xl opacity-80" aria-hidden>
                  {selected.icon}
                </span>
                <DialogTitle className="text-xl text-[var(--brand-white)]">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {selected.description}
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.specs && (
                <p className="font-mono text-xs text-white/50">Sizes / specs: {selected.specs}</p>
              )}
              {selected.detail && (
                <p className="text-sm text-white/80 leading-relaxed">{selected.detail}</p>
              )}
              <Button asChild className="w-full mt-4 bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90">
                <Link href="/get-a-quote" onClick={() => setOpen(false)}>
                  Get a free quote →
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
