"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUploader } from "@/components/upload/FileUploader";
import { Loader2 } from "lucide-react";

type TabId = "details" | "photos" | "stl";

function ImportPhotosFromPrintablesButton({
  itemId,
  sourceUrl,
  currentPhotoCount,
  onSuccess,
}: {
  itemId: string;
  sourceUrl: string;
  currentPhotoCount: number;
  onSuccess: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canAdd = currentPhotoCount < 8;

  async function handleImport() {
    if (!canAdd) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/catalogue/${itemId}/import-photos-from-printables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? "Import failed");
        return;
      }
      setMessage(data?.message ?? `Imported ${data?.photosImported ?? 0} photo(s).`);
      await onSuccess();
      if (typeof (window as unknown as { refresh?: () => void }).refresh === "function") (window as unknown as { refresh: () => void }).refresh();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        onClick={handleImport}
        disabled={loading || !canAdd}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Importing…" : "Import photos from Printables"}
      </Button>
      {message && <span className="text-sm text-slate-600">{message}</span>}
    </div>
  );
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Photo {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Item {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categoryId: string;
  tags: string[];
  sourceUrl: string | null;
  licenseType: string;
  designerCredit: string | null;
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  minQuantity: number;
  maxQuantity: number;
  isFeatured: boolean;
  category?: { id: string; name: string; slug: string };
  photos: Photo[];
}

interface CatalogueEditFormProps {
  item: Item;
  categories: Category[];
  defaultTab: string;
}

export function CatalogueEditForm({
  item: initialItem,
  categories,
  defaultTab,
}: CatalogueEditFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(
    (defaultTab === "photos" || defaultTab === "stl" ? defaultTab : "details") as TabId
  );
  const [item, setItem] = useState<Item>(initialItem);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialItem.name);
  const [slug, setSlug] = useState(initialItem.slug);
  const [shortDescription, setShortDescription] = useState(
    initialItem.shortDescription ?? ""
  );
  const [description, setDescription] = useState(initialItem.description ?? "");
  const [categoryId, setCategoryId] = useState(initialItem.categoryId);
  const [basePriceKes, setBasePriceKes] = useState(
    initialItem.basePriceKes != null ? String(initialItem.basePriceKes) : ""
  );
  const [priceOverrideKes, setPriceOverrideKes] = useState(
    initialItem.priceOverrideKes != null ? String(initialItem.priceOverrideKes) : ""
  );
  const [sourceUrl, setSourceUrl] = useState(initialItem.sourceUrl ?? "");
  const [isFeatured, setIsFeatured] = useState(initialItem.isFeatured ?? false);

  useEffect(() => {
    setItem(initialItem);
    setName(initialItem.name);
    setSlug(initialItem.slug);
    setShortDescription(initialItem.shortDescription ?? "");
    setDescription(initialItem.description ?? "");
    setCategoryId(initialItem.categoryId);
    setBasePriceKes(
      initialItem.basePriceKes != null ? String(initialItem.basePriceKes) : ""
    );
    setPriceOverrideKes(
      initialItem.priceOverrideKes != null
        ? String(initialItem.priceOverrideKes)
        : ""
    );
    setSourceUrl(initialItem.sourceUrl ?? "");
    setIsFeatured(initialItem.isFeatured ?? false);
  }, [initialItem]);

  const refetchItem = useCallback(async () => {
    const res = await fetch(`/api/admin/catalogue/${initialItem.id}`);
    if (res.ok) {
      const data = await res.json();
      setItem((prev) => ({ ...prev, ...data, photos: data.photos ?? prev.photos }));
    }
  }, [initialItem.id]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/catalogue/${initialItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          shortDescription: shortDescription.trim() || null,
          description: description.trim() || null,
          categoryId: categoryId || undefined,
          sourceUrl: sourceUrl.trim() ? sourceUrl.trim() : null,
          basePriceKes: basePriceKes ? parseFloat(basePriceKes) : null,
          priceOverrideKes: priceOverrideKes
            ? parseFloat(priceOverrideKes)
            : null,
          isFeatured,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? "Failed to save");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const setMainPhoto = async (photoId: string) => {
    const res = await fetch(
      `/api/admin/catalogue/${initialItem.id}/photos/${photoId}/set-main`,
      { method: "PATCH" }
    );
    if (res.ok) {
      await refetchItem();
      router.refresh();
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(
      `/api/admin/catalogue/${initialItem.id}/photos/${photoId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      await refetchItem();
      router.refresh();
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "photos", label: "Photos" },
    { id: "stl", label: "STL file" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === t.id
                ? "bg-slate-100 text-slate-900 border-b-2 border-[#FF4D00] -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-4 max-w-xl">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sourceUrl">Printables link</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.printables.com/model/12345-name"
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-0.5">
              Link to the model on Printables.com (for attribution and re-import).
            </p>
          </div>
          <div>
            <Label htmlFor="shortDesc">Short description</Label>
            <Textarea
              id="shortDesc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Base price (KES)</Label>
              <Input
                id="basePrice"
                type="number"
                min={0}
                step={1}
                value={basePriceKes}
                onChange={(e) => setBasePriceKes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="priceOverride">Price override (KES)</Label>
              <Input
                id="priceOverride"
                type="number"
                min={0}
                step={1}
                value={priceOverrideKes}
                onChange={(e) => setPriceOverrideKes(e.target.value)}
                className="mt-1"
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
          <Button type="submit" disabled={loading} className="rounded-xl">
            {loading ? "Saving…" : "Save details"}
          </Button>
        </form>
      )}

      {tab === "photos" && (
        <div className="space-y-6">
          {item.sourceUrl?.toLowerCase().includes("printables.com") && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Import from Printables</p>
              <p className="text-xs text-slate-500 mb-3">
                Fetch images from the Printables link (saved in Details). New photos are added up to 8 total.
              </p>
              <ImportPhotosFromPrintablesButton
                itemId={initialItem.id}
                sourceUrl={item.sourceUrl}
                currentPhotoCount={item.photos.length}
                onSuccess={async () => {
                  await refetchItem();
                  router.refresh();
                }}
              />
            </div>
          )}
          {item.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Photos ({item.photos.length}) — click &quot;Set main&quot; to set
                featured image
              </p>
              <div className="grid grid-cols-3 gap-3">
                {item.photos.map((photo, i) => (
                  <div key={photo.id} className="relative group">
                    <div
                      className={`rounded-xl overflow-hidden border-2 ${
                        photo.isPrimary
                          ? "border-[#FF4D00]"
                          : "border-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.altText ?? `Photo ${i + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                    </div>
                    {photo.isPrimary && (
                      <span className="absolute top-2 left-2 bg-[#FF4D00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        MAIN
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center gap-2">
                      {!photo.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setMainPhoto(photo.id)}
                          className="bg-white text-xs font-medium px-2 py-1 rounded-lg"
                        >
                          Set main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id)}
                        className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Add photos
            </p>
            <FileUploader
              context="ADMIN_CATALOGUE_PHOTO"
              accept={["image/jpeg", "image/png", "image/webp"]}
              maxSizeMB={20}
              maxFiles={Math.max(0, 8 - item.photos.length)}
              hint="JPEG, PNG, WebP · Min 800×800px · Show actual printed items"
              onUploadComplete={async (files) => {
                const res = await fetch(
                  `/api/admin/catalogue/${initialItem.id}/photos`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fileIds: files.map((f) => f.uploadId),
                    }),
                  }
                );
                if (res.ok) {
                  await refetchItem();
                  router.refresh();
                }
              }}
            />
          </div>
        </div>
      )}

      {tab === "stl" && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
          <p className="font-medium">STL file upload</p>
          <p className="text-sm mt-1">
            Upload and attach an STL file for this catalogue item. (Coming soon — AUDIT-FIX: wire FileUploader ADMIN_CATALOGUE_STL or use import from Printables.)
          </p>
        </div>
      )}
    </div>
  );
}
