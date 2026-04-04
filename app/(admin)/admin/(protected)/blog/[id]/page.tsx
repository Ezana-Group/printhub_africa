"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  PenSquare, 
  Tag as TagIcon, 
  Sparkles, 
  Globe, 
  Clock,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BlogEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    bodyHtml: "",
    tags: [] as string[],
    targetKeyword: "",
    status: "DRAFT",
    aiGenerated: false,
  });

  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await fetch("/api/admin/blog");
      if (!response.ok) throw new Error("Failed to fetch");
      const posts = await response.json();
      const post = posts.find((p: any) => p.id === id);
      if (post) {
        setFormData({
          title: post.title,
          excerpt: post.excerpt || "",
          bodyHtml: post.bodyHtml,
          tags: post.tags || [],
          targetKeyword: post.targetKeyword || "",
          status: post.status,
          aiGenerated: post.aiGenerated,
        });
      } else {
        toast.error("Post not found");
        router.push("/admin/blog");
      }
    } catch (error) {
      toast.error("Could not load article");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData };
      if (publish) payload.status = "PUBLISHED";

      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Save failed");
      
      const savedPost = await response.json();
      toast.success(publish ? "Published successfully!" : "Progress saved");
      
      if (isNew) {
        router.push(`/admin/blog/${savedPost.id}`);
      } else {
        setFormData(prev => ({ ...prev, status: savedPost.status }));
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-zinc-500 font-bold tracking-widest uppercase">Initializing Editorial Suite...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-zinc-800 rounded-full" asChild>
            <Link href="/admin/blog"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white italic py-1">
              {isNew ? "Create New Insight" : "Refine Knowledge"}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
              <Clock className="w-3.5 h-3.5" /> 
              {isNew ? "Drafting Mode" : `Status: ${formData.status}`}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 px-6 font-bold"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Progress"}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-8 font-black uppercase tracking-widest text-xs"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Globe className="mr-2 h-4 w-4" /> {formData.status === "PUBLISHED" ? "Update Live" : "Go Live Now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-900/50 bg-zinc-900/20 px-8 py-5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PenSquare className="w-5 h-5 text-primary" /> Content Strategy
                </CardTitle>
                <div className="bg-zinc-900 rounded-lg p-1 flex gap-1">
                  <Button 
                    size="sm" 
                    variant={activeTab === "edit" ? "secondary" : "ghost"} 
                    onClick={() => setActiveTab("edit")}
                    className="h-8 font-bold"
                  >
                    Editor
                  </Button>
                  <Button 
                    size="sm" 
                    variant={activeTab === "preview" ? "secondary" : "ghost"} 
                    onClick={() => setActiveTab("preview")}
                    className="h-8 font-bold"
                  >
                    Live Preview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeTab === "edit" ? (
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Headline</label>
                    <Input 
                      placeholder="Enter a compelling, SEO-ready title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-zinc-900/30 border-zinc-800 h-14 text-xl font-bold rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Body Composition (HTML)</label>
                    <Textarea 
                      placeholder="Compose your article using HTML structure..."
                      value={formData.bodyHtml}
                      onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                      className="min-h-[500px] bg-zinc-900/10 border-zinc-800 font-mono text-sm leading-relaxed rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-zinc-300 scrollbar-hide"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-white min-h-[600px] prose prose-slate max-w-none prose-headings:font-black prose-img:rounded-3xl shadow-inner overflow-y-auto max-h-[800px]">
                  <h1 className="text-5xl font-black mb-8 leading-tight">{formData.title || "Untitled Insight"}</h1>
                  <div dangerouslySetInnerHTML={{ __html: formData.bodyHtml || "<p className='text-slate-400 italic font-medium'>No content generated yet...</p>" }} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-900/50 bg-zinc-900/20 px-8 py-5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> SEO & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 flex justify-between">
                  Expert Excerpt
                  <span className={formData.excerpt.length > 160 ? "text-red-400" : "text-zinc-600"}>
                    {formData.excerpt.length}/160
                  </span>
                </label>
                <Textarea 
                  placeholder="The executive summary shown in listings..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="bg-zinc-900/30 border-zinc-800 text-sm leading-relaxed rounded-xl text-zinc-400 h-32"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Target Keyword</label>
                <Input 
                  placeholder="e.g., T-shirt Printing Nairobi"
                  value={formData.targetKeyword}
                  onChange={(e) => setFormData({ ...formData, targetKeyword: e.target.value })}
                  className="bg-zinc-900/30 border-zinc-800 h-11 rounded-xl text-zinc-400"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <TagIcon className="w-3.5 h-3.5" /> Categorization
                </label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] items-start">
                  {formData.tags.map(tag => (
                    <Badge key={tag} className="bg-zinc-800 text-zinc-400 py-1 pl-3 pr-2 flex items-center gap-2 border-zinc-700 hover:bg-zinc-700 transition-colors">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="New tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    className="bg-zinc-900/30 border-zinc-800 h-10 rounded-lg text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={addTag} className="h-10 font-bold border-zinc-800">Add</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900/50">
                <div className="flex items-center justify-between p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mb-4">
                  <div className="space-y-1">
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-400">Smart Engine</div>
                    <div className="text-[10px] text-zinc-500 font-medium">AI Generation Helper enabled</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${formData.aiGenerated ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]' : 'bg-zinc-700'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
