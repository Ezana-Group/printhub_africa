"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

export function StickyMiniCartCTA() {
  const itemCount = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.total());

  if (itemCount < 1) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        asChild
        size="lg"
        className="rounded-2xl bg-primary px-5 shadow-xl shadow-primary/30 hover:bg-primary/90"
      >
        <Link href="/cart" className="inline-flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
          <span className="opacity-80">|</span>
          <span>KES {total.toLocaleString()}</span>
        </Link>
      </Button>
    </div>
  );
}
