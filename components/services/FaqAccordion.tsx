"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAccordion({
  items,
  className,
  theme = "light",
}: {
  items: Array<{ question: string; answer: string }>;
  className?: string;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";
  return (
    <Accordion.Root
      type="single"
      collapsible
      className={cn("space-y-2", className)}
    >
      {items.map((item, i) => (
        <Accordion.Item
          key={i}
          value={`item-${i}`}
          className={cn(
            "rounded-xl border overflow-hidden",
            isDark ? "border-white/10 bg-[var(--surface-card)]" : "border-slate-200 bg-white"
          )}
        >
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                "flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-display font-semibold transition-colors",
                "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]",
                isDark ? "text-[var(--brand-white)]" : "text-slate-900"
              )}
            >
              <span className="text-sm md:text-base">{item.question}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-[var(--brand-orange)] transition-transform duration-200 [[data-state=open]_&]:rotate-180"
                aria-hidden
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            className={cn(
              "px-6 pb-4 text-sm leading-relaxed",
              isDark ? "text-white/70" : "text-slate-600"
            )}
          >
            <div className="whitespace-pre-line">{item.answer}</div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
