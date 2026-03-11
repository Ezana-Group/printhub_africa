"use client";

import { useState, useEffect } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { X, ExternalLink } from "lucide-react";

function getPublicUrl(file: { publicUrl?: string; storageKey: string }): string {
  if (file.publicUrl) return file.publicUrl;
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_R2_PUBLIC_URL : "";
  return base && file.storageKey ? `${base}/${file.storageKey}` : file.storageKey;
}

export function CategoryImageField({
  currentImageUrl,
  onChange,
}: {
  categoryId?: string;
  currentImageUrl?: string | null;
  onChange: (url: string | null) => void;
}) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl ?? "");
  const [urlInput, setUrlInput] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    setImageUrl(currentImageUrl ?? "");
  }, [currentImageUrl]);

  const setImage = (url: string) => {
    setImageUrl(url);
    onChange(url);
  };

  const removeImage = () => {
    setImageUrl("");
    setUrlInput("");
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        Category image
      </label>

      {imageUrl ? (
        <div className="relative">
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video w-full max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Category image"
              className="w-full h-full object-cover"
              onError={() => removeImage()}
            />
          </div>

          <div className="absolute top-2 right-2 flex gap-1.5">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow-sm transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
            </a>
            <button
              type="button"
              onClick={removeImage}
              className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-red-50 shadow-sm transition"
            >
              <X className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">{imageUrl}</p>
        </div>
      ) : (
        <FileUploader
          context="ADMIN_CATEGORY_IMAGE"
          accept={["image/jpeg", "image/png", "image/webp"]}
          maxSizeMB={5}
          maxFiles={1}
          hint="JPEG, PNG, WebP · Recommended: 1200×630px (16:9) · Max 5MB"
          onUploadComplete={([file]) => {
            if (file) setImage(getPublicUrl(file));
          }}
        />
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          {showUrl ? "Hide" : "Or use an image URL instead"}
        </button>

        {showUrl && (
          <div className="flex gap-2 mt-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#FF4D00]"
            />
            <button
              type="button"
              onClick={() => {
                if (urlInput.startsWith("http")) {
                  setImage(urlInput);
                  setShowUrl(false);
                }
              }}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium"
            >
              Use URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
