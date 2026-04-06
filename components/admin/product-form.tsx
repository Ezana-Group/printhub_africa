"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProductImagesTab } from "@/components/admin/product-images-tab";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";
import { CategoryCascadingSelect } from "@/components/admin/CategoryCascadingSelect";
import type { ProductType } from "@prisma/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    categoryId: string;
    productType: ProductType;
    basePrice: number;
    comparePrice: number | null;
    sku: string | null;
    stock: number | null;
    minOrderQty: number;
    maxOrderQty: number | null;
    images: string[];
    materials: string[];
    colors: string[];
    isActive: boolean;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    tags?: string[];
    featuredThisWeek: boolean;
    exportToGoogle: boolean;
    exportToGoogleBiz: boolean;
    exportToLinkedIn: boolean;
    exportToMeta: boolean;
    exportToPinterest: boolean;
    exportToTiktok: boolean;
    exportToX: boolean;
    exportToGoogleDiscover: boolean;
    exportToInstagramReels: boolean;
    exportToInstagramStories: boolean;
    exportToJiji: boolean;
    exportToTelegram: boolean;
    exportToWhatsappChannel: boolean;
    exportToWhatsappStatus: boolean;
    exportToYoutubeShorts: boolean;
    exportToAppleMaps: boolean;
    exportToBingPlaces: boolean;
    exportToGoogleMapsPost: boolean;
    exportToLinkedInNewsletter: boolean;
    exportToMedium: boolean;
    exportToNextdoor: boolean;
    exportToOlxKenya: boolean;
    exportToPigiaMe: boolean;
    exportToReddit: boolean;
    exportToSnapchat: boolean;
    exportToYoutube: boolean;
  };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [description, setDescription] = useState(product?.description ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [productType, setProductType] = useState<ProductType>(product?.productType ?? "READYMADE_3D");
  
  const handleTypeChange = (value: ProductType) => {
    setProductType(value);
    if (value === "POD") {
      setStock("0");
    }
  };
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? 0));
  const [comparePrice, setComparePrice] = useState(product?.comparePrice != null ? String(product.comparePrice) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minOrderQty, setMinOrderQty] = useState(String(product?.minOrderQty ?? 1));
  const [maxOrderQty, setMaxOrderQty] = useState(product?.maxOrderQty != null ? String(product.maxOrderQty) : "");
  const [imagesStr, setImagesStr] = useState((product?.images ?? []).join("\n"));
  const [materialsStr, setMaterialsStr] = useState((product?.materials ?? []).join(", "));
  const [colorsStr, setColorsStr] = useState((product?.colors ?? []).join(", "));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [featuredThisWeek, setFeaturedThisWeek] = useState(product?.featuredThisWeek ?? false);
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");
  const [tagsStr, setTagsStr] = useState((product?.tags ?? []).join(", "));

  const [exportSettings, setExportSettings] = useState({
    exportToGoogle: product?.exportToGoogle ?? true,
    exportToGoogleBiz: product?.exportToGoogleBiz ?? true,
    exportToMeta: product?.exportToMeta ?? true,
    exportToTiktok: product?.exportToTiktok ?? true,
    exportToGoogleMapsPost: product?.exportToGoogleMapsPost ?? true,
    exportToLinkedIn: product?.exportToLinkedIn ?? false,
    exportToPinterest: product?.exportToPinterest ?? false,
    exportToX: product?.exportToX ?? false,
    exportToGoogleDiscover: product?.exportToGoogleDiscover ?? false,
    exportToInstagramReels: product?.exportToInstagramReels ?? false,
    exportToInstagramStories: product?.exportToInstagramStories ?? false,
    exportToJiji: product?.exportToJiji ?? false,
    exportToTelegram: product?.exportToTelegram ?? false,
    exportToWhatsappStatus: product?.exportToWhatsappStatus ?? false,
    exportToWhatsappChannel: product?.exportToWhatsappChannel ?? false,
    exportToYoutubeShorts: product?.exportToYoutubeShorts ?? false,
    exportToAppleMaps: product?.exportToAppleMaps ?? false,
    exportToBingPlaces: product?.exportToBingPlaces ?? false,
    exportToLinkedInNewsletter: product?.exportToLinkedInNewsletter ?? false,
    exportToMedium: product?.exportToMedium ?? false,
    exportToNextdoor: product?.exportToNextdoor ?? false,
    exportToOlxKenya: product?.exportToOlxKenya ?? false,
    exportToPigiaMe: product?.exportToPigiaMe ?? false,
    exportToReddit: product?.exportToReddit ?? false,
    exportToSnapchat: product?.exportToSnapchat ?? false,
    exportToYoutube: product?.exportToYoutube ?? false,
  });

  const toggleExport = (field: keyof typeof exportSettings) => {
    setExportSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const tagsArray = tagsStr.split(",").map((s) => s.trim()).filter(Boolean);
  const hasTag = (name: string) => tagsArray.some((t) => t.toLowerCase() === name.toLowerCase());
  const setTagPreset = (name: string, checked: boolean) => {
    const next = checked
      ? [...tagsArray, name].filter((t, i, a) => a.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
      : tagsArray.filter((t) => t.toLowerCase() !== name.toLowerCase());
    setTagsStr(next.join(", "));
  };

  const handleNameChange = (v: string) => {
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  };

  const handleAiGenerate = async (action: string) => {
    if (!isEdit) {
      setError("Please save the product first before generating AI content.");
      return;
    }
    setAiLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");
      setSuccess("AI generation triggered! Please refresh in a few seconds to see changes.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const images = isEdit ? undefined : (imagesStr.trim() ? imagesStr.split(/\n/).map((s) => s.trim()).filter(Boolean) : []);
    const materials = materialsStr.trim() ? materialsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const colors = colorsStr.trim() ? colorsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const payload: Record<string, unknown> = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      categoryId,
      productType,
      basePrice: parseFloat(basePrice) || 0,
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      stock: parseInt(stock, 10) || 0,
      minOrderQty: parseInt(minOrderQty, 10) || 1,
      maxOrderQty: maxOrderQty ? parseInt(maxOrderQty, 10) : undefined,
      materials,
      colors,
      isActive,
      isFeatured,
      featuredThisWeek,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ...exportSettings,
      ...(images != null && { images }),
    };
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Update failed");
        router.push("/admin/products");
        router.refresh();
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Create failed");
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || success) && (
        <div className={`rounded-lg p-3 text-sm ${error ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {error || success}
        </div>
      )}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Basic info</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-from-name"
              />
              {!isEdit && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => setAutoSlug(e.target.checked)}
                  />
                  Auto
                </label>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="shortDescription">Short description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <div className="mt-1">
              <SmartTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Detailed product description (HTML/Rich Text)"
                minHeight="200px"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <CategoryCascadingSelect
                categories={categories}
                value={categoryId}
                onChange={(val) => setCategoryId(val || "")}
              />
            </div>
            <div>
              <Label htmlFor="productType">Product type</Label>
              <select
                id="productType"
                value={productType}
                onChange={(e) => handleTypeChange(e.target.value as ProductType)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="READYMADE_3D">Ready-made 3D</option>
                <option value="LARGE_FORMAT">Large format</option>
                <option value="CUSTOM">3D Service</option>
                <option value="PRINT_ON_DEMAND">Print-On-Demand</option>
                <option value="POD">POD</option>
                <option value="SERVICE">Other Service</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="stock">Quantity (stock)</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Pricing</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Base price (KES) *</Label>
              <Input
                id="basePrice"
                type="number"
                min={0}
                step={0.01}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="comparePrice">Compare at price (KES)</Label>
              <Input
                id="comparePrice"
                type="number"
                min={0}
                step={0.01}
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrderQty">Min order qty</Label>
              <Input
                id="minOrderQty"
                type="number"
                min={1}
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxOrderQty">Max order qty</Label>
              <Input
                id="maxOrderQty"
                type="number"
                min={1}
                value={maxOrderQty}
                onChange={(e) => setMaxOrderQty(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Media & attributes</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEdit && product?.id ? (
            <ProductImagesTab
              productId={product.id}
              initialImages={(product.images ?? []).map((url, i) => ({
                url,
                isMain: i === 0,
                sortOrder: i,
                source: "url" as const,
              }))}
            />
          ) : (
            <>
              <div>
                <Label className="mb-1 block">Upload images</Label>
                <p className="text-xs text-muted-foreground mb-2">JPEG, PNG, WebP · Max 8 · First = featured</p>
                <FileUploader
                  context="ADMIN_PRODUCT_IMAGE"
                  accept={["image/jpeg", "image/png", "image/webp"]}
                  maxSizeMB={20}
                  maxFiles={8}
                  hint="Uploaded images will be added below. You can also paste URLs."
                  onUploadComplete={(files) => {
                    const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_R2_PUBLIC_URL : "";
                    const urls = files.map((f) => f.publicUrl ?? (base && f.storageKey ? `${base}/${f.storageKey}` : f.storageKey));
                    setImagesStr((prev) => (prev ? `${prev}\n${urls.join("\n")}` : urls.join("\n")));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="images">Image URLs (one per line)</Label>
                <Textarea
                  id="images"
                  value={imagesStr}
                  onChange={(e) => setImagesStr(e.target.value)}
                  rows={3}
                  placeholder="https://... or upload above"
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">First URL = featured. Max 8. JPG/PNG/WEBP.</p>
              </div>
            </>
          )}
          <div>
            <Label htmlFor="materials">Materials (comma-separated)</Label>
            <Input
              id="materials"
              value={materialsStr}
              onChange={(e) => setMaterialsStr(e.target.value)}
              placeholder="PLA, Resin"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="colors">Colors (comma-separated)</Label>
            <Input
              id="colors"
              value={colorsStr}
              onChange={(e) => setColorsStr(e.target.value)}
              placeholder="White, Black"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 bg-indigo-50/5 shadow-sm">
        <CardHeader className="pb-3 border-b border-indigo-100/50">
          <h2 className="font-bold text-indigo-900 flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-100 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </div>
            Marketing & Distribution
          </h2>
          <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider mt-1">Automatic Cloud Sync Settings</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-indigo-100"></span>
              Marketplace & Shop Sync
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { field: "exportToGoogle", label: "Google Merchant" },
                { field: "exportToMeta", label: "Meta Marketplace" },
                { field: "exportToTiktok", label: "TikTok Shop" },
                { field: "exportToJiji", label: "Jiji" },
                { field: "exportToOlxKenya", label: "OLX Kenya" },
                { field: "exportToPigiaMe", label: "PigiaMe" },
                { field: "exportToBingPlaces", label: "Bing Places" },
                { field: "exportToAppleMaps", label: "Apple Maps" },
                { field: "exportToGoogleBiz", label: "Google Biz" },
              ].map((item) => (
                <label key={item.field} className="flex items-center gap-2 p-2 rounded-lg border border-indigo-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={exportSettings[item.field as keyof typeof exportSettings]}
                    onChange={() => toggleExport(item.field as keyof typeof exportSettings)}
                    className="w-4 h-4 rounded text-indigo-600 border-indigo-200 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-800">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-indigo-100/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-indigo-100"></span>
              Social Posting & Advertising
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
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
              ].map((item) => (
                <label key={item.field} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={exportSettings[item.field as keyof typeof exportSettings]}
                    onChange={() => toggleExport(item.field as keyof typeof exportSettings)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Status & SEO</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm font-medium">Visible on storefront</span>
              <span className="text-xs text-muted-foreground">(hide to remove from shop)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer border border-indigo-100 bg-indigo-50/30 p-2 rounded-md">
              <input type="checkbox" checked={featuredThisWeek} onChange={(e) => setFeaturedThisWeek(e.target.checked)} />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-indigo-700">Weekly AI Spotlight</span>
                <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-tight">SMS Broadcast Candidate</span>
              </div>
            </label>
          </div>
          <p className="text-sm font-medium text-slate-700">Tags (shown on cards and homepage)</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasTag("New arrival")}
                onChange={(e) => setTagPreset("New arrival", e.target.checked)}
              />
              <span className="text-sm">New arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasTag("Staff pick")}
                onChange={(e) => setTagPreset("Staff pick", e.target.checked)}
              />
              <span className="text-sm">Staff pick</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasTag("Popular")}
                onChange={(e) => setTagPreset("Popular", e.target.checked)}
              />
              <span className="text-sm">Popular</span>
            </label>
          </div>
          <div>
            <Label htmlFor="tags">Other tags</Label>
            <Input
              id="tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="New design, Bestseller"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Comma-separated. Use the toggles above or type your own.</p>
          </div>

          {isEdit && (
            <div className="pt-4 border-t space-y-3">
               <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider font-mono">AI Content Engine</Label>
               <div className="grid grid-cols-2 gap-3">
                 <Button 
                   type="button" 
                   variant="outline" 
                   size="sm" 
                   className="w-full flex items-center justify-center gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                   disabled={aiLoading}
                   onClick={() => handleAiGenerate("GENERATE_DESCRIPTION")}
                 >
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                   {aiLoading ? "Thinking..." : "AI Description"}
                 </Button>
                 <Button 
                   type="button" 
                   variant="outline" 
                   size="sm" 
                   className="w-full flex items-center justify-center gap-2 border-pink-200 hover:bg-pink-50 hover:text-pink-700 transition-colors"
                   disabled={aiLoading}
                   onClick={() => handleAiGenerate("GENERATE_AD_COPY")}
                 >
                   <div className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-ping" />
                   {aiLoading ? "Strategizing..." : "AI Ad Copy"}
                 </Button>
               </div>
               <p className="text-[10px] text-muted-foreground text-center italic">
                 Generates professional descriptions, SEO tags and multi-platform ad variations.
               </p>
            </div>
          )}
          <div>
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update product" : "Create product"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
