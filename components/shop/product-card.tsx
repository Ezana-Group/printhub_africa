"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/store/cart-store";

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center gap-1">
      <span className="flex" aria-label={`${rating} out of 5 stars`}>
        {[...Array(full)].map((_, i) => (
          <span key={i} className="text-amber-500">★</span>
        ))}
        {half ? <span className="text-amber-500">½</span> : null}
        {[...Array(empty)].map((_, i) => (
          <span key={i} className="text-slate-300">★</span>
        ))}
      </span>
      {count > 0 && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imagesCount?: number;
  basePrice: number;
  comparePrice: number | null;
  category?: { name: string; slug: string };
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

export function ProductCard({ id, name, slug, image, imagesCount, basePrice, comparePrice, category, stock, averageRating, reviewCount = 0 }: ProductCardProps) {
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
          <Image
            src={
              name.toLowerCase().includes("banner")
                ? "/images/products/vinyl-banner.webp"
                : "/images/products/3d-keyholder.webp"
            }
            alt={name}
            fill
            className="object-cover opacity-60"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        )}
        {typeof imagesCount === "number" && imagesCount > 1 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            1/{imagesCount}
          </span>
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
        {averageRating != null && averageRating > 0 && (
          <div className="mt-1">
            <StarRating rating={averageRating} count={reviewCount} />
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold text-primary">KES {basePrice.toLocaleString()}</span>
          {comparePrice != null && comparePrice > basePrice && (
            <span className="text-sm text-slate-500 line-through">KES {comparePrice.toLocaleString()}</span>
          )}
        </div>
        {stock < 1 ? (
          <p className="mt-3 text-sm font-medium text-amber-700 rounded-xl border border-amber-200 bg-amber-50 py-2 text-center">Out of stock</p>
        ) : stock <= 5 ? (
          <p className="mt-2 text-xs text-slate-500">Only {stock} left</p>
        ) : null}
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
