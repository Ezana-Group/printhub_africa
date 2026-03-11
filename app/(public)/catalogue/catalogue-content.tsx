"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CatalogueCard } from "./catalogue-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  itemCount: number;
}

interface CatalogueItemSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: { id: string; name: string; slug: string };
  tags: string[];
  licenseType: string;
  primaryPhotoUrl: string | null;
  availableMaterials: { materialCode: string; materialName: string }[];
  fromPriceKes: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isStaffPick: boolean;
  isPopular: boolean;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "New Arrivals" },
  { value: "price-asc", label: "Price: Low–High" },
  { value: "price-desc", label: "Price: High–Low" },
  { value: "popular", label: "Most Popular" },
];

export function CatalogueContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<{
    items: CatalogueItemSummary[];
    total: number;
    page: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [material, setMaterial] = useState(searchParams.get("material") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "featured");

  useEffect(() => {
    fetch("/api/catalogue/categories")
      .then((r) => r.json())
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => setCategories([]));
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (category) params.set("category", category);
    if (material) params.set("material", material);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    try {
      const res = await fetch(`/api/catalogue?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch {
      setData({ items: [], total: 0, page: 1, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, category, material, q, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setMaterial("");
    setSort("featured");
    setPage(1);
  };

  const hasFilters = q || category || material || sort !== "featured";

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-16 md:py-20">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <p className="text-sm font-mono text-orange-400 uppercase tracking-wider">Print-on-Demand</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[52px] font-bold mt-2 leading-tight">
            Browse. Order.
            <br />
            We&apos;ll Print It.
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-xl">
            Hundreds of 3D models — choose your material, colour, and quantity. We print fresh for every order. Delivered anywhere in Kenya.
          </p>
          <p className="mt-6 text-sm text-white/50">
            {data?.total != null ? `${data.total} models available` : "—"} · 8 materials · 20+ colours · Ships Kenya-wide
          </p>
        </div>
      </section>

      {/* Category grid */}
      <section className="bg-white border-b border-slate-200">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <h2 className="sr-only">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={category === cat.slug ? "/catalogue" : `/catalogue?category=${encodeURIComponent(cat.slug)}`}
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition ${
                  category === cat.slug ? "border-primary" : "border-slate-200 hover:border-orange-400"
                }`}
              >
                {cat.imageUrl ? (
                  <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 20vw" />
                ) : (
                  <div className="absolute inset-0 bg-slate-200" />
                )}
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <span className="font-semibold text-white">{cat.name}</span>
                  <span className="text-xs text-white/80">{cat.itemCount} items</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-16 z-40 bg-white border-b border-slate-200 py-3">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search models..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
                className="pl-9 rounded-xl"
              />
            </div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select
              value={material}
              onChange={(e) => { setMaterial(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All materials</option>
              <option value="PLA_PLUS">PLA+</option>
              <option value="PETG">PETG</option>
              <option value="ABS">ABS</option>
              <option value="TPU">TPU</option>
              <option value="RESIN_STD">Resin</option>
            </select>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            )}
            <span className="ml-auto text-sm text-slate-500">
              {data != null ? `Showing ${data.items.length} of ${data.total} models` : ""}
            </span>
          </div>
          {hasFilters && (
            <div className="mt-2 flex flex-wrap gap-2">
              {category && (
                <Badge variant="secondary" className="rounded-lg">
                  {categories.find((c) => c.slug === category)?.name ?? category}
                  <button type="button" onClick={() => setCategory("")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {material && (
                <Badge variant="secondary" className="rounded-lg">
                  {material}
                  <button type="button" onClick={() => setMaterial("")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Item grid */}
      <section className="bg-slate-50/50 py-8">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="aspect-square bg-slate-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.map((item) => (
                  <CatalogueCard key={item.id} item={item} />
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </Button>
                  <span className="flex items-center px-4 text-sm text-slate-600">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-600">No models match your filters.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
