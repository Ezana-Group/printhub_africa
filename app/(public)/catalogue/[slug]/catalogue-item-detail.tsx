"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";

interface Photo {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface MaterialOption {
  id: string;
  materialCode: string;
  materialName: string;
  availableColours: string[];
  priceModifierKes: number;
  isDefault: boolean;
}

interface Designer {
  id: string;
  name: string;
  username: string | null;
  platform: string | null;
  profileUrl: string | null;
}

interface Item {
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
  slug: string;
}

export function CatalogueItemDetail({ slug }: CatalogueItemDetailProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null);
  const [selectedColour, setSelectedColour] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(`/api/catalogue/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        if (data?.error) {
          setError(true);
          return;
        }
        setItem(data);
        const materials = Array.isArray(data?.availableMaterials) ? data.availableMaterials : [];
        const defaultMat = materials.find((m: MaterialOption) => m.isDefault) ?? materials[0];
        setSelectedMaterial(defaultMat ?? null);
        const colours = defaultMat && Array.isArray(defaultMat.availableColours) ? defaultMat.availableColours : [];
        if (colours.length) setSelectedColour(colours[0]);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const basePrice = item ? (item.priceOverrideKes ?? item.basePriceKes ?? null) : null;
  const unitPrice =
    item && selectedMaterial
      ? Math.round((item.priceOverrideKes ?? item.basePriceKes ?? 0) + selectedMaterial.priceModifierKes)
      : basePrice != null
        ? Math.round(basePrice)
        : null;

  const handleAddToCart = async () => {
    if (!item || !selectedMaterial || !selectedColour || unitPrice == null) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/cart/add-catalogue-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogueItemId: item.id,
          materialCode: selectedMaterial.materialCode,
          colourHex: selectedColour,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      addItem({
        ...data.cartItem,
        type: "CATALOGUE",
      });
      router.push("/cart");
    } catch (e) {
      console.error(e);
      setAddingToCart(false);
    }
  };

  if (loading && !item) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Model not found</h1>
        <p className="text-slate-600 mt-2">This item may be unavailable or the link is incorrect.</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href="/catalogue">Browse catalogue</Link>
        </Button>
      </div>
    );
  }

  const photos = Array.isArray(item.photos) ? item.photos : [];
  const primaryPhoto = photos[primaryPhotoIndex] ?? photos[0];

  return (
    <div className="bg-white min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-10">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100">
              {primaryPhoto?.url ? (
                <Image
                  src={primaryPhoto.url}
                  alt={primaryPhoto.altText ?? item.name}
                  fill
                  className="object-contain"
                  sizes="(max-width:1024px) 100vw, 55vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No image</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrimaryPhotoIndex(i)}
                    className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 ${
                      i === primaryPhotoIndex ? "border-primary" : "border-slate-200"
                    }`}
                  >
                    <Image src={p.url} alt={p.altText ?? ""} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Photos show actual PrintHub prints — not renders.</p>
          </div>

          {/* Details + order */}
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-lg">{item.category.name}</Badge>
              <Badge variant="outline" className="rounded-lg">{item.licenseType.replace("_", " ")}</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 mt-3">{item.name}</h1>
            {item.shortDescription && (
              <p className="text-slate-600 mt-2">{item.shortDescription}</p>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Material</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Array.isArray(item.availableMaterials) ? item.availableMaterials : []).map((m) => (
                    <Button
                      key={m.id}
                      variant={selectedMaterial?.id === m.id ? "default" : "outline"}
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setSelectedMaterial(m);
                        if (m.availableColours?.length) setSelectedColour(m.availableColours[0]);
                      }}
                    >
                      {m.materialName}
                      {m.priceModifierKes > 0 && ` (+ KSh ${m.priceModifierKes})`}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedMaterial && Array.isArray(selectedMaterial.availableColours) && selectedMaterial.availableColours.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Colour</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedMaterial.availableColours.map((hex: string) => (
                      <button
                        key={hex}
                        type="button"
                        title={hex}
                        onClick={() => setSelectedColour(hex)}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          selectedColour === hex ? "border-primary ring-2 ring-primary/30" : "border-slate-300"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-700">Quantity</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setQuantity((q) => Math.max(item.minQuantity, q - 1))}
                    disabled={quantity <= item.minQuantity}
                  >
                    −
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setQuantity((q) => Math.min(item.maxQuantity, q + 1))}
                    disabled={quantity >= item.maxQuantity}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-2xl font-bold text-slate-900">
                {unitPrice != null ? `KSh ${(unitPrice * quantity).toLocaleString()}` : "Price on request"}
              </p>
              <p className="text-sm text-slate-500">Per item · VAT included</p>
              <Button
                className="mt-4 w-full rounded-xl"
                size="lg"
                onClick={handleAddToCart}
                disabled={!selectedMaterial || !selectedColour || unitPrice == null || addingToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addingToCart ? "Adding…" : "Add to Cart"}
              </Button>
            </div>

            {item.designerCredit && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">Designer credit</p>
                <p className="text-sm text-slate-600 mt-1">{item.designerCredit}</p>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    View original →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Full description — show complete description from catalogue (not cut off) */}
        {item.description?.trim() && (
          <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 border-t border-slate-200">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-3">Full description</h2>
            <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
              {item.description.trim()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
