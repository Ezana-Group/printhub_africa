"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageItem {
  id?: string;
  url: string;
  altText?: string | null;
  isPrimary?: boolean;
}

export function ProductImageGallery({ images }: { images: ImageItem[] }) {
  const sorted = [
    ...images.filter((i) => i.isPrimary),
    ...images.filter((i) => !i.isPrimary),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mainViewportRef, emblaMainApi] = useEmblaCarousel({ loop: true });
  const [thumbViewportRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect);
    emblaMainApi.on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200">
        <p className="text-sm font-medium text-slate-400">Image placeholder</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 shadow-sm" ref={mainViewportRef}>
          <div className="flex touch-pan-y">
            {sorted.map((img, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 relative aspect-square">
                <Image
                  src={img.url}
                  alt={img.altText ?? "Product image"}
                  fill
                  className="object-contain p-4 md:p-8"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg pointer-events-auto h-10 w-10 bg-white/80 backdrop-blur-sm border-0"
            onClick={() => emblaMainApi?.scrollPrev()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg pointer-events-auto h-10 w-10 bg-white/80 backdrop-blur-sm border-0"
            onClick={() => emblaMainApi?.scrollNext()}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
           <Button variant="secondary" size="icon" className="rounded-full h-8 w-8 bg-white/60 backdrop-blur-sm border-0">
              <Maximize2 className="h-4 w-4 text-slate-600" />
           </Button>
        </div>
      </div>

      {sorted.length > 1 && (
        <div className="overflow-hidden px-1" ref={thumbViewportRef}>
          <div className="flex gap-3">
            {sorted.map((img, index) => (
              <button
                key={index}
                onClick={() => onThumbClick(index)}
                className={cn(
                  "relative flex-[0_0_80px] aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200",
                  index === selectedIndex
                    ? "border-[#FF4D00] shadow-md scale-105"
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300"
                )}
              >
                <Image
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
