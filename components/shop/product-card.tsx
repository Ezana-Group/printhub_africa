"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/store/cart-store";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  basePrice: number;
  comparePrice: number | null;
  category?: { name: string; slug: string };
  stock: number;
}

export function ProductCard({ id, name, slug, image, basePrice, comparePrice, category, stock }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const item: CartItem = {
      productId: id,
      quantity: 1,
      unitPrice: basePrice,
      name,
      slug,
      image: image ?? undefined,
    };
    addItem(item);
  };

  return (
    <Link href={`/shop/${slug}`} className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
        )}
        {category && (
          <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700">
            {category.name}
          </span>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 rounded-full opacity-0 transition group-hover:opacity-100"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-slate-900 line-clamp-2">{name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold text-primary">KES {basePrice.toLocaleString()}</span>
          {comparePrice != null && comparePrice > basePrice && (
            <span className="text-sm text-slate-500 line-through">KES {comparePrice.toLocaleString()}</span>
          )}
        </div>
        <Button
          size="sm"
          className="mt-3 w-full rounded-xl"
          onClick={handleAddToCart}
          disabled={stock < 1}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to cart
        </Button>
      </div>
    </Link>
  );
}
