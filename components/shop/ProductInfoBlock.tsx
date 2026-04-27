"use client";

import React, { useState } from "react";
import { formatPrice, formatDescription } from "@/lib/utils";
import { ProductMaterialSelector } from "./ProductMaterialSelector";
import { AddToCartButton } from "./AddToCartButton";
import { ProductTrustBadges } from "./ProductTrustBadges";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  business: any;
  freeDeliveryThresholdKes?: number;
  /** Body text from the "product-inquiry-whatsapp" template. Supports {{productName}}. */
  waTemplateBody?: string | null;
}

export function ProductInfoBlock({ product, business, freeDeliveryThresholdKes, waTemplateBody }: Props) {
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: string; name: string; colorHex: string; brand: string } | null>(null);
  
  const basePrice = Number(product.basePrice);
  const comparePrice = product.comparePrice != null ? Number(product.comparePrice) : null;
  const isPOD = !!product.isPOD;
  const deliveryCopy =
    freeDeliveryThresholdKes && freeDeliveryThresholdKes > 0
      ? `Free delivery for orders above ${formatPrice(freeDeliveryThresholdKes)}.`
      : "Delivery fees are calculated at checkout.";

  const waHref = (text: string) => {
    const digits = (business.whatsapp ?? "").replace(/\D/g, "") || "254700000000";
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  // Build the pre-fill message from the "product-inquiry-whatsapp" WhatsApp template
  // (Admin → Content → Templates → WhatsApp → Product Inquiry).
  // All {{placeholder}} tokens are replaced with real product data before the link is built.
  const waProductMessage = (() => {
    const template = waTemplateBody
      ?? `Hi PrintHub! I'm interested in "{{productName}}". Can I get more details?`;

    const siteBase = (process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa").replace(/\/$/, "");
    const productUrl = `${siteBase}/shop/${product.slug}`;
    const productPrice = basePrice > 0 ? formatPrice(basePrice) : "";
    const firstImage: string = product.images?.[0] ?? "";

    return template
      .replace(/\{\{productName\}\}/g, product.name)
      .replace(/\{\{productUrl\}\}/g, productUrl)
      .replace(/\{\{productImage\}\}/g, firstImage)
      .replace(/\{\{productSlug\}\}/g, product.slug ?? "")
      .replace(/\{\{productPrice\}\}/g, productPrice)
      .replace(/\{\{productSku\}\}/g, product.sku ?? "")
      .replace(/\{\{productCategory\}\}/g, product.category?.name ?? product.categoryName ?? "")
      .replace(/\{\{productDescription\}\}/g, product.shortDescription ?? "");
  })();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        {product.isFeatured && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Featured</Badge>
        )}
        {isPOD && (
           <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Print on Demand</Badge>
        )}
      </div>

      <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
        {formatDescription(product.name)}
      </h1>
      
      <div className="mt-8 flex flex-col gap-1">
        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-black text-[#CC3D00] tracking-tighter">{formatPrice(basePrice)}</span>
          {comparePrice != null && comparePrice > basePrice && (
            <span className="text-2xl text-slate-300 line-through font-bold">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 font-medium italic">
          Prices include 16% VAT. {deliveryCopy}
        </p>
      </div>

      <div className="mt-10 space-y-10">
        <ProductMaterialSelector 
          productSlug={product.slug}
          onSelectionChange={(m) => setSelectedMaterial(m ? { id: m.id, name: m.name, colorHex: m.colorHex, brand: m.brand } : null)}
        />

        <AddToCartButton
          productId={product.id}
          name={product.name}
          slug={product.slug}
          image={product.images?.[0] || undefined}
          basePrice={basePrice}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          variants={product.variants.map((v: any) => ({
             id: v.id,
             name: v.name,
             price: Number(v.price),
             stock: v.stock
          }))}
          stock={product.stock}
          minOrderQty={product.minOrderQty}
          maxOrderQty={product.maxOrderQty ?? undefined}
          selectedColor={selectedMaterial ? { name: selectedMaterial.name, hex: selectedMaterial.colorHex } : undefined}
          selectedMaterial={selectedMaterial?.brand} // Using brand as material name for now, or name
        />
      </div>

      <ProductTrustBadges />

      <div className="mt-auto pt-6">
        <a
          href={waHref(waProductMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#E8FFF3] text-[#00A34C] font-extrabold text-base border border-[#BFFFD9] hover:bg-[#D5FFE7] transition-all duration-300 shadow-sm group"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          Chat with an Agent
        </a>
      </div>
    </div>
  );
}
