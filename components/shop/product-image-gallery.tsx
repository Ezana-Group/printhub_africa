"use client";

import { useState } from "react";

interface ImageItem {
  id?: string;
  url: string;
  altText?: string | null;
  isPrimary?: boolean;
}

export function ProductImageGallery({ images }: { images: ImageItem[] }) {
  const [selected, setSelected] = useState(0);

  const sorted = [
    ...images.filter((i) => i.isPrimary),
    ...images.filter((i) => !i.isPrimary),
  ];

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100">
        <p className="text-sm text-slate-400">No photos available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sorted[selected]?.url}
          alt={sorted[selected]?.altText ?? "Product image"}
          className="h-full w-full object-contain p-2"
        />
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id ?? img.url ?? i}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                selected === i
                  ? "border-[#FF4D00]"
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText ?? `View ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
