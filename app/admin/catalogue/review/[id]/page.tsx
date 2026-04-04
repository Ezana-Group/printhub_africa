"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCcw, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
  Info
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CatalogueReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enhancedData, setEnhancedData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/catalogue/import/${id}`);
      if (!res.ok) throw new Error("Failed to fetch import data");
      const data = await res.json();
      setItem(data);
      setEnhancedData(data.aiEnhancement || {});
    } catch (error) {
      toast.error("Error loading import");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSave = async (status: string = "PENDING") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/catalogue/import/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiEnhancement: enhancedData,
          status
        })
      });
      if (!res.ok) throw new Error("Failed to save changes");
      toast.success("Changes saved successfully");
      if (status === "DONE") router.push("/admin/catalogue/import-queue");
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const approveAndCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/catalogue/import/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enhancedData })
      });
      if (!res.ok) throw new Error("Failed to approve and create product");
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Approval failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 animate-pulse">Loading catalogue data...</p>
        </div>
      </div>
    );
  }

  const isRestricted = item.licenseType?.includes("Non-Commercial") || item.licenseType?.includes("ND");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
        <div className="z-10">
          <Button 
            variant="ghost" 
            className="mb-4 text-zinc-500 hover:text-white p-0 h-auto font-bold"
            asChild
          >
            <Link href="/admin/catalogue/import-queue"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Queue</Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">AI Enhancement Review</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            {item.scrapedName || "Untitled Import"}
          </h1>
          <div className="flex flex-wrap gap-3 mt-4">
             <Badge className="bg-zinc-800 border-zinc-700 text-zinc-400 px-3 py-1 font-bold">{item.platform}</Badge>
             <Badge className={`${isRestricted ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'} px-3 py-1 font-bold flex items-center gap-2`}>
               <ShieldCheck className="w-3 h-3" /> {item.licenseType || "Standard License"}
             </Badge>
          </div>
        </div>
        <div className="flex gap-3 mt-6 md:mt-0 z-10">
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 h-14 px-8 rounded-2xl font-bold transition-all active:scale-95"
            onClick={() => handleSave()}
            disabled={saving}
          >
            Save Draft
          </Button>
          <Button 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-14 px-8 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 border-0 transition-all active:scale-95"
            onClick={approveAndCreate}
            disabled={saving}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Approve & Create Product
          </Button>
        </div>
      </div>

      {isRestricted && (
        <Card className="bg-red-500/5 border-red-500/20 rounded-2xl p-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h4 className="font-black text-red-400 uppercase text-xs tracking-widest mb-1">Commercial Restriction Warning</h4>
              <p className="text-zinc-400 max-w-3xl">This source item carries a <b>{item.licenseType}</b> license. Review legal constraints before converting this into a commercial product listing on PrintHub Africa.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Original Source Data */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Info className="w-5 h-5 text-zinc-500" />
            <h3 className="text-xl font-bold text-white tracking-tight">Source Data</h3>
          </div>
          
          <Card className="bg-zinc-950 border-zinc-800 shadow-xl rounded-2xl overflow-hidden mb-6">
            <CardHeader className="bg-zinc-900/40 py-4 px-6 border-b border-zinc-800">
               <CardTitle className="text-sm font-black text-zinc-400 uppercase tracking-widest">Original Reference Images</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {item.scrapedImageUrls?.slice(0, 4).map((url: string, i: number) => (
                  <div key={i} className="aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group relative">
                    <img src={url} alt="Source" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="ghost" size="icon" className="text-white" asChild>
                        <Link href={url} target="_blank"><ExternalLink className="w-5 h-5" /></Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-xl rounded-2xl p-8 space-y-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Original Description</label>
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 text-zinc-400 text-sm leading-relaxed max-h-[300px] overflow-y-auto font-medium">
                {item.scrapedDescription || "No description provided from source."}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Designer</label>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-bold truncate">
                  {item.designerName || "Unknown Designer"}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Source Tags</label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.scrapedTags?.slice(0, 8).map((tag: string) => (
                    <Badge key={tag} className="bg-zinc-900 border-zinc-800 text-zinc-500 px-3 py-1">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Enhancement Editable Form */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xl font-bold text-white tracking-tight">AI Enhancement</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-400 font-bold hover:bg-indigo-500/10">
              <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Regenerate AI
            </Button>
          </div>

          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-2xl p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none" />
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Enhanced Product Name</label>
                <Input 
                  value={enhancedData?.productName || item.scrapedName || ""} 
                  onChange={(e) => setEnhancedData({...enhancedData, productName: e.target.value})}
                  className="h-14 bg-zinc-900/50 border-zinc-800 focus:ring-2 focus:ring-indigo-500/40 text-lg font-bold rounded-xl"
                  placeholder="Optimised for PrintHub..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Target Category</label>
                  <Input 
                    value={enhancedData?.category || item.scrapedCategory || ""} 
                    onChange={(e) => setEnhancedData({...enhancedData, category: e.target.value})}
                    className="h-12 bg-zinc-900/50 border-zinc-800 focus:ring-2 focus:ring-indigo-500/40 font-bold rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Meta Slug</label>
                  <Input 
                    value={enhancedData?.slug || ""} 
                    onChange={(e) => setEnhancedData({...enhancedData, slug: e.target.value})}
                    className="h-12 bg-zinc-900/50 border-zinc-800 focus:ring-2 focus:ring-indigo-500/40 font-mono text-xs rounded-xl"
                    placeholder="product-url-slug"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">AI-Enhanced Description (Markdown)</label>
                <Textarea 
                  value={enhancedData?.description || ""} 
                  onChange={(e) => setEnhancedData({...enhancedData, description: e.target.value})}
                  className="min-h-[300px] bg-zinc-900/50 border-zinc-800 focus:ring-2 focus:ring-indigo-500/40 text-sm leading-relaxed p-6 rounded-xl resize-none font-medium text-zinc-300"
                  placeholder="The AI is typing..."
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">SEO & Social Meta</label>
                <div className="grid grid-cols-1 gap-4 mt-2">
                   <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Tag className="w-5 h-5 text-indigo-400/50" />
                         <span className="text-zinc-400 font-bold text-sm">SEO Title Generated</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">READY</Badge>
                   </div>
                   <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <MessageSquare className="w-5 h-5 text-purple-400/50" />
                         <span className="text-zinc-400 font-bold text-sm">Social Captions (9 Platforms)</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">READY</Badge>
                   </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
