"use client";

import { useState, useTransition } from "react";
import { Search, Filter, Save, CheckCircle2, XCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  exportToGoogle: boolean;
  exportToMeta: boolean;
  exportToTiktok: boolean;
  exportToLinkedIn: boolean;
  exportToPinterest: boolean;
  exportToX: boolean;
  exportToGoogleBiz: boolean;
  exportToSnapchat: boolean;
  exportToYoutube: boolean;
  exportToInstagramStories: boolean;
  exportToInstagramReels: boolean;
  exportToYoutubeShorts: boolean;
  exportToWhatsappStatus: boolean;
  exportToWhatsappChannel: boolean;
  exportToTelegram: boolean;
  exportToGoogleDiscover: boolean;
  exportToGoogleMapsPost: boolean;
  exportToBingPlaces: boolean;
  exportToAppleMaps: boolean;
  exportToPigiaMe: boolean;
  exportToOlxKenya: boolean;
  exportToReddit: boolean;
  exportToLinkedInNewsletter: boolean;
  exportToMedium: boolean;
  exportToNextdoor: boolean;
  exportToJiji: boolean;
  featuredThisWeek: boolean;
}

export function ProductExportTable({ 
  initialProducts, 
  categories 
}: { 
  initialProducts: Product[];
  categories: { id: string; name: string }[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.categoryName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleExport = async (productId: string, field: keyof Product, value: boolean) => {
    setSaving(productId);
    
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p));

    try {
      const res = await fetch(`/api/admin/products/${productId}/export`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error(err);
      // Revert if error
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: !value } : p));
    } finally {
      setSaving(null);
    }
  };

  const bulkToggle = async (field: keyof Product, value: boolean) => {
    if (!confirm(`Are you sure you want to ${value ? 'enable' : 'disable'} ${field.replace('exportTo', '')} for all filtered products?`)) return;
    
    const targetIds = filteredProducts.map(p => p.id);
    
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/products/export-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: targetIds, field, value }),
        });
        
        if (res.ok) {
          setProducts(prev => prev.map(p => targetIds.includes(p.id) ? { ...p, [field]: value } : p));
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const platforms = [
    { field: "exportToGoogle", label: "Google" },
    { field: "exportToMeta", label: "Meta" },
    { field: "exportToTiktok", label: "TikTok" },
    { field: "exportToLinkedIn", label: "LinkedIn" },
    { field: "exportToPinterest", label: "Pinterest" },
    { field: "exportToX", label: "X" },
    { field: "exportToGoogleBiz", label: "G-Biz" },
    { field: "exportToSnapchat", label: "Snapchat" },
    { field: "exportToYoutube", label: "YouTube" },
    { field: "exportToInstagramStories", label: "IG Stories" },
    { field: "exportToInstagramReels", label: "IG Reels" },
    { field: "exportToYoutubeShorts", label: "YT Shorts" },
    { field: "exportToWhatsappStatus", label: "WA Status" },
    { field: "exportToWhatsappChannel", label: "WA Channel" },
    { field: "exportToTelegram", label: "Telegram" },
    { field: "exportToGoogleDiscover", label: "Discover" },
    { field: "exportToGoogleMapsPost", label: "Maps Post" },
    { field: "exportToBingPlaces", label: "Bing" },
    { field: "exportToAppleMaps", label: "Apple" },
    { field: "exportToPigiaMe", label: "PigiaMe" },
    { field: "exportToOlxKenya", label: "OLX" },
    { field: "exportToReddit", label: "Reddit" },
    { field: "exportToLinkedInNewsletter", label: "LI News" },
    { field: "exportToMedium", label: "Medium" },
    { field: "exportToNextdoor", label: "Nextdoor" },
    { field: "exportToJiji", label: "Jiji" },
    { field: "featuredThisWeek", label: "SMS Feature" },
  ] as const;

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-lg overflow-hidden flex flex-col transition-all duration-500 hover:shadow-primary/5">
      <div className="p-5 border-b flex flex-wrap items-center gap-4 bg-muted/20">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/60 bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="text-sm rounded-lg border border-border/60 bg-background py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border/60">
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Product</th>
              {platforms.map(p => (
                <th key={p.field} className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span>{p.label}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => bulkToggle(p.field, true)}
                        className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                        title={`Enable all filtered for ${p.label}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </button>
                      <button 
                         onClick={() => bulkToggle(p.field, false)}
                        className="p-1 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                        title={`Disable all filtered for ${p.label}`}
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-all duration-200 group">
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-primary transition-colors">{p.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">{p.categoryName}</span>
                  </div>
                </td>
                
                {platforms.map(platform => (
                  <td key={platform.field} className="p-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={p[platform.field]}
                        onChange={(e) => toggleExport(p.id, platform.field, e.target.checked)}
                        disabled={saving === p.id}
                      />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border/60 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-all duration-300"></div>
                    </label>
                  </td>
                ))}
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={30} className="p-10 text-center text-muted-foreground italic">
                  No products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
