"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ExternalLink, X, Save, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { cn } from "@/lib/utils";

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<any>({
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

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modelRes, catRes] = await Promise.all([
        fetch(`/api/admin/import/${id}`),
        fetch("/api/admin/categories")
      ]);
      
      if (modelRes.ok) {
        const data = await modelRes.json();
        setModel(data.model);
        setFormData({
          name: data.model.name || "",
          shortDescription: data.model.description?.slice(0, 300) || "",
          description: data.model.description || "",
          printInfo: data.model.printInfo || "",
          categoryId: data.model.categoryId || "",
          tags: data.model.tags || [],
          basePrice: 0,
          comparePrice: 0,
          licenceType: data.model.licenceType || "",
          licenceVerified: data.model.licenceVerified || false,
          designerCreditRequired: true,
          creditText: `Design by ${data.model.designerName || "Unknown"}`,
          internalNotes: data.model.notes || "",
          thumbnailUrl: data.model.thumbnailUrl || "",
          imageUrls: data.model.imageUrls || [],
        });
      }
      
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!model) return <div className="p-12 text-center text-red-500">Model not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/catalogue/import" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Review Import: {model.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center justify-between">
              Image Gallery
              <span className="text-xs text-muted-foreground font-normal">Click to set primary (thumbnail)</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {formData.imageUrls.map((img: string, i: number) => (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-md border relative group overflow-hidden cursor-pointer",
                    formData.thumbnailUrl === img ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                  )}
                  onClick={() => setFormData({ ...formData, thumbnailUrl: img })}
                >
                  <img src={img} className="w-full h-full object-cover" />
                  <button 
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newImages = formData.imageUrls.filter((_: any, idx: number) => idx !== i);
                      setFormData({ 
                        ...formData, 
                        imageUrls: newImages,
                        thumbnailUrl: formData.thumbnailUrl === img ? (newImages[0] || "") : formData.thumbnailUrl
                      });
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {formData.thumbnailUrl === img && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-[10px] text-center py-0.5">Primary</div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t space-y-2">
              <a href={model.sourceUrl} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Open original page <ExternalLink className="w-3 h-3" />
              </a>
              <div className="p-3 bg-gray-50 rounded text-xs space-y-2">
                <p><strong>Extracted Licence:</strong> {model.licenceType}</p>
                <p><strong>Designer:</strong> {model.designerName} (<a href={model.designerUrl} target="_blank" className="text-blue-600">Profile</a>)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit */}
        <div className="space-y-6">
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
                <p className="text-[10px] text-right text-muted-foreground">{formData.shortDescription.length}/300</p>
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
