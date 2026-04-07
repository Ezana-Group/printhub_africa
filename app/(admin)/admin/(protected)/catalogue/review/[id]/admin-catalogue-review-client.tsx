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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, Loader2, Sparkles, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft, Trash2 
} from "lucide-react";
import { toast } from "sonner";

interface AdminCatalogueReviewClientProps {
  importItem: any;
  categories: any[];
}

export function AdminCatalogueReviewClient({ importItem, categories }: AdminCatalogueReviewClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(importItem.aiEnhancementStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
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

  useEffect(() => {
    if (status === "processing" || status === "pending") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/catalogue/enhance-status/${importItem.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "complete") {
              setStatus("complete");
              clearInterval(interval);
              router.refresh();
            } else if (data.status === "failed") {
              setStatus("failed");
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status, importItem.id, router]);

  useEffect(() => {
    if (aiData) {
      setFormData({
        name: aiData.product_name || importItem.scrapedName || "",
        shortDescription: aiData.short_description || "",
        fullDescription: aiData.full_description || "",
        seoTitle: aiData.seo_title || "",
        metaDescription: aiData.meta_description || "",
        categoryId: formData.categoryId, // Keep selection unless AI suggests better
        tags: aiData.suggested_tags || [],
        keyFeatures: aiData.key_features || [],
        suggestedPriceMin: aiData.suggested_price_range?.min_kes || 0,
        suggestedPriceMax: aiData.suggested_price_range?.max_kes || 0,
        complexityTier: aiData.complexity_tier || "medium",
        materialRecommendations: aiData.material_recommendations || [],
        faq: aiData.faq || []
      });
    }
  }, [aiData, importItem.scrapedName]);

  const handleRegenerate = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/catalogue/enhance-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId: importItem.id })
      });
      if (res.ok) {
        setStatus("processing");
        toast.success("AI enhancement re-triggered");
      } else {
        toast.error("Failed to trigger AI enhancement");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Logic for approval - calling the approve endpoint
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
        // Handle non-JSON or malformed error responses
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
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Queue
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Review Imported Model</h1>
        <Badge variant={status === "complete" ? "success" : status === "processing" ? "warning" : "default" } className="ml-2">
          {status === "complete" ? "AI Ready" : status === "processing" ? "AI Processing" : "Status: " + status}
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
                  View Source <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>

              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Original Name</Label>
                <p className="font-medium">{importItem.scrapedName || "N/A"}</p>
              </div>

              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Original Stats</Label>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm font-medium">❤️ {importItem.likeCount || 0}</span>
                  <span className="text-sm font-medium">⬇️ {importItem.downloadCount || 0}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Source Images</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {importItem.scrapedImageUrls?.slice(0, 6).map((url: string, i: number) => (
                    <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-slate-100">
                      <Image src={url} alt={`img-${i}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Original Description</Label>
                <div className="mt-1 text-sm text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap p-3 bg-slate-50 rounded-lg">
                  {importItem.scrapedDescription || "No description found."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: AI ENHANCEMENT / EDITABLE FORM */}
        <div className="space-y-6">
          <Card className="border-[#FF4D00]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#FF4D00]/5 to-transparent">
              <CardTitle className="text-lg flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-[#FF4D00]" />
                AI Enhancement & Listing Details
              </CardTitle>
              <CardDescription>Pre-filled with AI suggestions. Review and edit before approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {status === "processing" ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-10 h-10 animate-spin text-[#FF4D00] mb-4" />
                  <p className="font-medium animate-pulse">AI is generating listing content...</p>
                  <p className="text-sm mt-1 mb-4">This usually takes 15-30 seconds.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      setStatus("manual");
                      try {
                        await fetch(`/api/admin/catalogue/stop-ai/${importItem.id}`, { method: "POST" });
                      } catch (e) {
                         console.error("Failed to persist manual status:", e);
                      }
                    }}
                  >
                    Stop AI & Edit Manually
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="e.g. Modern Desk Planter"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                      value={formData.categoryId} 
                      onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                      options={categories.map((cat: any) => ({ value: cat.id, label: cat.name }))}
                      placeholder="Select Category"
                    />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complexity">Complexity Tier</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="short_desc">Short Description</Label>
                    <Textarea 
                      id="short_desc" 
                      value={formData.shortDescription} 
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} 
                      placeholder="Catchy tagline (max 150 chars)"
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_desc">Full Description (HTML Supported)</Label>
                    <Textarea 
                      id="full_desc" 
                      value={formData.fullDescription} 
                      onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} 
                      placeholder="Detailed product information..."
                      className="h-48"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>SEO Fields</Label>
                    <div className="space-y-2">
                      <Input 
                        value={formData.seoTitle} 
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} 
                        placeholder="SEO Title"
                      />
                      <Textarea 
                        value={formData.metaDescription} 
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} 
                        placeholder="Meta Description"
                        className="h-20"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="mt-8 space-y-6">
        {status === "complete" && aiData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Admin Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="font-bold text-amber-800 text-sm mb-2 uppercase tracking-wide">Pricing Suggestions</h4>
                  <p className="text-lg font-bold text-amber-900">KES {aiData.suggested_price_range?.min_kes} - {aiData.suggested_price_range?.max_kes}</p>
                  <p className="text-xs text-amber-700 mt-1">{aiData.suggested_price_range?.pricing_basis}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase cursor-default">Admin Notes</Label>
                  <p className="text-sm p-3 bg-slate-50 rounded-lg mt-1">{aiData.admin_notes}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase cursor-default">Social Platform Preview</Label>
                  {/* ... social platforms summary ... */}
                  <Button variant="outline" className="mt-2 w-full">View Social Captions</Button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-500 text-xs uppercase cursor-default">License Caution</Label>
                  <div className={`p-3 rounded-lg mt-1 text-sm flex items-start gap-2 ${importItem.licenseType?.includes('NC') ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-green-50 text-green-800 border border-green-100'}`}>
                    {importItem.licenseType?.includes('NC') ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    <p>{aiData.admin_notes || "Check license restrictions manually."}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between sticky bottom-6 z-10">
          <div className="flex gap-3">
             <Button 
               variant="outline" 
               onClick={handleRegenerate}
               disabled={isRefreshing || status === "processing"}
             >
               {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
               Regenerate AI Content
             </Button>
          </div>
          <div className="flex gap-3">
            <Button 
               variant="ghost" 
               className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Discard Import
            </Button>
            <Button 
              className="bg-[#FF4D00] hover:bg-[#E64500] text-white px-8"
              onClick={handleApprove}
              disabled={isApproving || status === "processing"}
            >
              {isApproving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve & Create Product
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
