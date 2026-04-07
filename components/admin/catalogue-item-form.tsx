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
import { X } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
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
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1.5"
            onClick={async () => {
              if (!name) {
                setError("Please enter a name first to get AI suggestions.");
                return;
              }
              setLoading(true);
              try {
                const res = await fetch("/api/admin/ai/n8n/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    action: "GENERATE_CATALOGUE_SUGGESTION", 
                    name, 
                    categoryId 
                  }),
                });
                if (res.ok) {
                  // This is a placeholder for a real n8n callback or polling
                  // In a real app, you'd wait for n8n to push back or poll a status
                  setError("AI suggestion request sent. For now, n8n will process this and update the record (requires saved item).");
                }
              } catch (e) {
                setError("AI suggestion failed.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Ask AI to fill
          </Button>
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
      <div className="flex items-center gap-3">
        <Switch
          id="isFeatured"
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
        />
        <Label htmlFor="isFeatured" className="cursor-pointer text-sm font-medium">
          Featured on homepage (show in Print on Demand section)
        </Label>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium">Media & Files</h3>
        
        <div className="space-y-2">
          <Label>Photos</Label>
          <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
            {photos.map((url, i) => (
              <div key={i} className="group relative aspect-square rounded-lg border bg-muted overflow-hidden">
                <Image src={url} alt={`Upload ${i}`} fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 p-1 bg-white/80 rounded-full shadow-sm text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <FileUploader
            context="CATALOGUE_ITEM"
            accept={["image/png", "image/jpeg", "image/webp"]}
            maxFiles={10}
            onUploadComplete={(files) => {
              const urls = files.map(f => f.publicUrl).filter((url): url is string => !!url);
              setPhotos(prev => [...prev, ...urls]);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>3D Model File (.stl, .3mf, .obj)</Label>
          {modelUrl && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 border border-green-200 text-sm text-green-700 mb-2">
              <span className="truncate flex-1">{modelUrl.split('/').pop()}</span>
              <button type="button" onClick={() => setModelUrl("")} className="text-red-500 hover:text-red-700">Remove</button>
            </div>
          )}
          <FileUploader
            context="CATALOGUE_ITEM"
            accept={["application/octet-stream", ".stl", ".3mf", ".obj"]}
            maxFiles={1}
            onUploadComplete={(files) => {
              const url = files[0]?.publicUrl;
              if (url) setModelUrl(url);
            }}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium">Metadata & Attributions</h3>
        
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
            <Label htmlFor="sourceUrl">Source URL (Thingiverse/Printables)</Label>
            <Input
              id="sourceUrl"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
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
          <Label htmlFor="materials">Recommended Materials (comma separated)</Label>
          <Input
            id="materials"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="PLA, PETG, Resin..."
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create catalogue item"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/catalogue">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
