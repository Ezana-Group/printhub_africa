"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectOption 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink as ExternalLinkIcon, 
  Loader2 as Loader2Icon, 
  Sparkles as SparklesIcon, 
  AlertCircle as AlertIcon, 
  CheckCircle2 as CheckIcon, 
  RefreshCw as RefreshIcon, 
  ArrowLeft as ArrowIcon, 
  Trash2 as TrashIcon,
  Wand2 as WandIcon
} from "lucide-react";
import { toast } from "sonner";

interface AdminCatalogueReviewClientProps {
  importItem: any;
  categories: any[];
}

export function AdminCatalogueReviewClient({ importItem, categories }: AdminCatalogueReviewClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(importItem.aiEnhancementStatus);
  const [isApproving, setIsApproving] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    name: importItem.scrapedName || "",
    shortDescription: "",
    fullDescription: "",
    seoTitle: "",
    metaDescription: "",
    categoryId: importItem.scrapedCategory || (categories.length > 0 ? categories[0].id : ""),
    tags: [],
    keyFeatures: [],
    suggestedPriceMin: 0,
    suggestedPriceMax: 0,
    complexityTier: "medium",
    materialRecommendations: [],
    faq: []
  });

  const aiData = importItem.aiEnhancement as any;

  // Poll for status if a field is being enhanced
  useEffect(() => {
    if (status === "processing") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/catalogue/enhance-status/${importItem.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "complete") {
              setStatus("complete");
              setLoadingField(null);
              clearInterval(interval);
              router.refresh();
            } else if (data.status === "failed") {
              setStatus("failed");
              setLoadingField(null);
              clearInterval(interval);
              toast.error("AI enhancement failed");
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status, importItem.id, router]);

  // Sync AI data to form when complete
  useEffect(() => {
    if (aiData) {
      setFormData((prev: any) => ({
        ...prev,
        name: aiData.product_name || prev.name || importItem.scrapedName || "",
        shortDescription: aiData.short_description || prev.shortDescription || "",
        fullDescription: aiData.full_description || prev.fullDescription || "",
        seoTitle: aiData.seo_title || prev.seoTitle || "",
        metaDescription: aiData.meta_description || prev.metaDescription || "",
        tags: aiData.suggested_tags || prev.tags || [],
        keyFeatures: aiData.key_features || prev.keyFeatures || [],
        suggestedPriceMin: aiData.suggested_price_range?.min_kes || prev.suggestedPriceMin || 0,
        suggestedPriceMax: aiData.suggested_price_range?.max_kes || prev.suggestedPriceMax || 0,
        complexityTier: aiData.complexity_tier || prev.complexityTier || "medium",
        materialRecommendations: aiData.material_recommendations || prev.materialRecommendations || [],
        faq: aiData.faq || prev.faq || []
      }));
    }
  }, [aiData, importItem.scrapedName]);

  const handleEnhanceField = async (field: string) => {
    setLoadingField(field);
    try {
      const res = await fetch("/api/admin/catalogue/enhance-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId: importItem.id, field })
      });
      if (res.ok) {
        setStatus("processing");
        toast.success(`Triggered AI enhancement for ${field}`);
      } else {
        toast.error(`Failed to trigger AI for ${field}`);
        setLoadingField(null);
      }
    } catch (e) {
      toast.error("An error occurred");
      setLoadingField(null);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/admin/import/${importItem.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrls: importItem.scrapedImageUrls,
        })
      });

      if (res.ok) {
        toast.success("Product approved and created successfully!");
        router.push("/admin/catalogue");
        router.refresh();
      } else {
        let errorMessage = "Approval failed";
        try {
          const err = await res.json();
          errorMessage = err.detail || err.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        toast.error(`Approval failed: ${errorMessage}`);
      }
    } catch (e) {
      console.error("Approval request failed:", e);
      toast.error("An error occurred during approval");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/catalogue/queue")}>
          <ArrowIcon className="w-4 h-4 mr-2" />
          Back to Queue
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Review Imported Model</h1>
        <Badge variant={status === "complete" ? "success" : status === "processing" ? "warning" : "default" } className="ml-2">
          {status === "complete" ? "AI Ready" : status === "processing" ? "AI Processing" : "Manual Status: " + status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: ORIGINAL DATA */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Source Data</CardTitle>
              <CardDescription>Scraped from {importItem.sourceUrl}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{importItem.sourceUrl?.includes("printables") ? "Printables" : "External Source"}</Badge>
                <Link href={importItem.sourceUrl || "#"} target="_blank" className="text-blue-600 flex items-center text-sm">
                  View Source <ExternalLinkIcon className="w-3 h-3 ml-1" />
                </Link>
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Original Name</Label>
                <p className="font-medium text-slate-700">{importItem.scrapedName || "N/A"}</p>
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Original Stats</Label>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm font-medium text-slate-600">❤️ {importItem.likeCount || 0}</span>
                  <span className="text-sm font-medium text-slate-600">⬇️ {importItem.downloadCount || 0}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Source Images</Label>
                <div className="grid grid-cols-3 gap-2">
                  {importItem.scrapedImageUrls?.slice(0, 6).map((url: string, i: number) => (
                    <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                      <Image src={url} alt={`img-${i}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Original Description</Label>
                <div className="mt-2 text-sm text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                  {importItem.scrapedDescription || "No description found."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: EDITABLE FORM */}
        <div className="space-y-6">
          <Card className="border-[#FF4D00]/10 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <WandIcon className="w-5 h-5 mr-2 text-[#FF4D00]" />
                Listing & Enhancement
              </CardTitle>
              <CardDescription>Fill manually or use sectional AI assistants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-sm font-bold text-slate-700">Product Name</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold text-[#FF4D00] hover:text-[#FF4D00] hover:bg-[#FF4D00]/5 border border-[#FF4D00]/20"
                    onClick={() => handleEnhanceField("name")}
                    disabled={status === "processing"}
                  >
                    {loadingField === "name" ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <SparklesIcon className="h-3 w-3 mr-1" />}
                    Enhance Name
                  </Button>
                </div>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Modern Desk Planter"
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-bold text-slate-700">Category</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                    options={categories.map((cat: any) => ({ value: cat.id, label: cat.name }))}
                    placeholder="Select Category"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complexity" className="text-sm font-bold text-slate-700">Complexity</Label>
                  <Select 
                    value={formData.complexityTier} 
                    onValueChange={(v) => setFormData({ ...formData, complexityTier: v })}
                    options={[
                      { value: "simple", label: "Simple" },
                      { value: "medium", label: "Medium" },
                      { value: "complex", label: "Complex" },
                      { value: "very_complex", label: "Very Complex" }
                    ]}
                    placeholder="Complexity"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-700">Descriptions</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold text-[#FF4D00] hover:text-[#FF4D00] hover:bg-[#FF4D00]/5 border border-[#FF4D00]/20"
                    onClick={() => handleEnhanceField("descriptions")}
                    disabled={status === "processing"}
                  >
                    {loadingField === "descriptions" ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <SparklesIcon className="h-3 w-3 mr-1" />}
                    Enhance Descriptions
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="short_desc" className="text-xs text-slate-500">Short Description</Label>
                  <Textarea 
                    id="short_desc" 
                    value={formData.shortDescription} 
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} 
                    placeholder="Catchy tagline (max 150 chars)"
                    className="h-20 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_desc" className="text-xs text-slate-500">Body Content (HTML)</Label>
                  <Textarea 
                    id="full_desc" 
                    value={formData.fullDescription} 
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} 
                    placeholder="Detailed product information..."
                    className="h-44 text-sm font-mono p-4 bg-slate-50/50"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-700">SEO & Metadata</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold text-[#FF4D00] hover:text-[#FF4D00] hover:bg-[#FF4D00]/5 border border-[#FF4D00]/20"
                    onClick={() => handleEnhanceField("seo")}
                    disabled={status === "processing"}
                  >
                    {loadingField === "seo" ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <SparklesIcon className="h-3 w-3 mr-1" />}
                    Enhance SEO
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Input 
                    value={formData.seoTitle} 
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} 
                    placeholder="Meta Title"
                    className="h-9 text-sm"
                  />
                  <Textarea 
                    value={formData.metaDescription} 
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} 
                    placeholder="Meta Description"
                    className="h-20 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="mt-8 space-y-6">
        {status === "complete" && aiData && (
          <Card className="bg-slate-50/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">AI Admin Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
                  <h4 className="font-bold text-amber-800 text-[10px] mb-2 uppercase tracking-wide">Pricing Suggestions</h4>
                  <p className="text-xl font-bold text-amber-900">KES {aiData.suggested_price_range?.min_kes} - {aiData.suggested_price_range?.max_kes}</p>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">{aiData.suggested_price_range?.pricing_basis}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 block">Contextual Notes</Label>
                  <p className="text-xs p-3 bg-white rounded-lg border border-slate-100">{aiData.admin_notes}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1 block">License Analysis</Label>
                  <div className={`p-4 rounded-lg text-xs flex items-start gap-3 border ${importItem.licenseType?.includes('NC') ? 'bg-red-50 text-red-800 border-red-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                    {importItem.licenseType?.includes('NC') ? <AlertIcon className="w-5 h-5 flex-shrink-0" /> : <CheckIcon className="w-5 h-5 flex-shrink-0" />}
                    <div>
                      <p className="font-bold mb-1">{importItem.licenseType?.includes('NC') ? 'Commercial Restriction Detected' : 'Commercial-Friendly License'}</p>
                      <p className="opacity-80 leading-relaxed">{aiData.admin_notes || "Check license restrictions manually."}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center justify-between sticky bottom-6 z-10 backdrop-blur-sm bg-white/95">
          <div className="flex gap-3">
             <Button 
               variant="ghost" 
               className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
               onClick={() => router.push("/admin/catalogue/queue")}
             >
               <ArrowIcon className="w-4 h-4 mr-2" />
               Exit to Queue
             </Button>
          </div>
          <div className="flex gap-3">
            <Button 
               variant="ghost" 
               className="text-red-400 hover:text-red-500 hover:bg-red-50 font-medium"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Discard Import
            </Button>
            <Button 
              className="bg-[#FF4D00] hover:bg-[#E64500] text-white px-10 h-11 font-bold shadow-lg shadow-[#FF4D00]/20"
              onClick={handleApprove}
              disabled={isApproving || status === "processing"}
            >
              {isApproving && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
              Approve & Create Product
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
