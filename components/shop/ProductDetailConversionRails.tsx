"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/store/cart-store";
import { formatPrice, formatDescription } from "@/lib/utils";
import { Check, ShoppingCart } from "lucide-react";

type UpsellProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  basePrice: number;
  comparePrice: number | null;
  imageUrl: string | null;
  stock: number;
  defaultVariantId?: string;
};

interface ProductDetailConversionRailsProps {
  currentProduct: UpsellProduct;
  frequentlyBoughtTogether: UpsellProduct[];
  relatedProducts: UpsellProduct[];
  freeDeliveryThresholdKes?: number;
}

function addShopItem(
  addItem: (item: CartItem) => void,
  product: UpsellProduct,
  quantity = 1
) {
  const item: CartItem = {
    type: "SHOP",
    productId: product.id,
    variantId: product.defaultVariantId,
    quantity,
    unitPrice: product.basePrice,
    name: product.name,
    slug: product.slug,
    image: product.imageUrl ?? undefined,
  };
  addItem(item);
}

export function ProductDetailConversionRails({
  currentProduct,
  frequentlyBoughtTogether,
  relatedProducts,
  freeDeliveryThresholdKes,
}: ProductDetailConversionRailsProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const [addedSticky, setAddedSticky] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    frequentlyBoughtTogether.map((p) => p.id)
  );

  const selectedFbtProducts = useMemo(
    () => frequentlyBoughtTogether.filter((p) => selectedIds.includes(p.id)),
    [frequentlyBoughtTogether, selectedIds]
  );

  const fbtTotal = useMemo(
    () =>
      currentProduct.basePrice +
      selectedFbtProducts.reduce((sum, p) => sum + p.basePrice, 0),
    [currentProduct.basePrice, selectedFbtProducts]
  );

  const regularTotal = useMemo(
    () =>
      (currentProduct.comparePrice ?? currentProduct.basePrice) +
      selectedFbtProducts.reduce(
        (sum, p) => sum + (p.comparePrice ?? p.basePrice),
        0
      ),
    [currentProduct, selectedFbtProducts]
  );

  const bundleSavings = Math.max(0, regularTotal - fbtTotal);
  const freeDeliveryThreshold = freeDeliveryThresholdKes && freeDeliveryThresholdKes > 0
    ? freeDeliveryThresholdKes
    : 10000;
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );
  const stickyProjectedTotal = cartSubtotal + currentProduct.basePrice;
  const stickyRemaining = Math.max(0, freeDeliveryThreshold - stickyProjectedTotal);
  const fbtProjectedTotal = cartSubtotal + fbtTotal;
  const fbtRemaining = Math.max(0, freeDeliveryThreshold - fbtProjectedTotal);
  const fbtProgress = Math.min(100, Math.round((fbtProjectedTotal / freeDeliveryThreshold) * 100));

  const handleStickyAdd = () => {
    addShopItem(addItem, currentProduct);
    setAddedSticky(true);
    setTimeout(() => setAddedSticky(false), 1800);
  };

  const handleAddSelectedBundle = () => {
    addShopItem(addItem, currentProduct);
    selectedFbtProducts.forEach((item) => addShopItem(addItem, item));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      {frequentlyBoughtTogether.length > 0 && (
        <section className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Bundle savings
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                Frequently Bought Together
              </h3>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Bundle total:{" "}
              <span className="text-base text-primary">{formatPrice(fbtTotal)}</span>
            </p>
          </div>
          {bundleSavings > 0 && (
            <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              You save {formatPrice(bundleSavings)} compared to regular pricing.
            </p>
          )}
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Free delivery progress</span>
              <span>{fbtProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#CC3D00] transition-all"
                style={{ width: `${fbtProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">
              {fbtRemaining > 0
                ? `Add ${formatPrice(fbtRemaining)} more to unlock free delivery.`
                : "This bundle qualifies for free delivery."}
            </p>
          </div>

          <div className="space-y-3">
            {frequentlyBoughtTogether.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={checked}
                    onChange={() => toggleSelected(item.id)}
                  />
                  <Link href={`/shop/${item.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{formatPrice(item.basePrice)}</p>
                    </div>
                  </Link>
                </label>
              );
            })}
          </div>

          <Button
            onClick={handleAddSelectedBundle}
            className="mt-5 w-full rounded-xl bg-[#CC3D00] hover:bg-[#E64500]"
          >
            Add bundle to cart
          </Button>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Keep shopping
              </p>
              <h3 className="text-xl font-bold text-slate-900">Related products</h3>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <Card key={item.id} className="overflow-hidden rounded-2xl border-slate-200">
                <Link href={`/shop/${item.slug}`} className="block">
                  <div className="relative aspect-square bg-slate-100">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/shop/${item.slug}`} className="block">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {formatDescription(item.shortDescription) || "Premium 3D printed product."}
                    </p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-primary">{formatPrice(item.basePrice)}</p>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      disabled={item.stock < 1}
                      onClick={() => addShopItem(addItem, item)}
                    >
                      <ShoppingCart className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{currentProduct.name}</p>
            <p className="text-sm font-bold text-primary">{formatPrice(currentProduct.basePrice)}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {stickyRemaining > 0
                ? `${formatPrice(stickyRemaining)} away from free delivery`
                : "Eligible for free delivery"}
            </p>
          </div>
          <Button
            onClick={handleStickyAdd}
            className="rounded-xl bg-[#CC3D00] px-4 hover:bg-[#E64500]"
            disabled={currentProduct.stock < 1}
          >
            {addedSticky ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1 h-4 w-4" />
                Add to cart
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
