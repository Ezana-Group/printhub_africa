"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderTree, 
  Plus, 
  Loader2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Save,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { items: number };
}

export default function CatalogueCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New category form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalogue/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/admin/catalogue/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          description: newDesc,
          isActive: true,
          sortOrder: categories.length
        })
      });
      
      if (res.ok) {
        setNewName("");
        setNewSlug("");
        setNewDesc("");
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create category");
      }
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      const res = await fetch("/api/admin/catalogue/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          isActive: !category.isActive
        })
      });
      if (res.ok) {
        setCategories(categories.map(c => 
          c.id === category.id ? { ...c, isActive: !c.isActive } : c
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const autoSlug = (name: string) => {
    setNewName(name);
    setNewSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <FolderTree className="h-8 w-8 text-primary" />
            Catalogue Categories
          </h1>
          <p className="text-slate-500 mt-1">Manage categories for the 3D Model Prep Catalogue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b font-medium text-slate-700 flex justify-between">
              <span>Existing Categories</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            
            {categories.length === 0 && !loading ? (
              <div className="p-12 text-center">
                <FolderTree className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No categories found. Use the form to your right to create one.</p>
              </div>
            ) : (
              <div className="divide-y">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cat.isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                        <FolderTree className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">/{cat.slug}</p>
                        {cat.description && <p className="text-sm text-slate-600 mt-1 line-clamp-1">{cat.description}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Items</p>
                        <p className="text-lg font-bold text-slate-900 tabular-nums">{cat._count?.items || 0}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 rounded-full ${cat.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                        onClick={() => toggleStatus(cat)}
                      >
                        {cat.isActive ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Category Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border shadow-lg p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Category
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Articulated Models"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900"
                  value={newName}
                  onChange={(e) => autoSlug(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5 font-mono text-xs">Slug</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/</span>
                  <input
                    type="text"
                    required
                    placeholder="articulated-models"
                    className="w-full h-11 pl-7 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Description (Optional)</label>
                <textarea
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 min-h-[100px]"
                  placeholder="What kind of items go here?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={saving || !newName || !newSlug}
                className="w-full h-12 rounded-xl text-md font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                Create Category
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
