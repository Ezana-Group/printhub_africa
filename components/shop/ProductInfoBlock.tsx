"use client";

import React, { useState } from "react";
import { formatPrice, formatDescription } from "@/lib/utils";
import { FilamentColorSelector } from "./FilamentColorSelector";
import { AddToCartButton } from "@/app/(public)/shop/[slug]/add-to-cart-button";
import { ProductTrustBadges } from "./ProductTrustBadges";
import { ProductSocialProof } from "./ProductSocialProof";
import { Clock, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MaterialSelector } from "./MaterialSelector";
import type { BusinessPublic } from "@/lib/business-public";

interface Consumable {
  id: string;
  name: string;
  kind: string;
  colourHex: string | null;
}

interface ProductPrintMaterial {
  isDefault: boolean;
  consumable: Consumable;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number | string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  basePrice: any;
  comparePrice: any | null;
  isPOD: boolean;
  isFeatured: boolean;
  soldThisMonth: number;
  shortDescription: string | null;
  printTimeEstimate: string | null;
  filamentWeightGrams: number | null;
  images: string[];
  printMaterials: ProductPrintMaterial[];
  variants: ProductVariant[];
  minOrderQty: number;
  maxOrderQty: number | null;
  stock: number;
}

interface Props {
  product: Product;
  business: BusinessPublic;
  whatsappTemplate?: string | null;
}

export function ProductInfoBlock({ product, business, whatsappTemplate }: Props) {
  const [selectedColor, setSelectedColor] = useState<{ id: string; name: string; hex: string } | undefined>();
  
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: string; name: string } | undefined>(() => {
    const def = product.printMaterials?.find((m) => m.isDefault);
    if (def) return { id: def.consumable.id, name: def.consumable.name };
    if (product.printMaterials?.length > 0) {
      const first = product.printMaterials[0];
      return { id: first.consumable.id, name: first.consumable.name };
    }
    return undefined;
  });
  
  const basePrice = Number(product.basePrice);
  const comparePrice = product.comparePrice != null ? Number(product.comparePrice) : null;
  const isPOD = !!product.isPOD;

  const renderWhatsAppMsg = (template: string | null | undefined, defaultMsg: string, context: Record<string, string>) => {
    if (!template) return defaultMsg;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? "");
  };

  const waHref = (text: string) => {
    const digits = (business.whatsappNumber ?? business.whatsapp ?? "").replace(/\D/g, "") || "254727410320";
    const prefix = business.whatsappMessage ? `${business.whatsappMessage}\n\n` : "";
    
    const finalMsg = renderWhatsAppMsg(whatsappTemplate, text, {
      productName: product.name,
      sku: product.sku ?? "",
    });

    return `https://wa.me/${digits}?text=${encodeURIComponent(prefix + finalMsg)}`;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        {product.isFeatured && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3">Featured</Badge>
        )}
        {isPOD && (
           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3">Print on Demand</Badge>
        )}
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
        {formatDescription(product.name)}
      </h1>
      
      {product.sku && <p className="mt-2 text-sm text-slate-400 font-mono tracking-wider">SKU: {product.sku}</p>}
      
      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-3xl font-black text-[#FF4D00]">{formatPrice(basePrice)}</span>
        {comparePrice != null && comparePrice > basePrice && (
          <span className="text-xl text-slate-400 line-through decoration-slate-300 font-medium">
            {formatPrice(comparePrice)}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-500 font-medium italic">Prices include 16% VAT. Free delivery for orders above KES 10,000.</p>

      <ProductSocialProof soldThisMonth={product.soldThisMonth} />

      {product.shortDescription && (
        <div className="mt-6 text-slate-600 leading-relaxed border-l-2 border-slate-100 pl-4 py-1 italic">
          {formatDescription(product.shortDescription)}
        </div>
      )}

      {/* POD Specs Quick View */}
      {isPOD && (product.printTimeEstimate || product.filamentWeightGrams) && (
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4">
           {product.printTimeEstimate && (
             <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <div className="text-xs">
                   <p className="text-slate-400 font-medium uppercase tracking-tighter">Est. Print Time</p>
                   <p className="text-slate-900 font-bold">{product.printTimeEstimate}</p>
                </div>
             </div>
           )}
           {product.filamentWeightGrams && (
             <div className="flex items-center gap-2.5">
                <Weight className="h-4 w-4 text-slate-400" />
                <div className="text-xs">
                   <p className="text-slate-400 font-medium uppercase tracking-tighter">Material weight</p>
                   <p className="text-slate-900 font-bold">{product.filamentWeightGrams}g</p>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="mt-8 space-y-8">
        <MaterialSelector 
          materials={product.printMaterials?.map((m) => ({
            id: m.consumable.id,
            name: m.consumable.name,
            kind: m.consumable.kind,
            colourHex: m.consumable.colourHex,
            isDefault: m.isDefault
          })) || []}
          selectedMaterialId={selectedMaterial?.id}
          onMaterialSelect={(m) => setSelectedMaterial({ id: m.id, name: m.name })}
        />

        <FilamentColorSelector 
          productSlug={product.slug}
          selectedColorId={selectedColor?.id}
          onColorSelect={(c) => setSelectedColor({ id: c.id, name: c.name, hex: c.hexCode })}
        />

        <div className="pt-2">
          <AddToCartButton
            productId={product.id}
            name={product.name}
            slug={product.slug}
            image={product.images?.[0] || undefined}
            basePrice={basePrice}
            variants={product.variants.map((v) => ({
               id: v.id,
               name: v.name,
               price: Number(v.price),
               stock: v.stock
            }))}
            stock={product.stock}
            minOrderQty={product.minOrderQty}
            maxOrderQty={product.maxOrderQty ?? undefined}
            selectedColor={selectedColor ? { name: selectedColor.name, hex: selectedColor.hex } : undefined}
            selectedMaterial={selectedMaterial}
          />
        </div>
      </div>

      <ProductTrustBadges />

      <div className="mt-4 flex flex-col gap-3">
        <a
          href={waHref(`Hi PrintHub! I'm interested in "${product.name}". Can I get more details?`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat with an Agent
        </a>
      </div>
    </div>
  );
}
