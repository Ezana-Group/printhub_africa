"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

const DualRangeSlider = ({ min, max, value, onChange }: { min: number, max: number, value: [number, number], onChange: (v: [number, number]) => void }) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  
  useEffect(() => { setMinVal(value[0]); setMaxVal(value[1]); }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(e.target.value);
    if (v >= maxVal) v = maxVal - 1;
    v = Math.max(v, min);
    setMinVal(v);
    onChange([v, maxVal]);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = Number(e.target.value);
    if (v <= minVal) v = minVal + 1;
    v = Math.min(Math.max(v, min), max);
    setMaxVal(v);
    onChange([minVal, v]);
  };

  // Safe percentages
  const range = (max - min) || 1;
  const percentMin = Math.max(0, Math.min(100, Math.round(((minVal - min) / range) * 100)));
  const percentMax = Math.max(0, Math.min(100, Math.round(((maxVal - min) / range) * 100)));

  return (
    <div className="relative w-full pt-4 pb-4">
      <div className="absolute top-5 left-0 right-0 h-[6px] bg-slate-200 rounded-full" />
      <div 
        className="absolute top-5 h-[6px] bg-[#FF4D00] rounded-full transition-all duration-75 ease-linear pointer-events-none"
        style={{ left: `${percentMin}%`, width: `${percentMax - percentMin}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={handleMinChange}
        className="absolute top-4 w-full h-3 opacity-0 cursor-pointer pointer-events-none appearance-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={handleMaxChange}
        className="absolute top-4 w-full h-3 opacity-0 cursor-pointer pointer-events-none appearance-none [&::-webkit-slider-thumb]:pointer-events-auto"
        style={{ zIndex: 4 }}
      />
      
      {/* Visual thumbs */}
      <div className="absolute top-[15px] h-4 w-4 rounded-full bg-white border-[3px] border-[#FF4D00] shadow pointer-events-none transition-all duration-75 ease-linear" style={{ left: `calc(${percentMin}% - 8px)` }} />
      <div className="absolute top-[15px] h-4 w-4 rounded-full bg-white border-[3px] border-[#FF4D00] shadow pointer-events-none transition-all duration-75 ease-linear" style={{ left: `calc(${percentMax}% - 8px)` }} />
    </div>
  );
};

export function ShopContent() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1", 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter States
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  
  const initialTags = searchParams.get("tags") ? searchParams.get("tags")!.split(",") : [];
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const [minPrice, setMinPrice] = useState<number | null>(searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null);
  const [maxPrice, setMaxPrice] = useState<number | null>(searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null);
  
  // Custom slider internal state so the slider is smooth without triggering massive react renders constantly
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line prefer-const
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        let all: ProductItem[] = [];
        
        const firstRes = await fetch(`/api/products?page=1&limit=24`);
        if (!firstRes.ok) throw new Error("Fetch failed");
        const firstJson = await firstRes.json();
        
        all = [...(firstJson.items || [])];
        const totalP = firstJson.totalPages || 1;
        
        if (totalP > 1) {
          const reqs = [];
          for (let p = 2; p <= totalP; p++) reqs.push(fetch(`/api/products?page=${p}&limit=24`).then(r => r.json()));
          const results = await Promise.all(reqs);
          for (const res of results) if (res.items) all = [...all, ...res.items];
        }
        
        if (isMounted) {
          // Process string values
          all.forEach(p => {
             p.basePrice = Number(p.basePrice) || 0;
          });
          setAllProducts(all);
        }
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const currentParams = params.toString();
    
    if (q) params.set("q", q); else params.delete("q");
    if (category) params.set("category", category); else params.delete("category");
    if (sort !== "newest") params.set("sort", sort); else params.delete("sort");
    if (inStock) params.set("inStock", "true"); else params.delete("inStock");
    
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(",")); 
    else params.delete("tags");
    
    if (minPrice !== null) params.set("minPrice", String(minPrice)); else params.delete("minPrice");
    if (maxPrice !== null) params.set("maxPrice", String(maxPrice)); else params.delete("maxPrice");
    
    if (page !== 1) params.set("page", String(page)); else params.delete("page");

    if (params.toString() !== currentParams) {
       const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
       window.history.replaceState(null, "", newUrl);
    }
  }, [q, category, sort, inStock, selectedTags, minPrice, maxPrice, page]);

  // Derived Values
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => p.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [allProducts]);

  const { absMin, absMax } = useMemo(() => {
    if (allProducts.length === 0) return { absMin: 0, absMax: 5000 };
    const prices = allProducts.map(p => p.basePrice).filter(p => !isNaN(p));
    if (prices.length === 0) return { absMin: 0, absMax: 5000 };
    return { absMin: Math.floor(Math.min(...prices)), absMax: Math.ceil(Math.max(...prices)) };
  }, [allProducts]);

  // Initialize slider when products load if not set
  useEffect(() => {
    if (!loading && allProducts.length > 0 && sliderRange === null) {
      setSliderRange([minPrice ?? absMin, maxPrice ?? absMax]);
    }
  }, [loading, allProducts, sliderRange, minPrice, maxPrice, absMin, absMax]);

  // Helper to get cat and children slugs
  const getCategorySlugs = useCallback((slug: string) => {
    const parent = categories.find(c => c.slug === slug);
    if (!parent) return [slug];
    const childrenSlugs = categories.filter(c => c.parentId === parent.id).map(c => c.slug);
    return [slug, ...childrenSlugs];
  }, [categories]);

  // Client-Side Apply Filters
  const { filteredProducts, categoryCounts } = useMemo(() => {
    let filtered = [...allProducts];

    // Filter by Search Query
    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(lowerQ) || p.slug.includes(lowerQ));
    }
    
    // Filter by In Stock
    if (inStock) {
      filtered = filtered.filter(p => p.stock > 0);
    }

    // Filter by Price
    if (minPrice !== null || maxPrice !== null) {
      const min = minPrice ?? absMin;
      const max = maxPrice ?? absMax;
      filtered = filtered.filter(p => p.basePrice >= min && p.basePrice <= max);
    }

    // Filter by Tags (AND logic)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => selectedTags.every(t => (p.tags || []).includes(t)));
    }

    // Calculate dynamic category counts
    const counts: Record<string, number> = {};
    categories.forEach(c => {
       const slugs = [c.slug, ...categories.filter(sub => sub.parentId === c.id).map(s => s.slug)];
       counts[c.slug] = filtered.filter(p => slugs.includes(p.category.slug)).length;
    });

    // Finally apply Category Filter
    if (category) {
      const slugs = getCategorySlugs(category);
      filtered = filtered.filter(p => slugs.includes(p.category.slug));
    }

    // Sort
    if (sort === "price-asc") filtered.sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === "price-desc") filtered.sort((a, b) => b.basePrice - a.basePrice);
    else if (sort === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "bestselling") {
      filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else { 
      // newest
      filtered.reverse(); 
    }

    return { filteredProducts: filtered, categoryCounts: counts };
  }, [allProducts, q, inStock, minPrice, maxPrice, selectedTags, category, sort, absMin, absMax, categories, getCategorySlugs]);

  // Pagination
  const limit = 12;
  const totalPages = Math.ceil(filteredProducts.length / limit) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);

  // Actions
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setPage(1);
  };
  
  const handlePriceApply = (newRange: [number, number]) => {
    setMinPrice(newRange[0]);
    setMaxPrice(newRange[1]);
    setPage(1);
  };

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setInStock(false);
    setSort("newest");
    setSelectedTags([]);
    setMinPrice(null);
    setMaxPrice(null);
    setSliderRange([absMin, absMax]);
    setPage(1);
  };
  
  const removeFilter = (type: string, value?: string) => {
    if (type === 'q') setQ("");
    if (type === 'category') setCategory("");
    if (type === 'price') { setMinPrice(null); setMaxPrice(null); setSliderRange([absMin, absMax]); }
    if (type === 'tags' && value) setSelectedTags(prev => prev.filter(t => t !== value));
    setPage(1);
  };

  const activeFiltersCount = (q ? 1 : 0) + (category ? 1 : 0) + (minPrice !== null || maxPrice !== null ? 1 : 0) + selectedTags.length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Categories</h3>
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
          <button 
            onClick={() => { setCategory(""); setPage(1); }}
            className={cn("text-sm flex w-full items-center justify-between text-left", !category ? "text-[#FF4D00] font-medium" : "text-slate-600 hover:text-slate-900")}
          >
            All Products
          </button>
          
          {categories.filter(c => !c.parentId).map(c => {
            const count = categoryCounts[c.slug] || 0;
            const subcats = categories.filter(sub => sub.parentId === c.id);
            return (
              <div key={c.id}>
                <button 
                  onClick={() => { setCategory(c.slug); setPage(1); }}
                  disabled={count === 0}
                  className={cn("text-sm flex w-full items-center justify-between text-left", count === 0 ? "opacity-50" : "", category === c.slug ? "text-[#FF4D00] font-medium" : "text-slate-600 hover:text-slate-900", "mb-1.5 mt-1.5")}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-slate-400">({count})</span>
                </button>
                {/* Subcategories */}
                {subcats.length > 0 && (
                  <div className="pl-3 mt-1.5 space-y-1.5 border-l border-slate-100 ml-2">
                     {subcats.map(sub => {
                       const subCount = categoryCounts[sub.slug] || 0;
                       return (
                         <button 
                           key={sub.id}
                           disabled={subCount === 0}
                           onClick={() => { setCategory(sub.slug); setPage(1); }}
                           className={cn("text-sm flex w-full py-0.5 items-center justify-between text-left", subCount === 0 ? "opacity-50" : "", category === sub.slug ? "text-[#FF4D00] font-medium" : "text-slate-500 hover:text-slate-800")}
                         >
                           <span>{sub.name}</span>
                           <span className="text-xs text-slate-400">({subCount})</span>
                         </button>
                       )
                     })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Options */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Price Range</h3>
        <div className="text-sm text-[#FF4D00] font-medium mb-2 flex items-center justify-between">
            <span>KES {sliderRange?.[0].toLocaleString() ?? absMin.toLocaleString()}</span>
            <span>KES {sliderRange?.[1].toLocaleString() ?? absMax.toLocaleString()}</span>
        </div>
        
        {sliderRange && (
          <DualRangeSlider 
            min={absMin} 
            max={absMax} 
            value={sliderRange} 
            onChange={handlePriceApply} 
          />
        )}
      </div>

      {/* Tags */}
      {allAvailableTags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-semibold text-slate-900">Tags</h3>
             {selectedTags.length > 0 && (
                <button onClick={() => { setSelectedTags([]); setPage(1); }} className="text-xs text-[#FF4D00] hover:underline">Clear tags</button>
             )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allAvailableTags.map(tag => {
               const isActive = selectedTags.includes(tag);
               return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                       "px-2.5 py-1 text-xs rounded-full border transition-colors",
                       isActive ? "bg-[#FF4D00] text-white border-[#FF4D00]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {tag}
                  </button>
               )
            })}
          </div>
        </div>
      )}

      {/* In Stock */}
      <div className="flex items-center gap-2 pt-2 pb-8">
        <input
          type="checkbox"
          id="inStock"
          checked={inStock}
          onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
          className="rounded border-slate-300 text-[#FF4D00] focus:ring-[#FF4D00]"
        />
        <Label htmlFor="inStock" className="text-slate-700 cursor-pointer">In stock only</Label>
      </div>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 relative min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="font-display text-4xl font-bold text-slate-900">Shop</h1>
           <p className="text-muted-foreground mt-2">Browse our high-quality print products and services.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          <Label className="text-slate-500 whitespace-nowrap hidden sm:block">Sort by:</Label>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#FF4D00] transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="bestselling">Most Popular</option>
            <option value="name-asc">Name: A–Z</option>
          </select>
        </div>
      </div>

      {activeFiltersCount > 0 && !loading && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-2 rounded-xl border border-[#FF4D00]/20 bg-[#FF4D00]/5">
           <span className="text-xs font-semibold text-[#FF4D00] uppercase tracking-wider ml-2 mr-1">Active Filters:</span>
           {q && (
             <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
               Search: {q} <button onClick={() => removeFilter('q')} className="hover:text-red-500"><X className="h-3 w-3" /></button>
             </span>
           )}
           {category && (
             <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
               Category: {categories.find(c => c.slug === category)?.name || category} <button onClick={() => removeFilter('category')} className="hover:text-red-500"><X className="h-3 w-3" /></button>
             </span>
           )}
           {(minPrice !== null || maxPrice !== null) && (
             <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
               Price: KES {minPrice ?? absMin} – {maxPrice ?? absMax} <button onClick={() => removeFilter('price')} className="hover:text-red-500"><X className="h-3 w-3" /></button>
             </span>
           )}
           {selectedTags.map(tag => (
             <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
               Tag: {tag} <button onClick={() => removeFilter('tags', tag)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
             </span>
           ))}
           <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-800 ml-auto mr-2 underline underline-offset-2">
             Clear all filters
           </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-64 shrink-0 space-y-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm self-start sticky top-24">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-slate-50/50 rounded-xl border-slate-200 focus:border-[#FF4D00] transition-colors"
                onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
              />
            </div>
          </div>
          <FilterContent />
        </aside>

        <div className="flex-1 pb-24 min-h-[500px]">
          {loading ? (
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
               {[...Array(6)].map((_, i) => (
                 <Skeleton key={i} className="aspect-square rounded-2xl" />
               ))}
             </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 mb-4 tracking-wide">
                Showing {Math.min((page - 1) * limit + 1, filteredProducts.length)} - {Math.min(page * limit, filteredProducts.length)} of {filteredProducts.length} products
                {activeFiltersCount > 0 ? " (filtered)" : ""}
              </p>
              
              <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((p) => (
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
              
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2 items-center">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                    className="rounded-xl border-slate-200 text-slate-600"
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1 mx-2">
                     {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                        let p = page;
                        if (totalPages > 5) {
                           if (page < 3) p = idx + 1;
                           else if (page > totalPages - 2) p = totalPages - 4 + idx;
                           else p = page - 2 + idx;
                        } else {
                           p = idx + 1;
                        }
                        
                        return (
                           <button 
                             key={p} 
                             onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                             className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors", page === p ? "bg-[#FF4D00] text-white" : "text-slate-600 hover:bg-slate-100")}
                           >
                             {p}
                           </button>
                        )
                     })}
                  </div>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                    className="rounded-xl border-slate-200 text-slate-600"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 px-4 mt-6 border border-dashed border-slate-300 rounded-3xl bg-slate-50/50">
               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                 <Search className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
               <p className="text-slate-500 mb-6 text-center max-w-sm">
                 We couldn&apos;t find any products matching your active filters. Try adjusting them or clearing filters to see more.
               </p>
               <Button onClick={clearFilters} className="rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white">
                 Clear all filters
               </Button>
             </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 z-40 mx-4 md:hidden flex justify-center pointer-events-none">
         <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
               <Button className="pointer-events-auto shadow-xl rounded-full h-14 bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white px-8 font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
                 <SlidersHorizontal className="w-5 h-5" />
                 Filters {activeFiltersCount > 0 && <span className="bg-white text-[#FF4D00] w-6 h-6 rounded-full flex items-center justify-center text-xs ml-1">{activeFiltersCount}</span>}
               </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 flex flex-col bg-slate-50 border-r-0">
               <SheetHeader className="p-6 pb-4 border-b border-slate-200 bg-white sticky top-0 z-10 text-left">
                  <div className="flex items-center justify-between">
                     <SheetTitle className="font-display text-xl text-slate-900">Filters</SheetTitle>
                     <SheetClose asChild>
                        <button className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">
                           <X className="w-4 h-4" />
                        </button>
                     </SheetClose>
                  </div>
               </SheetHeader>
               
               <div className="flex-1 overflow-y-auto p-6">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search products..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-9 bg-white rounded-xl border-slate-200 focus:border-[#FF4D00]"
                    />
                  </div>
                  <FilterContent />
               </div>

               <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex gap-3">
                  {activeFiltersCount > 0 && (
                     <Button variant="outline" onClick={() => { clearFilters(); setIsMobileOpen(false); }} className="flex-1 rounded-xl h-12">
                        Clear All
                     </Button>
                  )}
                  <Button onClick={() => setIsMobileOpen(false)} className="flex-1 rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white h-12">
                     Show {filteredProducts.length} Results
                  </Button>
               </div>
            </SheetContent>
         </Sheet>
      </div>
    </div>
  );
}
