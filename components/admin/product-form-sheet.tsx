"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CategoryCascadingSelect } from "@/components/admin/CategoryCascadingSelect";
import { Switch } from "@/components/ui/switch";
import type { ProductRow } from "@/components/admin/products-admin-client";
import { ProductImagesTab } from "@/components/admin/product-images-tab";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";
import { ProductMaterialSelector } from "@/components/admin/ProductMaterialSelector";
import { Sparkles, Zap, Megaphone, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ProductType } from "@prisma/client";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductRow | null;
  categories: { id: string; name: string; slug: string }[];
  onSuccess: () => void;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: ProductFormSheetProps) {
  // AUDIT FIX: Treat product.id === 'new' as duplicate (create) mode so form POSTs instead of PATCH
  const isEdit = !!product && product.id !== "new";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "images" | "materials" | "seo" | "marketing">("details");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState<ProductType>("READYMADE_3D");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPOD, setIsPOD] = useState(false);
  const [imagesStr, setImagesStr] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredThisWeek, setFeaturedThisWeek] = useState(false);
  const [exportToGoogle, setExportToGoogle] = useState(true);
  const [exportToGoogleBiz, setExportToGoogleBiz] = useState(true);
  const [exportToLinkedIn, setExportToLinkedIn] = useState(false);
  const [exportToMeta, setExportToMeta] = useState(true);
  const [exportToPinterest, setExportToPinterest] = useState(false);
  const [exportToTiktok, setExportToTiktok] = useState(true);
  const [exportToX, setExportToX] = useState(false);
  const [exportToGoogleDiscover, setExportToGoogleDiscover] = useState(false);
  const [exportToInstagramReels, setExportToInstagramReels] = useState(false);
  const [exportToInstagramStories, setExportToInstagramStories] = useState(false);
  const [exportToJiji, setExportToJiji] = useState(false);
  const [exportToTelegram, setExportToTelegram] = useState(false);
  const [exportToWhatsappChannel, setExportToWhatsappChannel] = useState(false);
  const [exportToWhatsappStatus, setExportToWhatsappStatus] = useState(false);
  const [exportToYoutubeShorts, setExportToYoutubeShorts] = useState(false);
  const [exportToAppleMaps, setExportToAppleMaps] = useState(false);
  const [exportToBingPlaces, setExportToBingPlaces] = useState(false);
  const [exportToGoogleMapsPost, setExportToGoogleMapsPost] = useState(true);
  const [exportToLinkedInNewsletter, setExportToLinkedInNewsletter] = useState(false);
  const [exportToMedium, setExportToMedium] = useState(false);
  const [exportToNextdoor, setExportToNextdoor] = useState(false);
  const [exportToOlxKenya, setExportToOlxKenya] = useState(false);
  const [exportToPigiaMe, setExportToPigiaMe] = useState(false);
  const [exportToReddit, setExportToReddit] = useState(false);
  const [exportToSnapchat, setExportToSnapchat] = useState(false);
  const [exportToYoutube, setExportToYoutube] = useState(false);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.id === "new" ? `${product.name} (Copy)` : product.name);
      setSlug(product.id === "new" ? `${product.slug}-copy` : product.slug);
      setDescription(product.description ?? "");
      setShortDescription("");
      setCategoryId(product.categoryId);
      setProductType(product.productType);
      setBasePrice(String(product.basePrice));
      setComparePrice(product.comparePrice != null ? String(product.comparePrice) : "");
      setStock(String(product.stock ?? 0));
      setIsActive(product.isActive);
      setIsFeatured((product as Record<string, unknown>).isFeatured as boolean ?? false);
      setIsPOD(product.isPOD ?? false);
      setImagesStr(Array.isArray(product.images) ? product.images.join("\n") : "");
      setMetaTitle((product as any).metaTitle ?? "");
      setMetaDescription((product as any).metaDescription ?? "");
      setFeaturedThisWeek((product as any).featuredThisWeek ?? false);
      setExportToGoogle((product as any).exportToGoogle ?? true);
      setExportToGoogleBiz((product as any).exportToGoogleBiz ?? true);
      setExportToLinkedIn((product as any).exportToLinkedIn ?? false);
      setExportToMeta((product as any).exportToMeta ?? true);
      setExportToPinterest((product as any).exportToPinterest ?? false);
      setExportToTiktok((product as any).exportToTiktok ?? true);
      setExportToX((product as any).exportToX ?? false);
      setExportToGoogleDiscover((product as any).exportToGoogleDiscover ?? false);
      setExportToInstagramReels((product as any).exportToInstagramReels ?? false);
      setExportToInstagramStories((product as any).exportToInstagramStories ?? false);
      setExportToJiji((product as any).exportToJiji ?? false);
      setExportToTelegram((product as any).exportToTelegram ?? false);
      setExportToWhatsappChannel((product as any).exportToWhatsappChannel ?? false);
      setExportToWhatsappStatus((product as any).exportToWhatsappStatus ?? false);
      setExportToYoutubeShorts((product as any).exportToYoutubeShorts ?? false);
      setExportToAppleMaps((product as any).exportToAppleMaps ?? false);
      setExportToBingPlaces((product as any).exportToBingPlaces ?? false);
      setExportToGoogleMapsPost((product as any).exportToGoogleMapsPost ?? true);
      setExportToLinkedInNewsletter((product as any).exportToLinkedInNewsletter ?? false);
      setExportToMedium((product as any).exportToMedium ?? false);
      setExportToNextdoor((product as any).exportToNextdoor ?? false);
      setExportToOlxKenya((product as any).exportToOlxKenya ?? false);
      setExportToPigiaMe((product as any).exportToPigiaMe ?? false);
      setExportToReddit((product as any).exportToReddit ?? false);
      setExportToSnapchat((product as any).exportToSnapchat ?? false);
      setExportToYoutube((product as any).exportToYoutube ?? false);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setShortDescription("");
      setCategoryId(categories[0]?.id ?? "");
      setProductType("READYMADE_3D");
      setBasePrice("");
      setComparePrice("");
      setStock("0");
      setIsActive(true);
      setIsFeatured(false);
      setIsPOD(false);
      setImagesStr("");
      setMetaTitle("");
      setMetaDescription("");
      setFeaturedThisWeek(false);
      setExportToGoogle(true);
      setExportToGoogleBiz(true);
      setExportToLinkedIn(false);
      setExportToMeta(true);
      setExportToPinterest(false);
      setExportToTiktok(true);
      setExportToX(false);
      setExportToGoogleDiscover(false);
      setExportToInstagramReels(false);
      setExportToInstagramStories(false);
      setExportToJiji(false);
      setExportToTelegram(false);
      setExportToWhatsappChannel(false);
      setExportToWhatsappStatus(false);
      setExportToYoutubeShorts(false);
      setExportToAppleMaps(false);
      setExportToBingPlaces(false);
      setExportToGoogleMapsPost(true);
      setExportToLinkedInNewsletter(false);
      setExportToMedium(false);
      setExportToNextdoor(false);
      setExportToOlxKenya(false);
      setExportToPigiaMe(false);
      setExportToReddit(false);
      setExportToSnapchat(false);
      setExportToYoutube(false);
    }
  }, [product, categories]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const images = isEdit ? undefined : (imagesStr.trim() ? imagesStr.split(/\n/).map((s) => s.trim()).filter(Boolean) : []);
    const payload: Record<string, unknown> = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      categoryId: categoryId || categories[0]?.id,
      productType,
      basePrice: parseFloat(basePrice) || 0,
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      // SKU is auto-generated on create; omit so API generates it
      ...(isEdit && product && product.id !== "new" && (product as { sku?: string }).sku && { sku: (product as { sku: string }).sku }),
      stock: parseInt(stock, 10) || 0,
      minOrderQty: 1,
      isActive,
      isFeatured,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      featuredThisWeek,
      exportToGoogle,
      exportToGoogleBiz,
      exportToLinkedIn,
      exportToMeta,
      exportToPinterest,
      exportToTiktok,
      exportToX,
      exportToGoogleDiscover,
      exportToInstagramReels,
      exportToInstagramStories,
      exportToJiji,
      exportToTelegram,
      exportToWhatsappChannel,
      exportToWhatsappStatus,
      exportToYoutubeShorts,
      exportToAppleMaps,
      exportToBingPlaces,
      exportToGoogleMapsPost,
      exportToLinkedInNewsletter,
      exportToMedium,
      exportToNextdoor,
      exportToOlxKenya,
      exportToPigiaMe,
      exportToReddit,
      exportToSnapchat,
      exportToYoutube,
      ...(images != null && { images }),
    };
    try {
      if (isEdit && product && product.id !== "new") {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Update failed");
        onSuccess();
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Create failed");
        
        // AUTO-VISION TRIGGER: DISABLED (per user request for manual-first flow)
        /*
        if (images && images.length > 0) {
          setIsAnalyzing(true);
          handleAiGenerate("GENERATE_DESCRIPTION", data.product?.id);
        } else {
          onSuccess();
        }
        */
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "details" as const, label: "Details" },
    { id: "pricing" as const, label: "Pricing" },
    { id: "images" as const, label: "Images" },
    { id: "materials" as const, label: "Materials" },
    { id: "seo" as const, label: "SEO" },
    { id: "marketing" as const, label: "Marketing" },
  ];

  const handleAiGenerate = async (action: string, overrideId?: string) => {
    const targetId = overrideId || product?.id;
    if (!targetId) return;
    setAiGenerating(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/n8n/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productId: targetId }),
      });
      
      if (!res.ok) {
        let errMsg = "AI Trigger failed";
        try {
          const data = await res.json();
          errMsg = data.error || data.message || `AI Trigger failed (${res.status})`;
        } catch {
          errMsg = `AI Trigger failed with status ${res.status}`;
        }
        throw new Error(errMsg);
      }

      // POLL FOR RESULT
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
        
        const statusRes = await fetch(`/api/admin/products/${targetId}/ai-status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.complete) {
            // Update fields based on what was generated, only if empty or user confirms
            const updateIfEmptyOrConfirmed = (val: string, setter: (v: string) => void, current: string, label: string) => {
              if (!val) return;
              const cleanVal = val.trim();
              const cleanCurrent = (current || "").trim();
              
              if (!cleanCurrent) {
                setter(cleanVal);
              } else if (cleanVal !== cleanCurrent) {
                if (confirm(`AI has generated a new ${label}. Overwrite your current content?`)) {
                  setter(cleanVal);
                }
              }
            };

            // If we specifically requested SEO, we mainly care about titles/desc
            if (action === "GENERATE_SEO") {
              if (statusData.metaTitle) setMetaTitle(statusData.metaTitle);
              if (statusData.metaDescription) setMetaDescription(statusData.metaDescription);
            } else {
              // Direct update for descriptions if they are currently short or empty
              const isShort = (s: string) => !s || s.length < 150;
              
              if (statusData.description && (isShort(description) || confirm("AI generated a new long description. Overwrite?"))) {
                setDescription(statusData.description);
              }
              if (statusData.shortDescription && isShort(shortDescription)) {
                setShortDescription(statusData.shortDescription);
              }
              if (statusData.metaTitle && isShort(metaTitle)) setMetaTitle(statusData.metaTitle);
              if (statusData.metaDescription && isShort(metaDescription)) setMetaDescription(statusData.metaDescription);
            }
            
            toast.success("AI Content Updated!");
            break;
          }
        }
      }
    } catch (e) {
      console.error("[AI Generate Error]", e);
      setError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiGenerating(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] overflow-y-auto bg-white border-[#E5E7EB]"
      >
        <SheetHeader>
          <SheetTitle className="text-[#111]">
            {isEdit ? "Edit product" : "Add product"}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex border-b border-[#E5E7EB] gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-[#6B7280] hover:text-[#111]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 py-6 overflow-y-auto">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <select
                    id="productType"
                    value={productType}
                    onChange={(e) => {
                       const val = e.target.value as ProductType;
                       setProductType(val);
                       setIsPOD(val === "POD" || val === "PRINT_ON_DEMAND");
                    }}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="READYMADE_3D">Ready-made 3D</option>
                    <option value="LARGE_FORMAT">Large Format</option>
                    <option value="CUSTOM">3D Service</option>
                    <option value="POD">Print-On-Demand (POD)</option>
                    <option value="SERVICE">Other Service</option>
                  </select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <CategoryCascadingSelect
                    categories={categories}
                    value={categoryId}
                    onChange={(val) => setCategoryId(val || "")}
                  />
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
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="description">Description</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1.5"
                      onClick={() => handleAiGenerate("GENERATE_DESCRIPTION")}
                      disabled={aiGenerating === "GENERATE_DESCRIPTION" || !isEdit}
                    >
                      {aiGenerating === "GENERATE_DESCRIPTION" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate with AI
                    </Button>
                  </div>
                  <div className="mt-1">
                    <SmartTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Detailed product description (HTML/Rich Text)"
                      minHeight="200px"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="shortDescription">Short description (150 chars)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 gap-1.5"
                      onClick={() => handleAiGenerate("GENERATE_SHORT_DESCRIPTION")}
                      disabled={aiGenerating === "GENERATE_SHORT_DESCRIPTION" || !isEdit}
                    >
                      {aiGenerating === "GENERATE_SHORT_DESCRIPTION" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Generate with AI
                    </Button>
                  </div>
                  <Input
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    maxLength={150}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch checked={isPOD} onCheckedChange={setIsPOD} />
                    <span className="text-sm">Is Print-on-Demand</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="basePrice">Base Price (KES) *</Label>
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
                  <Label htmlFor="comparePrice">Compare-at price (KES)</Label>
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
            )}

            {activeTab === "images" && (
              <ProductImagesTab
                productId={isEdit && product && product.id !== "new" ? product.id : ""}
                initialImages={(Array.isArray(product?.images) ? product.images : []).map((url, i) => ({
                  url,
                  isMain: i === 0,
                  sortOrder: i,
                  source: "url" as const,
                }))}
                onSave={() => {}}
              />
            )}

            {activeTab === "materials" && (
              <ProductMaterialSelector 
                productId={isEdit && product && product.id !== "new" ? product.id : ""} 
              />
            )}

            {activeTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="metaTitle">Meta title ({metaTitle.length}/60)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1.5"
                      onClick={() => handleAiGenerate("GENERATE_SEO")}
                      disabled={aiGenerating === "GENERATE_SEO" || !isEdit}
                    >
                      {aiGenerating === "GENERATE_SEO" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate with AI
                    </Button>
                  </div>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={60}
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="metaDescription">Meta description ({metaDescription.length}/160)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1.5"
                      onClick={() => handleAiGenerate("GENERATE_SEO")}
                      disabled={aiGenerating === "GENERATE_SEO" || !isEdit}
                    >
                      {aiGenerating === "GENERATE_SEO" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === "marketing" && (
              <div className="space-y-8 pb-10">
                {/* AI Section */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                       <Sparkles className="h-4 w-4 text-primary" />
                       AI Content Engine
                    </h3>
                    {(isAnalyzing || aiGenerating) && (
                      <Badge variant="outline" className="animate-pulse bg-primary/5 text-primary border-primary/20 gap-1.5 py-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Claude is drafting...
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">Analyze product images and generate SEO-optimized descriptions automatically.</p>
                  
                  {isAnalyzing && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-500" />
                          <p className="text-[11px] text-amber-700 font-medium">AI analysis triggered! n8n is processing your visual data.</p>
                       </div>
                       <Button 
                         type="button" 
                         variant="ghost" 
                         size="sm" 
                         className="h-7 text-xs font-bold text-amber-700 hover:bg-amber-100"
                         onClick={() => {
                            setIsAnalyzing(false);
                            onSuccess(); // This will refresh the parent list
                         }}
                       >
                         Finish & Refresh
                       </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                     <Button 
                       type="button" 
                       variant="outline" 
                       className="gap-2 bg-white border-primary/20 hover:bg-primary/5 text-primary" 
                       onClick={() => handleAiGenerate("GENERATE_DESCRIPTION")}
                       disabled={aiGenerating === "GENERATE_DESCRIPTION" || !isEdit}
                     >
                       {aiGenerating === "GENERATE_DESCRIPTION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                       Auto-Draft All
                     </Button>
                     <Button 
                       type="button" 
                       variant="outline" 
                       className="gap-2 bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-600" 
                       onClick={() => handleAiGenerate("GENERATE_AD_COPY")}
                       disabled={aiGenerating === "GENERATE_AD_COPY" || !isEdit}
                     >
                        {aiGenerating === "GENERATE_AD_COPY" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Social Ad Copy
                     </Button>
                  </div>
                  {!isEdit && <p className="text-[10px] text-amber-600 font-medium italic">Save the product first to enable AI generation.</p>}
                </div>

                {/* Spotlight Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Campaign Targeting</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-800">Weekly AI Spotlight</p>
                          <p className="text-[11px] text-slate-500">Nominate this item for weekly SMS & broadcast campaigns.</p>
                       </div>
                       <Switch 
                         checked={featuredThisWeek} 
                         onCheckedChange={setFeaturedThisWeek}
                       />
                    </div>
                </div>

                {/* Distribution Section */}
                <div className="space-y-6">
                   <div className="flex items-center gap-2 px-1">
                      <Megaphone className="h-4 w-4 text-slate-400" />
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Multi-Channel Distribution</h3>
                   </div>
                   
                   <div className="grid gap-6">
                      {/* Marketplace Sync */}
                      <div className="space-y-3">
                         <p className="text-[10px] font-bold text-primary/70 uppercase px-1">Marketplace & Shop Sync</p>
                         <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-white border rounded-xl shadow-sm">
                            <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-600">Google Merchant</span>
                                  <span className="text-[9px] text-slate-400">
                                     {(product as any)?.lastGoogleSync ? `Synced: ${new Date((product as any).lastGoogleSync).toLocaleDateString()}` : "Not synced"}
                                  </span>
                               </div>
                               <Switch checked={exportToGoogle} onCheckedChange={setExportToGoogle} />
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-600">Meta Shop</span>
                                  <span className="text-[9px] text-slate-400">
                                     {(product as any)?.lastMetaSync ? `Synced: ${new Date((product as any).lastMetaSync).toLocaleDateString()}` : "Not synced"}
                                  </span>
                               </div>
                               <Switch checked={exportToMeta} onCheckedChange={setExportToMeta} />
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-600">TikTok Shop</span>
                                  <span className="text-[9px] text-slate-400">
                                     {(product as any)?.lastTiktokSync ? `Synced: ${new Date((product as any).lastTiktokSync).toLocaleDateString()}` : "Not synced"}
                                  </span>
                               </div>
                               <Switch checked={exportToTiktok} onCheckedChange={setExportToTiktok} />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToJiji} onCheckedChange={setExportToJiji} />
                               <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Jiji Kenya</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToOlxKenya} onCheckedChange={setExportToOlxKenya} />
                               <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">OLX / Jiji</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToPigiaMe} onCheckedChange={setExportToPigiaMe} />
                               <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">PigiaMe</span>
                            </label>
                         </div>
                      </div>

                      {/* Social Ads */}
                      <div className="space-y-3">
                         <p className="text-[10px] font-bold text-indigo-500 uppercase px-1">Social Advertising Hooks</p>
                         <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToInstagramReels} onCheckedChange={setExportToInstagramReels} />
                               <span className="text-sm font-medium text-slate-600">IG Reels</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToInstagramStories} onCheckedChange={setExportToInstagramStories} />
                               <span className="text-sm font-medium text-slate-600">IG Stories</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToYoutubeShorts} onCheckedChange={setExportToYoutubeShorts} />
                               <span className="text-sm font-medium text-slate-600">YouTube Shorts</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToWhatsappStatus} onCheckedChange={setExportToWhatsappStatus} />
                               <span className="text-sm font-medium text-slate-600">WhatsApp Status</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToWhatsappChannel} onCheckedChange={setExportToWhatsappChannel} />
                               <span className="text-sm font-medium text-slate-600">WA Channel</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToLinkedIn} onCheckedChange={setExportToLinkedIn} />
                               <span className="text-sm font-medium text-slate-600">LinkedIn</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToX} onCheckedChange={setExportToX} />
                               <span className="text-sm font-medium text-slate-600">X (Twitter)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToTelegram} onCheckedChange={setExportToTelegram} />
                               <span className="text-sm font-medium text-slate-600">Telegram</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToPinterest} onCheckedChange={setExportToPinterest} />
                               <span className="text-sm font-medium text-slate-600">Pinterest</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <Switch checked={exportToSnapchat} onCheckedChange={setExportToSnapchat} />
                               <span className="text-sm font-medium text-slate-600">Snapchat</span>
                            </label>
                         </div>
                      </div>
                    </div>
                 </div>
               </div>
            )}
          </div>

          <SheetFooter className="border-t border-[#E5E7EB] pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Saving…" : "Save Product"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
