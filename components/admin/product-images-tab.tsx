"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { Star, Trash2, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";

const BROKEN_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E";

export interface ProductImage {
  id?: string;
  url: string;
  storageKey?: string;
  uploadId?: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
  source: "uploaded" | "url";
}

export function ProductImagesTab({
  productId,
  initialImages,
  onSave,
}: {
  productId: string;
  initialImages: ProductImage[];
  onSave?: (images: ProductImage[]) => void;
}) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  // Track uploadIds already added to prevent duplicates from multi-file onUploadComplete bursts
  const addedUploadIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!productId) {
      setImages(initialImages);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/products/${productId}/images`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.images) ? data.images : [];
        setImages(
          list.length > 0
            ? list
            : initialImages.map((img, i) => ({
                ...img,
                isMain: i === 0,
                sortOrder: i,
                source: (img as ProductImage).source ?? "url",
              }))
        );
      })
      .catch(() => {
        if (!cancelled) setImages(initialImages);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only re-run when productId changes; initialImages is used as fallback when API returns empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const setMain = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addFromUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http")) {
      setUrlError("Please enter a valid URL starting with https://");
      return;
    }
    if (images.length >= 8) {
      setUrlError("Maximum 8 images allowed");
      return;
    }
    setUrlError("");
    setImages((prev) => [
      ...prev,
      {
        url,
        isMain: prev.length === 0,
        sortOrder: prev.length,
        source: "url",
      },
    ]);
    setUrlInput("");
  };

  const saveImages = useCallback(async (imagesToSave: ProductImage[]) => {
    if (!productId) return;
    setSaving(true);
    setAutoSaved(false);
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: imagesToSave.map((img, i) => ({
            id: img.id,
            url: img.url,
            storageKey: img.storageKey,
            uploadId: img.uploadId,
            altText: img.altText,
            isMain: img.isMain,
            sortOrder: i,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 3000);
      onSave?.(imagesToSave);
    } catch {
      setUrlError("Failed to save images. Please try the Save button.");
    } finally {
      setSaving(false);
    }
  }, [productId, onSave]);

  if (loading && !initialImages.length) {
    return (
      <div className="space-y-6 p-6">
        <p className="text-sm text-gray-500">Loading images…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              Product images ({images.length}/8)
            </p>
            <p className="text-xs text-gray-400">
              Click ★ to set as featured image
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={img.id ?? img.url ?? i} className="relative group">
                <div
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                    img.isMain
                      ? "border-[#FF4D00] shadow-md shadow-orange-100"
                      : "border-gray-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(img.url && (img.url.startsWith("/") || img.url.startsWith("http"))) ? img.url : BROKEN_IMAGE_PLACEHOLDER}
                    alt={img.altText ?? `Product image ${i + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = BROKEN_IMAGE_PLACEHOLDER;
                    }}
                  />
                </div>

                {img.isMain && (
                  <span className="absolute top-1.5 left-1.5 bg-[#FF4D00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                    Featured
                  </span>
                )}

                <span
                  className={`absolute top-1.5 right-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                    img.source === "uploaded"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {img.source === "uploaded" ? "R2" : "URL"}
                </span>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center gap-2">
                  {!img.isMain && (
                    <button
                      type="button"
                      onClick={() => setMain(i)}
                      title="Set as featured"
                      className="w-8 h-8 bg-[#FF4D00] rounded-lg flex items-center justify-center hover:bg-[#e64400] transition"
                    >
                      <Star className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition"
                  >
                    <ExternalLink className="w-4 h-4 text-white" />
                  </a>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Alt text..."
                  value={img.altText ?? ""}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((p, j) =>
                        j === i ? { ...p, altText: e.target.value } : p
                      )
                    )
                  }
                  className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length < 8 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Upload images
            <span className="text-gray-400 font-normal ml-1">
              ({8 - images.length} slots remaining)
            </span>
          </p>
          <FileUploader
            context="ADMIN_PRODUCT_IMAGE"
            accept={["image/jpeg", "image/png", "image/webp"]}
            maxSizeMB={20}
            maxFiles={8 - images.length}
            hint="JPEG, PNG, WebP · Min 800×800px recommended · Square images work best"
            onUploadComplete={(files) => {
              const baseUrl =
                typeof process !== "undefined" && process.env.NEXT_PUBLIC_R2_PUBLIC_URL
                  ? process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, "")
                  : "";
              // Deduplicate: only process uploadIds not yet added (FileUploader fires
              // onUploadComplete with ALL done files on each individual completion)
              const trulyNew = files.filter((f) => !addedUploadIds.current.has(f.uploadId));
              if (trulyNew.length === 0) return;
              trulyNew.forEach((f) => addedUploadIds.current.add(f.uploadId));

              const newImages = trulyNew
                .map((f) => {
                  const url =
                    f.publicUrl ?? (f.storageKey && baseUrl ? `${baseUrl}/${f.storageKey}` : "");
                  if (!url || !url.startsWith("http")) return null;
                  return {
                    url,
                    storageKey: f.storageKey,
                    uploadId: f.uploadId,
                    source: "uploaded" as const,
                  };
                })
                .filter((img): img is NonNullable<typeof img> => img !== null);

              if (newImages.length < trulyNew.length) {
                setUrlError(
                  "Some images had no public URL. Ensure R2_PUBLIC_URL and NEXT_PUBLIC_R2_PUBLIC_URL are set."
                );
              } else {
                setUrlError("");
              }

              if (newImages.length === 0) return;

              // Merge with existing and auto-save immediately so images persist on refresh
              setImages((prev) => {
                const merged = [
                  ...prev,
                  ...newImages.map((img, i) => ({
                    ...img,
                    isMain: prev.length === 0 && i === 0,
                    sortOrder: prev.length + i,
                  })),
                ];
                // Auto-save after state update
                if (productId) {
                  setTimeout(() => saveImages(merged), 0);
                }
                return merged;
              });
            }}
          />
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          Or add from URL
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </p>
        <p className="text-xs text-gray-400 mb-2">
          For images already hosted externally (Unsplash, your CDN etc.)
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setUrlError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && addFromUrl()}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF4D00]"
          />
          <button
            type="button"
            onClick={addFromUrl}
            disabled={!urlInput.trim() || images.length >= 8}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition"
          >
            Add
          </button>
        </div>
        {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
      </div>

      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No images yet</p>
          <p className="text-xs text-gray-300 mt-1">
            Upload images above or add from URL
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {saving && (
            <span className="flex items-center gap-1.5 text-[#FF4D00]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </span>
          )}
          {autoSaved && !saving && (
            <span className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => saveImages(images)}
          disabled={saving || !productId}
          className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#e64400] text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save images"}
        </button>
      </div>
    </div>
  );
}
