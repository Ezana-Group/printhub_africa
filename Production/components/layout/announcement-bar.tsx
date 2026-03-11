"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BusinessPublic } from "@/lib/business-public";

const MESSAGES = (city: string) => [
  { id: 1, text: `Free delivery on orders over KES 5,000 in ${city || "Nairobi"}`, href: "/shop" },
  { id: 2, text: "48hr turnaround on large format prints", href: "/services/large-format" },
  { id: 3, text: "Upload your design — we'll print it. Get a quote today.", href: "/get-a-quote" },
];

export function AnnouncementBar({ business }: { business?: BusinessPublic }) {
  const [dismissed, setDismissed] = useState(false);
  const [index] = useState(0);
  const location = [business?.city, business?.country].filter(Boolean).join(", ") || "Nairobi, Kenya";
  const msg = MESSAGES(business?.city ?? "Nairobi")[index];

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-100 text-center text-sm py-2.5 px-4 relative">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span aria-hidden className="text-base">🇰🇪</span>
        <span className="font-medium">{location}</span>
        <span className="hidden sm:inline text-slate-500">·</span>
        <Link
          href={msg.href}
          className="underline font-medium hover:no-underline text-white hover:text-slate-200"
        >
          {msg.text}
        </Link>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
