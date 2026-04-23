"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Cuboid, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type ProductTab = "best-sellers" | "new-arrivals" | "on-sale";

const TABS: Array<{ id: ProductTab; label: string; bgColor: string; textColor: string }> = [
  {
    id: "best-sellers",
    label: "Best Sellers",
    bgColor: "#FFF3E0",
    textColor: "#E65100",
  },
  {
    id: "new-arrivals",
    label: "New Arrivals",
    bgColor: "#E3F2FD",
    textColor: "#1565C0",
  },
  {
    id: "on-sale",
    label: "On Sale",
    bgColor: "#E8F5E9",
    textColor: "#2E7D32",
  },
];

export type FeaturedProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  basePrice: number;
  comparePrice: number | null;
  materials: string[];
  tags: string[];
  createdAt: string;
  imageUrl: string | null;
  stock: number;
  averageRating: number;
  reviewCount: number;
  etaLabel: string | null;
};

function getFilteredProducts(tab: ProductTab, products: FeaturedProductCardData[]): FeaturedProductCardData[] {
  const normalizedTags = products.map((p) => ({
    ...p,
    normalizedTags: p.tags.map((tag) => tag.trim().toLowerCase()),
  }));

  const bestSellerTags = new Set([
    "best-seller",
    "best seller",
    "bestseller",
    "popular",
    "top-seller",
    "staff pick",
  ]);
  const newArrivalTags = new Set(["new arrival", "new-arrival", "arrival", "new"]);

  if (tab === "new-arrivals") {
    const byTag = normalizedTags.filter((p) => p.normalizedTags.some((tag) => newArrivalTags.has(tag)));
    if (byTag.length > 0) return byTag;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const fresh = normalizedTags.filter((p) => new Date(p.createdAt).getTime() >= thirtyDaysAgo);
    return fresh.length > 0 ? fresh : products;
  }

  if (tab === "on-sale") {
    return normalizedTags.filter((p) => p.comparePrice != null && p.comparePrice > p.basePrice);
  }

  const best = normalizedTags.filter((p) => p.normalizedTags.some((tag) => bestSellerTags.has(tag)));
  return best.length > 0 ? best : products;
}

export function FeaturedProductsClient({ products }: { products: FeaturedProductCardData[] }) {
  const [activeTab, setActiveTab] = useState<ProductTab>("best-sellers");

  const visibleProducts = useMemo(
    () => getFilteredProducts(activeTab, products),
    [activeTab, products]
  );

  return (
    <section id="shop-3d-prints" className="bg-white py-[60px]">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="mb-3 block h-[3px] w-10 rounded-[2px] bg-[#FF4D00]" />
          </div>
          <Link href="/shop" className="text-[15px] font-medium text-[#FF4D00] hover:underline">
            View all products →
          </Link>
        </div>

        <div className="mb-8 flex w-full gap-3 overflow-x-auto rounded-xl bg-slate-50 p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#FF4D00] text-white shadow-sm"
                  : "hover:brightness-95"
              }`}
              style={
                activeTab === tab.id
                  ? undefined
                  : { backgroundColor: tab.bgColor, color: tab.textColor }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((p) => {
              const description = p.shortDescription ?? p.materials[0] ?? "Premium ready-made 3D print.";
              return (
                <Card key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-none">
                  <Link href={`/shop/${p.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-[#F5F5F5]">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                      <div className="absolute left-2 top-2 flex items-center gap-1">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${p.stock > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {p.stock > 0 ? "In Stock" : "Made to Order"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/shop/${p.slug}`}>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        {p.averageRating.toFixed(1)} ({p.reviewCount})
                      </span>
                      <span>{p.etaLabel ?? "Delivery in 2-5 days"}</span>
                    </div>
                    <p className="mt-3 text-lg font-bold text-[#FF4D00]">{formatPrice(p.basePrice)}</p>
                    <Button asChild size="sm" className="mt-4 w-full rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90">
                      <Link href={`/shop/${p.slug}`}>Add to cart</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div
              className="col-span-full rounded-2xl px-8 py-[60px] text-center text-white"
              style={{ background: "linear-gradient(135deg, #FF4D00 0%, #FF8C42 100%)" }}
            >
              <Cuboid className="mx-auto h-12 w-12 text-white" />
              <h3 className="mt-4 text-2xl font-bold text-white">Products Coming Soon</h3>
              <p className="mt-2 text-white/90">
                Be the first to know when our 3D prints go live.
              </p>
              <button
                type="button"
                className="mt-6 rounded-xl border border-white bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#FF4D00]"
              >
                Get Notified
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
