"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import Link from "next/link";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: { name: string; slug: string };
  productType: string;
  image: string | null;
  imagesCount?: number;
  basePrice: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  isFeatured: boolean;
  tags?: string[];
  averageRating?: number | null;
  reviewCount?: number;
}

export function ShopContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ items: ProductItem[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "featured");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => setCategories([]));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "12");
    if (sort) params.set("sort", sort);
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (inStock) params.set("inStock", "true");
    try {
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch {
      setData({ items: [], total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, q, inStock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setInStock(false);
    setSort("featured");
    setPage(1);
  };

  const hasFilters = q || category || inStock || sort !== "featured";

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Shop</h1>
        <p className="text-muted-foreground mt-1">Browse our print products and add to cart.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-64 shrink-0 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <div>
            <Label className="text-slate-700">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Product name..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-700">Category</Label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-slate-700">Sort</Label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="bestselling">Best Selling</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inStock"
              checked={inStock}
              onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
              className="rounded border-slate-300"
            />
            <Label htmlFor="inStock" className="text-slate-700">In stock only</Label>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Showing {data.items.length} of {data.total} products
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    slug={p.slug}
                    image={p.image}
                    imagesCount={p.imagesCount}
                    basePrice={p.basePrice}
                    comparePrice={p.comparePrice}
                    category={p.category}
                    stock={p.stock}
                    tags={p.tags}
                    averageRating={p.averageRating ?? undefined}
                    reviewCount={p.reviewCount ?? 0}
                  />
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-xl"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-slate-600">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-slate-600">No products found.</p>
              <Button asChild className="mt-4 rounded-xl">
                <Link href="/shop">View all products</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
