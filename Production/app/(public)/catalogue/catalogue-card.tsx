"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CatalogueCardProps {
  item: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    category: { name: string; slug: string };
    licenseType: string;
    primaryPhotoUrl: string | null;
    availableMaterials: { materialCode: string; materialName: string }[];
    fromPriceKes: number | null;
    isFeatured: boolean;
    isNewArrival: boolean;
    isStaffPick: boolean;
    isPopular: boolean;
  };
}

export function CatalogueCard({ item }: CatalogueCardProps) {
  const badges = [];
  if (item.isNewArrival) badges.push("NEW");
  if (item.isStaffPick) badges.push("STAFF PICK");
  if (item.isPopular) badges.push("POPULAR");

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/catalogue/${item.slug}`} className="block">
        <div className="relative aspect-square bg-slate-100">
          {item.primaryPhotoUrl ? (
            <Image
              src={item.primaryPhotoUrl}
              alt={item.name}
              fill
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">No image</div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {badges.map((b) => (
              <Badge key={b} className="rounded-md bg-primary/90 text-xs">{b}</Badge>
            ))}
          </div>
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="rounded-md text-xs opacity-90">
              {item.licenseType.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-slate-500">{item.category.name}</p>
        <Link href={`/catalogue/${item.slug}`}>
          <h3 className="font-semibold text-slate-900 mt-0.5 line-clamp-2 group-hover:text-primary">{item.name}</h3>
        </Link>
        {item.shortDescription && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.shortDescription}</p>
        )}
        <div className="mt-2">
          <span className="font-bold text-primary">
            {item.fromPriceKes != null ? `From KSh ${item.fromPriceKes.toLocaleString()}` : "Price on request"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {item.availableMaterials.slice(0, 3).map((m) => m.materialName).join(" · ")}
          {item.availableMaterials.length > 3 && ` · +${item.availableMaterials.length - 3} more`}
        </p>
        <Button asChild className="mt-3 w-full rounded-xl" size="sm">
          <Link href={`/catalogue/${item.slug}`}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Order This
          </Link>
        </Button>
      </div>
    </div>
  );
}
