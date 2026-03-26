"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Clock, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { formatDescription, formatPrice } from "@/lib/utils";
import type { BusinessPublic } from "@/lib/business-public";

export interface Photo {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface MaterialOption {
  id: string;
  materialCode: string;
  materialName: string;
  availableColours: string[];
  priceModifierKes: number;
  isDefault: boolean;
}

export interface Designer {
  id: string;
  name: string;
  username: string | null;
  platform: string | null;
  profileUrl: string | null;
}

export interface Item {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  category: { id: string; name: string; slug: string };
  designer: Designer | null;
  sourceUrl: string | null;
  licenseType: string;
  designerCredit: string | null;
  photos: Photo[];
  availableMaterials: MaterialOption[];
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  fromPriceKes: number | null;
  minQuantity: number;
  maxQuantity: number;
  weightGrams: number | null;
  printTimeHours: number | null;
  supportsRequired: boolean;
  printDifficulty: string;
}

interface CatalogueItemDetailProps {
  item: Item;
  business: BusinessPublic;
}

export function CatalogueItemDetail({ item, business }: CatalogueItemDetailProps) {
  const addItem = useCartStore((s) => s.addItem);
  
  const materials = Array.isArray(item.availableMaterials) ? item.availableMaterials : [];
  const defaultMat = materials.find((m: MaterialOption) => m.isDefault) ?? materials[0];
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(defaultMat ?? null);
  const [selectedColour, setSelectedColour] = useState<string>(() => {
    const colours = defaultMat && Array.isArray(defaultMat.availableColours) ? defaultMat.availableColours : [];
    return colours.length ? colours[0] : "";
  });
  const [quantity, setQuantity] = useState(item.minQuantity || 1);
  const [addingToCart, setAddingToCart] = useState(false);

  const basePrice = item.priceOverrideKes ?? item.basePriceKes ?? null;
  const unitPrice =
    selectedMaterial
      ? Math.round((item.priceOverrideKes ?? item.basePriceKes ?? 0) + selectedMaterial.priceModifierKes)
      : basePrice != null
        ? Math.round(basePrice)
        : null;

  const hasMaterials = materials.length > 0;
  const canAddToCart = Boolean(
    unitPrice != null && (!hasMaterials || (selectedMaterial && (selectedMaterial.availableColours.length === 0 || selectedColour)))
  );

  const handleAddToCart = async () => {
    if (unitPrice == null || !canAddToCart) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/cart/add-catalogue-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogueItemId: item.id,
          materialCode: selectedMaterial?.materialCode ?? "",
          colourHex: selectedColour || "#000000",
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      addItem({
        ...data.cartItem,
        type: "CATALOGUE",
      });
      // We don't necessarily push to cart anymore, just show state (matching shop)
      // but the original code had router.push("/cart")
      window.location.href = "/cart";
    } catch (e) {
      console.error(e);
      setAddingToCart(false);
    }
  };

  const galleryImages = item.photos.map(p => ({
    id: p.id,
    url: p.url,
    altText: p.altText,
    isPrimary: p.isPrimary
  }));

