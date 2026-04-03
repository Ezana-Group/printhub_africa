"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/store/cart-store";
import { trackAddToCart } from "@/lib/marketing/event-tracker";
import { Minus, Plus, ShoppingCart, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  selectedColor?: { name: string; hex: string };
  selectedMaterial?: string;
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
  selectedColor,
  selectedMaterial,
}: AddToCartButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(minOrderQty);
  const [variantId, setVariantId] = useState<string | undefined>(variants[0]?.id);
  const [added, setAdded] = useState(false);

  const selectedVariant = variantId ? variants.find((v) => v.id === variantId) : undefined;
  const price = selectedVariant ? selectedVariant.price : basePrice;
  const variantStock = selectedVariant ? selectedVariant.stock : stock;
  const maxQty = maxOrderQty ?? 99;
  const effectiveMax = Math.min(maxQty, variantStock);

  const prepareItem = (): CartItem => {
    return {
      productId,
      variantId,
      quantity,
      unitPrice: price,
      name,
      slug,
      image,
      colorName: selectedColor?.name,
      colorHex: selectedColor?.hex,
      materialName: selectedMaterial,
    } as any;
  };

  const handleAdd = () => {
    const item = prepareItem();
    trackAddToCart({
      id: productId,
      name: name,
      price: price,
      quantity: quantity,
    });

    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const item = prepareItem();
    addItem(item);
    router.push("/checkout");
  };

  if (stock < 1 && variants.every((v) => v.stock < 1)) {
    return (
      <Button disabled className="w-full h-14 rounded-2xl bg-slate-100 text-slate-400 border-none font-bold text-lg cursor-not-allowed">
        Sold Out
      </Button>
    );
  }

  return (
    <div className="space-y-8">
      {variants.length > 1 && (
        <div className="space-y-3">
          <label className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Select Version</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => { setVariantId(v.id); setQuantity(minOrderQty); }}
                disabled={v.stock < 1}
                className={cn(
                  "flex flex-col p-4 rounded-2xl border-2 text-left transition-all duration-200",
                  variantId === v.id 
                    ? "border-[#FF4D00] bg-orange-50/30 ring-1 ring-[#FF4D00]" 
                    : "border-slate-100 hover:border-slate-200 bg-white",
                  v.stock < 1 && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <span className="text-sm font-bold text-slate-900">{v.name}</span>
                <span className="text-xs font-medium text-[#FF4D00] mt-1">KES {v.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Quantity</label>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(minOrderQty, q - 1))}
              disabled={quantity <= minOrderQty}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-[#FF4D00] hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Decrease quantity"
            >
              <Minus className="h-5 w-5" />
            </button>
            <input
              type="number"
              min={minOrderQty}
              max={effectiveMax}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(minOrderQty, Math.min(effectiveMax, parseInt(e.target.value, 10) || minOrderQty)))}
              className="w-16 bg-transparent border-none text-center font-bold text-slate-900 focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(effectiveMax, q + 1))}
              disabled={quantity >= effectiveMax}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-[#FF4D00] hover:shadow-sm transition-all disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          {variantStock < 10 && variantStock > 0 && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              Only {variantStock} left in stock
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          onClick={handleAdd}
          disabled={variantStock < 1}
          className={cn(
            "h-14 rounded-2xl font-bold text-base transition-all duration-300 gap-2 shadow-lg shadow-orange-100",
            added 
              ? "bg-emerald-500 hover:bg-emerald-600 scale-[0.98]" 
              : "bg-[#FF4D00] hover:bg-[#E64500] hover:scale-[1.02] active:scale-95 text-white"
          )}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Add to cart
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleBuyNow} 
          disabled={variantStock < 1}
          className="h-14 rounded-2xl font-bold text-base border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 gap-2"
        >
          <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
          Buy now
        </Button>
      </div>
    </div>
  );
}
