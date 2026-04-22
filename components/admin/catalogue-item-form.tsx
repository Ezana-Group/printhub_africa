"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";
import { FileUploader } from "@/components/upload/FileUploader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Info, FileCode, Tag } from "lucide-react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogueItemFormProps {
  categories: Category[];
}

export function CatalogueItemForm({ categories }: CatalogueItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [isFeatured, setIsFeatured] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [modelUrl, setModelUrl] = useState("");
  const [designerCredit, setDesignerCredit] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [materials, setMaterials] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          shortDescription: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          sourceType: "MANUAL",
          isFeatured,
          photos,
          modelUrl: modelUrl || undefined,
          designerCredit: designerCredit.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          materials: materials.split(",").map(m => m.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? data?.error ?? "Failed to create item");
        return;
      }
      router.push("/admin/catalogue");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="gap-2">
            <Info className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <FileCode className="h-4 w-4" />
            Media & Files
          </TabsTrigger>
          <TabsTrigger value="metadata" className="gap-2">
            <Tag className="h-4 w-4" />
            Metadata
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 max-w-2xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cable Organizer"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief tagline (optional)"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
              </div>
              <div className="mt-1">
                <SmartTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Full description (HTML/Rich Text)"
                  minHeight="200px"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
              <div>
                <Label htmlFor="isFeatured" className="cursor-pointer text-sm font-bold">
                  Featured on homepage
                </Label>
                <p className="text-xs text-slate-500">Show in the Print on Demand section for all visitors.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-8 max-w-4xl">
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-bold">Product Photos</Label>
              <p className="text-sm text-slate-500 mb-4">Upload up to 10 high-quality images. JPEG, PNG, or WebP.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-5">
                {photos.map((url, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl border bg-muted overflow-hidden shadow-sm">
                    <Image src={url} alt={`Upload ${i}`} fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-md text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 text-white text-[10px] py-0.5 text-center font-bold">
                        FEATURED
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <FileUploader
                context="ADMIN_CATALOGUE_PHOTO"
                accept={["image/png", "image/jpeg", "image/webp"]}
                maxFiles={10}
                onUploadComplete={(files) => {
                  const urls = files.map(f => f.publicUrl).filter((url): url is string => !!url);
                  setPhotos(prev => [...prev, ...urls]);
                }}
              />
            </div>

            <div className="pt-6 border-t">
              <Label className="text-lg font-bold">3D Model File</Label>
              <p className="text-sm text-slate-500 mb-4">Primary model for internal reference and rendering. (.stl, .3mf, .obj)</p>
              
              {modelUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 mb-4">
                  <FileCode className="h-5 w-5 text-emerald-600" />
                  <span className="truncate flex-1 font-mono text-xs">{modelUrl.split('/').pop()}</span>
                  <button type="button" onClick={() => setModelUrl("")} className="text-red-500 hover:text-red-700 font-bold px-2">Remove</button>
                </div>
              )}
              
              <FileUploader
                context="ADMIN_CATALOGUE_STL"
                accept={["application/octet-stream", ".stl", ".3mf", ".obj"]}
                maxFiles={1}
                onUploadComplete={(files) => {
                  const url = files[0]?.publicUrl;
                  if (url) setModelUrl(url);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6 max-w-2xl">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="designerCredit">Designer Credit</Label>
                <Input
                  id="designerCredit"
                  value={designerCredit}
                  onChange={(e) => setDesignerCredit(e.target.value)}
                  placeholder="e.g. MakerName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input
                  id="sourceUrl"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="Thingiverse / Printables link"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="gadget, office, gift..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Recommended Materials</Label>
              <Input
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="PLA, PETG, Resin..."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 pt-6 border-t">
        <Button type="submit" disabled={loading} size="lg" className="min-w-[150px]">
          {loading ? "Creating…" : "Create catalogue item"}
        </Button>
        <Button type="button" variant="outline" size="lg" asChild>
          <Link href="/admin/catalogue">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