  const waHref = (text: string) => {
    const digits = (business.whatsapp ?? "").replace(/\D/g, "") || "254700000000";
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-[13px] font-medium text-slate-400 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/catalogue" className="hover:text-primary transition-colors">Catalogue</Link>
          {item.category && (
            <>
              <span className="text-slate-300">/</span>
              <Link href={`/catalogue?category=${item.category.slug}`} className="hover:text-primary transition-colors">
                {item.category.name}
              </Link>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 truncate max-w-[200px]">{formatDescription(item.name)}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 xl:col-span-7">
            <ProductImageGallery images={galleryImages} />
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3">Catalogue Item</Badge>
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-3 capitalize">{item.licenseType.replace(/_/g, " ")}</Badge>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {formatDescription(item.name)}
              </h1>
              
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#FF4D00]">
                  {unitPrice != null ? formatPrice(unitPrice) : "Price on request"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 font-medium italic">Estimated price. VAT included.</p>

              {item.shortDescription && (
                <div className="mt-6 text-slate-600 leading-relaxed border-l-2 border-slate-100 pl-4 py-1 italic">
                  {formatDescription(item.shortDescription)}
                </div>
              )}

              {/* Specs Quick View */}
              {(item.printTimeHours || item.weightGrams) && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4">
                   {item.printTimeHours && (
                     <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <div className="text-xs">
                           <p className="text-slate-400 font-medium uppercase tracking-tighter">Est. Print Time</p>
                           <p className="text-slate-900 font-bold">{item.printTimeHours}h</p>
                        </div>
                     </div>
                   )}
                   {item.weightGrams && (
                     <div className="flex items-center gap-2.5">
                        <Weight className="h-4 w-4 text-slate-400" />
                        <div className="text-xs">
                           <p className="text-slate-400 font-medium uppercase tracking-tighter">Material weight</p>
                           <p className="text-slate-900 font-bold">{item.weightGrams}g</p>
                        </div>
                     </div>
                   )}
                </div>
              )}

              <div className="mt-8 space-y-8">
                {/* Material Selector */}
                {materials.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900">Material</label>
                    <div className="flex flex-wrap gap-2">
                      {materials.map((m) => (
                        <Button
                          key={m.id}
                          variant={selectedMaterial?.id === m.id ? "default" : "outline"}
                          size="sm"
                          className="rounded-xl h-9 px-4 transition-all duration-200"
                          onClick={() => {
                            setSelectedMaterial(m);
                            if (m.availableColours?.length) setSelectedColour(m.availableColours[0]);
                            else setSelectedColour("");
                          }}
                        >
                          {m.materialName}
                          {m.priceModifierKes > 0 && ` (+ KSh ${m.priceModifierKes})`}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colour Selector */}
                {selectedMaterial && selectedMaterial.availableColours.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900">Colour</label>
                    <div className="flex flex-wrap gap-3">
                      {selectedMaterial.availableColours.map((hex: string) => (
                        <button
                          key={hex}
                          type="button"
                          title={hex}
                          onClick={() => setSelectedColour(hex)}
                          className={`group relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ring-offset-2 ${
                            selectedColour === hex ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                          }`}
                        >
                          <span
                            className="h-full w-full rounded-full border border-slate-200 shadow-inner"
                            style={{ backgroundColor: hex }}
                          />
                          {selectedColour === hex && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={() => setQuantity((q) => Math.max(item.minQuantity, q - 1))}
                        disabled={quantity <= item.minQuantity}
                      >
                        −
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={() => setQuantity((q) => Math.min(item.maxQuantity, q + 1))}
                        disabled={quantity >= item.maxQuantity}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="rounded-xl bg-primary hover:bg-primary/90 flex-1 h-12 text-base font-bold"
                      onClick={handleAddToCart}
                      disabled={!canAddToCart || addingToCart}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {addingToCart ? "Adding…" : "Add to Cart"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500">
                <a
                  href={waHref(`Hi PrintHub! I'm interested in the catalogue item "${item.name}". Can I get more details?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
                >
                  Chat with an Agent
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Tabs/Content */}
        <div className="mt-20 max-w-4xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="attribution" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all"
              >
                Attribution
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="py-8 animate-in fade-in duration-500">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                  {item.description || item.shortDescription || "No description provided."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="attribution" className="py-8 animate-in fade-in duration-500">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Designer</p>
                    <p className="text-sm text-slate-600">
                      {item.designer?.name || item.designerCredit || "Unknown"}
                    </p>
                  </div>
                  {item.licenseType && (
                    <div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">License</p>
                      <div className="mt-1">
                        <LicenceBadge licence={item.licenseType} size="sm" />
                      </div>
                    </div>
                  )}
                  {item.sourceUrl && (
                    <Button variant="outline" className="rounded-xl border-slate-200" asChild>
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">View Original Source</a>
                    </Button>
                  )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
