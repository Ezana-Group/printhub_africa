"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/store/cart-store";

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface AddToCartButtonProps {
  productId: string;
  name: string;
  slug: string;
  image?: string;
  basePrice: number;
  variants: Variant[];
  stock: number;
  minOrderQty: number;
  maxOrderQty?: number;
}

export function AddToCartButton({
  productId,
  name,
  slug,
  image,
  basePrice,
  variants,
  stock,
  minOrderQty,
  maxOrderQty,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(minOrderQty);
  const [variantId, setVariantId] = useState<string | undefined>(variants[0]?.id);
  const [added, setAdded] = useState(false);

  const selectedVariant = variantId ? variants.find((v) => v.id === variantId) : undefined;
  const price = selectedVariant ? selectedVariant.price : basePrice;
  const variantStock = selectedVariant ? selectedVariant.stock : stock;
  const maxQty = maxOrderQty ?? 99;
  const effectiveMax = Math.min(maxQty, variantStock);

  const handleAdd = () => {
    const item: CartItem = {
      productId,
      variantId,
      quantity,
      unitPrice: price,
      name,
      slug,
      image,
    };
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (stock < 1 && variants.every((v) => v.stock < 1)) {
    return (
      <Button disabled className="mt-6 rounded-xl">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {variants.length > 1 && (
        <div>
          <label className="text-sm font-medium text-slate-700">Variant</label>
          <select
            value={variantId ?? ""}
            onChange={(e) => { setVariantId(e.target.value || undefined); setQuantity(minOrderQty); }}
            className="mt-1 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock < 1}>
                {v.name} — KES {v.price.toLocaleString()} {v.stock < 1 ? "(Out of stock)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-slate-700">Quantity</label>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(minOrderQty, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={minOrderQty}
            max={effectiveMax}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(minOrderQty, Math.min(effectiveMax, parseInt(e.target.value, 10) || minOrderQty)))}
            className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center text-slate-800"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(effectiveMax, q + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={handleAdd}
          className="rounded-xl bg-primary hover:bg-primary/90"
          disabled={variantStock < 1}
        >
          {added ? "Added to cart" : "Add to cart"}
        </Button>
        <Button variant="outline" asChild className="rounded-xl">
          <a href="/checkout">Buy now</a>
        </Button>
      </div>
    </div>
  );
}
