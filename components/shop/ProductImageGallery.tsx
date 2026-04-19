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
      <div className="flex aspect-square items-center justify-center rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-100">
        <p className="text-sm font-medium text-slate-300 italic">No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="overflow-hidden rounded-[40px] bg-[#F8F9FA] border border-slate-100/50 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50" ref={mainViewportRef}>
          <div className="flex touch-pan-y">
            {sorted.map((img, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 relative aspect-square">
                <Image
                  src={img.url}
                  alt={img.altText ?? "Product image"}
                  fill
                  className="object-contain p-6 md:p-12 hover:scale-105 transition-transform duration-700 ease-out"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none px-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-2xl pointer-events-auto h-12 w-12 bg-white/90 backdrop-blur-md border-0 text-slate-900 hover:bg-white hover:scale-110 active:scale-95 transition-all"
            onClick={() => emblaMainApi?.scrollPrev()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-2xl pointer-events-auto h-12 w-12 bg-white/90 backdrop-blur-md border-0 text-slate-900 hover:bg-white hover:scale-110 active:scale-95 transition-all"
            onClick={() => emblaMainApi?.scrollNext()}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300">
           <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-white/60 backdrop-blur-md border-0 hover:bg-white hover:scale-110 transition-all">
              <Maximize2 className="h-5 w-5 text-slate-900" />
           </Button>
        </div>
      </div>

      {sorted.length > 1 && (
        <div className="overflow-hidden px-1 py-2" ref={thumbViewportRef}>
          <div className="flex gap-4">
            {sorted.map((img, index) => (
              <button
                key={index}
                onClick={() => onThumbClick(index)}
                className={cn(
                  "relative flex-[0_0_100px] aspect-square rounded-[24px] overflow-hidden border-[3px] transition-all duration-300",
                  index === selectedIndex
                    ? "border-[#FF4D00] shadow-lg shadow-orange-100 scale-105 z-10"
                    : "border-transparent opacity-50 hover:opacity-100 hover:border-slate-200"
                )}
              >
                <Image
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover p-1"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
