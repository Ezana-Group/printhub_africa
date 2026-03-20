"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ExternalLink, Save, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ImportFormData {
  name: string;
  shortDescription: string;
  description: string;
  printInfo: string;
  categoryId: string;
  tags: string[];
  basePrice: number;
  comparePrice: number;
  licenceType: string;
  licenceVerified: boolean;
  designerCreditRequired: boolean;
  creditText: string;
  internalNotes: string;
  thumbnailUrl: string;
  imageUrls: string[];
}

interface Category {
  id: string;
  name: string;
}

interface ExternalModelData {
  id: string;
  platform: string;
  externalUrl: string;
  name: string;
  description?: string;
  printInfo?: string;
  categoryId?: string;
  tags?: string[];
  licenceType: string;
  licenceVerified: boolean;
  designerName?: string;
  designerUrl?: string;
  thumbnailUrl?: string;
  imageUrls: string[];
  importedAt: string;
  notes?: string;
}

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState<ExternalModelData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<ImportFormData>({
    name: "",
    shortDescription: "",
    description: "",
    printInfo: "",
    categoryId: "",
    tags: [],
    basePrice: 0,
    comparePrice: 0,
    licenceType: "",
    licenceVerified: false,
    designerCreditRequired: false,
    creditText: "",
    internalNotes: "",
    thumbnailUrl: "",
    imageUrls: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [modelRes, catRes] = await Promise.all([
        fetch(`/api/admin/import/${id}`),
        fetch("/api/admin/categories")
      ]);
      
      if (modelRes.ok) {
        const data = await modelRes.json();
        const m = data.model as ExternalModelData;
        setModel(m);
        setFormData({
          name: m.name || "",
          shortDescription: m.description?.slice(0, 300) || "",
          description: m.description || "",
          printInfo: m.printInfo || "",
          categoryId: m.categoryId || "",
          tags: m.tags || [],
          basePrice: 0,
          comparePrice: 0,
          licenceType: m.licenceType || "",
          licenceVerified: m.licenceVerified || false,
          designerCreditRequired: true,
          creditText: `Design by ${m.designerName || "Unknown"}`,
          internalNotes: m.notes || "",
          thumbnailUrl: m.thumbnailUrl || "",
          imageUrls: m.imageUrls || [],
        });
      }
      
      if (catRes.ok) {
        const data = await catRes.json();
        // The API returns the array directly
        setCategories(Array.isArray(data) ? data : (data.categories || []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (isApproval = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/import/${id}/${isApproval ? 'approve' : 'save'}`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        if (isApproval) {
          router.push("/admin/catalogue/import?tab=queue");
        } else {
          // Toast or similar
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium">Model not found</p>
        <Link href="/admin/catalogue/import" className="text-primary hover:underline">Back to Import</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/catalogue/import" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Review Import</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              From <span className="font-semibold uppercase">{model.platform}</span> 
              <span className="text-xs">•</span>
              Imported {model.importedAt ? format(new Date(model.importedAt), "MMM d, yyyy") : "Unknown date"}
            </p>
          </div>
        </div>
        <a 
          href={model.externalUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 px-4 py-2 rounded-lg"
        >
          Check Original Source <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visuals & Original Data */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Media Preview
            </h3>
            <div className="aspect-square rounded-md overflow-hidden bg-gray-100 border relative group">
              <img 
                src={formData.thumbnailUrl} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                alt="Preview"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {formData.imageUrls.slice(0, 8).map((url, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded border bg-gray-50 overflow-hidden cursor-pointer hover:border-primary transition-colors",
                    formData.thumbnailUrl === url && "border-2 border-primary"
                  )}
                  onClick={() => setFormData({ ...formData, thumbnailUrl: url })}
                >
                  <img src={url} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Original Metadata</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Designer</p>
                <p className="text-sm font-medium">{model.designerName}</p>
                {model.designerUrl && (
                  <a href={model.designerUrl} target="_blank" className="text-[11px] text-blue-600 hover:underline">View Profile</a>
                )}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Original License</p>
                <div className="mt-1">
                  <LicenceBadge licence={model.licenceType} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Product Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input 
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Short Description *</label>
                <textarea 
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
                <p className="text-[10px] text-right text-muted-foreground">{formData.shortDescription?.length || 0}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select 
                  className="w-full border rounded-md px-3 py-2 bg-transparent"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Print Information</label>
                <textarea 
                  className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                  rows={4}
                  value={formData.printInfo}
                  onChange={(e) => setFormData({ ...formData, printInfo: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Pricing & Licence</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (KES) *</label>
                <input 
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discounted Price</label>
                <input 
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.comparePrice}
                  onChange={(e) => setFormData({ ...formData, comparePrice: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Licence Type *</label>
                <select 
                  className="w-full border rounded-md px-3 py-2 bg-transparent"
                  value={formData.licenceType}
                  onChange={(e) => setFormData({ ...formData, licenceType: e.target.value })}
                >
                  <option value="">Verify and select...</option>
                  <option value="CC0">CC0 — Public Domain</option>
                  <option value="CC-BY">CC BY — Attribution</option>
                  <option value="CC-BY-SA">CC BY-SA — ShareAlike</option>
                  <option value="CC-BY-ND">CC BY-ND — NoMod</option>
                  <option value="ROYALTY_FREE">Royalty-Free Commercial</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 bg-amber-50 rounded border border-amber-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-primary"
                  checked={formData.licenceVerified}
                  onChange={(e) => setFormData({ ...formData, licenceVerified: e.target.checked })}
                />
                <span className="text-xs font-semibold text-amber-900">I have verified this licence allows commercial printing</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-6 mt-12 bg-white/80 backdrop-blur-md p-4 rounded-xl border shadow-xl flex justify-between items-center z-50">
        <button 
          className="text-red-600 px-6 py-2 rounded-md hover:bg-red-50 flex items-center gap-2 font-medium"
          onClick={() => {/* handle rejection */}}
        >
          <Trash2 className="w-4 h-4" /> Reject
        </button>
        <div className="flex gap-3">
          <button 
            className="border px-6 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2 font-medium"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button 
            className="bg-primary text-white px-8 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
            onClick={() => handleSave(true)}
            disabled={saving || !formData.licenceVerified || !formData.categoryId || !formData.basePrice}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve & Create Product
          </button>
        </div>
      </div>
    </div>
  );
}
