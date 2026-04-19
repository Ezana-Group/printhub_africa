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
  exportToPostiz: boolean;
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

  const MARKETPLACE_SYNC = [
    { field: "exportToGoogle", label: "Google Merchant" },
    { field: "exportToMeta", label: "Meta Marketplace" },
    { field: "exportToTiktok", label: "TikTok Shop" },
    { field: "exportToJiji", label: "Jiji" },
    { field: "exportToOlxKenya", label: "OLX Kenya" },
    { field: "exportToPigiaMe", label: "PigiaMe" },
    { field: "exportToBingPlaces", label: "Bing Places" },
    { field: "exportToAppleMaps", label: "Apple Maps" },
    { field: "exportToGoogleBiz", label: "Google Biz" },
  ] as const;

  const SOCIAL_ADVERTISING = [
    { field: "exportToInstagramReels", label: "IG Reels" },
    { field: "exportToInstagramStories", label: "IG Stories" },
    { field: "exportToYoutubeShorts", label: "YT Shorts" },
    { field: "exportToWhatsappStatus", label: "WA Status" },
    { field: "exportToWhatsappChannel", label: "WA Channel" },
    { field: "exportToLinkedIn", label: "LinkedIn" },
    { field: "exportToPinterest", label: "Pinterest" },
    { field: "exportToX", label: "X (Twitter)" },
    { field: "exportToSnapchat", label: "Snapchat" },
    { field: "exportToYoutube", label: "YouTube" },
    { field: "exportToTelegram", label: "Telegram" },
    { field: "exportToReddit", label: "Reddit" },
    { field: "exportToLinkedInNewsletter", label: "LI News" },
    { field: "exportToMedium", label: "Medium" },
    { field: "exportToNextdoor", label: "Nextdoor" },
    { field: "exportToGoogleDiscover", label: "Discover" },
    { field: "exportToGoogleMapsPost", label: "Maps Post" },
    { field: "exportToPostiz", label: "Postiz" },
    { field: "featuredThisWeek", label: "SMS Spotlight" },
  ] as const;

  const renderHeaderGroup = (title: string, items: readonly { field: string; label: string }[]) => (
    <>
      <th colSpan={items.length} className="bg-slate-50/80 p-2 text-center border-x border-slate-200">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
      </th>
    </>
  );

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

      <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-sm text-left border-collapse min-w-[2500px]">
          <thead>
            <tr className="border-b border-border/60">
              <th className="sticky left-0 z-30 bg-slate-50 p-4 min-w-[200px] border-r border-slate-200"></th>
              {renderHeaderGroup("Marketplace & Shop Sync", MARKETPLACE_SYNC)}
              {renderHeaderGroup("Social Advertising & Content Hooks", SOCIAL_ADVERTISING)}
            </tr>
            <tr className="bg-muted/50 border-b border-border/60">
              <th className="sticky left-0 z-30 bg-slate-50 p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                Product Name
              </th>
              {[...MARKETPLACE_SYNC, ...SOCIAL_ADVERTISING].map((p, idx) => (
                <th key={p.field} className={`p-3 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-center border-r border-border/10 ${idx === MARKETPLACE_SYNC.length - 1 ? 'border-r-slate-300' : ''}`}>
                  <div className="flex flex-col items-center gap-2 min-w-[70px]">
                    <span className="truncate w-full block px-1">{p.label}</span>
                    <div className="flex gap-1 scale-90">
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
                <td className="sticky left-0 z-20 bg-white p-4 border-r border-border/60 shadow-[2px_0_5px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors text-xs whitespace-nowrap">{p.name}</span>
                    <span className="text-[9px] uppercase text-slate-400 font-bold tracking-tight">{p.categoryName}</span>
                  </div>
                </td>
                
                {[...MARKETPLACE_SYNC, ...SOCIAL_ADVERTISING].map((platform, idx) => (
                  <td key={platform.field} className={`p-2 text-center border-r border-border/10 ${idx === MARKETPLACE_SYNC.length - 1 ? 'border-r-slate-300' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      checked={p[platform.field]}
                      onChange={(e) => toggleExport(p.id, platform.field, e.target.checked)}
                      disabled={saving === p.id}
                    />
                  </td>
                ))}
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={100} className="p-10 text-center text-muted-foreground italic">
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
