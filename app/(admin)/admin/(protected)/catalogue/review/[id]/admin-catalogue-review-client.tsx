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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  Wand2 as WandIcon,
  Save as SaveIcon,
  Zap,
  Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { CategoryCascadingSelect } from "@/components/admin/CategoryCascadingSelect";
import { ProductImagesTab } from "@/components/admin/product-images-tab";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProductMaterialSelector } from "@/components/admin/ProductMaterialSelector";
import type { ProductType } from "@prisma/client";

import { useSession } from "next-auth/react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface AdminCatalogueReviewClientProps {
  importItem: any;
  categories: any[];
}

export function AdminCatalogueReviewClient({ importItem, categories }: AdminCatalogueReviewClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "STAFF";
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const [aiStatus, setAiStatus] = useState(importItem.aiEnhancementStatus);
  const [currentStatus, setCurrentStatus] = useState(importItem.status);
  const [isApproving, setIsApproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  
  // FORM STATE
  const [formData, setFormData] = useState<any>(() => {
    if (importItem.editorData) return importItem.editorData;
    return {
      name: importItem.scrapedName || "",
      slug: slugify(importItem.scrapedName || ""),
      description: importItem.scrapedDescription || "",
      shortDescription: "",
      categoryId: importItem.scrapedCategory || (categories.length > 0 ? categories[0].id : ""),
      productType: "READYMADE_3D" as ProductType,
      productionFiles: [],
      basePrice: "0",
      comparePrice: "",
      stock: "0",
      isActive: true,
      isFeatured: false,
      isPOD: false,
      metaTitle: "",
      metaDescription: "",
      featuredThisWeek: false,
      tags: importItem.scrapedTags || [],
      keyFeatures: [],
      imageUrls: importItem.scrapedImageUrls || [],
      exportToGoogle: true,
      exportToGoogleBiz: true,
      exportToLinkedIn: false,
      exportToMeta: true,
      exportToPinterest: false,
      exportToTiktok: true,
      exportToX: false,
      exportToGoogleDiscover: false,
      exportToInstagramReels: false,
      exportToInstagramStories: false,
      exportToJiji: false,
      exportToTelegram: false,
      exportToWhatsappChannel: false,
      exportToWhatsappStatus: false,
      exportToYoutubeShorts: false,
      exportToAppleMaps: false,
      exportToBingPlaces: false,
      exportToGoogleMapsPost: true,
      exportToLinkedInNewsletter: false,
      exportToMedium: false,
      exportToNextdoor: false,
      exportToOlxKenya: false,
      exportToPigiaMe: false,
      exportToReddit: false,
      exportToSnapchat: false,
      exportToYoutube: false,
    };
  });

  const aiData = importItem.aiEnhancement as any;

  // Poll for AI status
  useEffect(() => {
    if (aiStatus === "processing") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/catalogue/enhance-status/${importItem.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "complete") {
              setAiStatus("complete");
              router.refresh();
              clearInterval(interval);
            }
          }
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [aiStatus, importItem.id, router]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/import/${importItem.id}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Draft saved successfully");
        setCurrentStatus("DRAFT");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/import/${importItem.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Submitted for review!");
        router.push("/admin/catalogue/import");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/admin/import/${importItem.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Product published!");
        router.push("/admin/catalogue/import");
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes) return toast.error("Please provide feedback notes");
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admin/import/${importItem.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: rejectionNotes })
      });
      if (res.ok) {
        toast.success("Submission rejected");
        router.push("/admin/catalogue/import");
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (field === "name" && !importItem.editorData) {
      setFormData((prev: any) => ({ ...prev, slug: slugify(value) }));
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 pb-32">
      {/* STATUS BANNER */}
      {currentStatus === "REJECTED" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
          <AlertIcon className="w-5 h-5 text-red-500 mt-1" />
          <div>
            <h3 className="font-bold text-red-800">Submission Rejected</h3>
            <p className="text-red-700 text-sm mt-1">
              Admin Feedback: "{importItem.reviewNotes || "Please review the data and re-submit."}"
            </p>
          </div>
        </div>
      )}
      
      {currentStatus === "PENDING_REVIEW" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
          <Loader2Icon className="w-5 h-5 text-amber-500 mt-1 animate-spin" />
          <div>
            <h3 className="font-bold text-amber-800">Awaiting Final Approval</h3>
            <p className="text-amber-700 text-sm mt-1">
              This product has been submitted for review. {isAdmin ? "Please review and publish." : "Wait for an admin to approve it."}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/catalogue/import")}>
            <ArrowIcon className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {importItem.isManual ? "Manual Product Draft" : "Review Imported Model"}
          </h1>
          <Badge variant={aiStatus === "complete" ? "success" : aiStatus === "processing" ? "warning" : "secondary"}>
             {aiStatus === "complete" ? "AI Enhanced" : aiStatus === "processing" ? "AI Processing" : "Awaiting AI"}
          </Badge>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
             {isSaving ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <SaveIcon className="w-4 h-4 mr-2" />}
             Save Draft
          </Button>
          
          {isAdmin && currentStatus === "PENDING_REVIEW" ? (
            <>
              <Button variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={isRejecting}>
                <TrashIcon className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button className="bg-[#FF4D00] hover:bg-[#E64500]" onClick={handleApprove} disabled={isApproving}>
                {isApproving ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <CheckIcon className="w-4 h-4 mr-2" />}
                Approve & Publish
              </Button>
            </>
          ) : (
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmitForReview} disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      {/* REJECT DIALOG */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please explain why this submission is being rejected so the staff can fix it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Admin Feedback / Notes</Label>
            <textarea 
              className="w-full mt-2 p-3 border rounded-lg min-h-[120px] text-sm"
              placeholder="e.g. Please add more descriptive tags and fix the pricing..."
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: MAIN EDITOR (2/3) */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="bg-slate-100 p-1 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => updateField("name", e.target.value)} 
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Product Type</Label>
                      <select
                        value={formData.productType}
                        onChange={(e) => updateField("productType", e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="READYMADE_3D">Ready-made 3D</option>
                        <option value="LARGE_FORMAT">Large Format</option>
                        <option value="CUSTOM">3D Service</option>
                        <option value="POD">Print-On-Demand (POD)</option>
                      </select>
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <CategoryCascadingSelect
                        categories={categories}
                        value={formData.categoryId}
                        onChange={(val) => updateField("categoryId", val)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Short Description (150 chars)</Label>
                    <Input 
                      value={formData.shortDescription} 
                      onChange={(e) => updateField("shortDescription", e.target.value)} 
                      maxLength={150}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Full Description (HTML)</Label>
                    <div className="mt-1">
                      <SmartTextEditor
                        value={formData.description}
                        onChange={(val) => updateField("description", val)}
                        minHeight="300px"
                      />
                    </div>
                  </div>
                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={formData.isActive} onCheckedChange={(v) => updateField("isActive", v)} />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={formData.isFeatured} onCheckedChange={(v) => updateField("isFeatured", v)} />
                      <span className="text-sm">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={formData.isPOD} onCheckedChange={(v) => updateField("isPOD", v)} />
                      <span className="text-sm">POD</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Base Price (KES) *</Label>
                      <Input 
                        type="number" 
                        value={formData.basePrice} 
                        onChange={(e) => updateField("basePrice", e.target.value)} 
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Compare-at Price (KES)</Label>
                      <Input 
                        type="number" 
                        value={formData.comparePrice} 
                        onChange={(e) => updateField("comparePrice", e.target.value)} 
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input 
                      type="number" 
                      value={formData.stock} 
                      onChange={(e) => updateField("stock", e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
               <ProductImagesTab
                  productId="" // Empty since it's not created yet
                  initialImages={(formData.imageUrls || []).map((url: string, i: number) => ({
                    url,
                    isMain: i === 0,
                    sortOrder: i,
                    source: "url" as const
                  }))}
                  onSave={(images) => {
                    updateField("imageUrls", images.map(img => img.url));
                  }}
               />
            </TabsContent>

            <TabsContent value="materials">
              <ProductMaterialSelector productId="" />
            </TabsContent>

            <TabsContent value="files" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Production Files</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Upload STL, OBJ, STEP, or PDF files. These files are kept private and are only shown to staff when fulfilling orders.
                  </p>
                  <FileUploader
                    context="ADMIN_CATALOGUE_PRODUCTION"
                    accept={[
                      "application/octet-stream",
                      ".stl",
                      ".3mf",
                      ".obj",
                      ".step",
                      ".stp",
                      "application/pdf",
                    ]}
                    maxFiles={10}
                    onUploadComplete={(files) => {
                      const newUrls = files.map((f) => f.publicUrl).filter(Boolean);
                      updateField("productionFiles", [...(formData.productionFiles || []), ...newUrls]);
                    }}
                  />
                  {formData.productionFiles?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Files:</h4>
                      <ul className="space-y-1">
                        {formData.productionFiles.map((url: string, i: number) => (
                          <li key={i} className="flex flex-col gap-1 p-2 border rounded-md">
                            <span className="text-sm text-slate-600 truncate">{url.split('/').pop()}</span>
                            <div className="flex gap-2 text-xs">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download</a>
                              <button
                                type="button"
                                className="text-destructive hover:underline"
                                onClick={() => {
                                  updateField("productionFiles", formData.productionFiles.filter((_: any, idx: number) => idx !== i));
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>SEO Title</Label>
                    <Input 
                      value={formData.metaTitle} 
                      onChange={(e) => updateField("metaTitle", e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>SEO Description</Label>
                    <Input 
                      value={formData.metaDescription} 
                      onChange={(e) => updateField("metaDescription", e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>URL Slug</Label>
                    <Input 
                      value={formData.slug} 
                      onChange={(e) => updateField("slug", e.target.value)} 
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-8">
               <div className="bg-slate-50 border rounded-xl p-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">Multi-Channel Distribution</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {Object.keys(formData).filter(k => k.startsWith("exportTo")).map(key => (
                       <div key={key} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <span className="text-sm font-medium text-slate-600">
                             {key.replace("exportTo", "").replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <Switch 
                            checked={formData[key]} 
                            onCheckedChange={(v) => updateField(key, v)} 
                          />
                       </div>
                    ))}
                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Featured This Week</span>
                        <Switch 
                          checked={formData.featuredThisWeek} 
                          onCheckedChange={(v) => updateField("featuredThisWeek", v)} 
                        />
                    </div>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: SOURCE INFO (1/3) */}
        <div className="space-y-6">
           {!importItem.isManual && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Original Source</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="aspect-video relative rounded-lg overflow-hidden border">
                    {importItem.scrapedImageUrls?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={importItem.scrapedImageUrls[0]} alt="Source" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                    )}
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="font-medium truncate">{importItem.sourceUrl}</p>
                    <Link href={importItem.sourceUrl || "#"} target="_blank" className="text-primary text-xs flex items-center gap-1">
                       View original page <ExternalLinkIcon className="h-3 w-3" />
                    </Link>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Source Stats</Label>
                    <div className="flex gap-4 text-xs">
                      <span>❤️ {importItem.likeCount || 0}</span>
                      <span>⬇️ {importItem.downloadCount || 0}</span>
                      <span>⚖️ {importItem.licenseType || "Unknown"}</span>
                    </div>
                  </div>
               </CardContent>
             </Card>
           )}

           {aiData && (
             <Card className="bg-amber-50 border-amber-100">
               <CardHeader>
                 <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" /> AI Insights
                 </CardTitle>
               </CardHeader>
               <CardContent className="text-xs text-amber-800 space-y-3">
                 <div>
                   <p className="font-bold">Suggested Pricing Basis:</p>
                   <p>{aiData.suggested_price_range?.pricing_basis || "Market average."}</p>
                 </div>
                 <div>
                   <p className="font-bold">Complexity Tier:</p>
                   <Badge variant="outline" className="mt-1 border-amber-200 text-amber-700 capitalize">
                      {aiData.complexity_tier || "Medium"}
                   </Badge>
                 </div>
                 {aiData.admin_notes && (
                   <div className="p-2 bg-white/50 rounded border border-amber-200">
                      <p className="font-bold mb-1">Internal Note:</p>
                      <p>{aiData.admin_notes}</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
}
