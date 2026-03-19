"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const CART_SYNC_DEBOUNCE_MS = 1500;
let cartSyncTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleCartSync() {
  if (typeof window === "undefined") return;
  if (cartSyncTimeout) clearTimeout(cartSyncTimeout);
  cartSyncTimeout = setTimeout(() => {
    cartSyncTimeout = null;
    const state = useCartStore.getState();
    fetch("/api/cart/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: state.items,
        couponCode: state.appliedCoupon?.code ?? undefined,
      }),
    }).catch(() => {});
  }, CART_SYNC_DEBOUNCE_MS);
}

/** Shop product cart line */
export interface ShopCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  name: string;
  image?: string;
  slug: string;
  type?: "SHOP";
}

/** Print-on-Demand catalogue cart line */
export interface CatalogueCartItem {
  type: "CATALOGUE";
  catalogueItemId: string;
  name: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  materialCode: string;
  materialName: string;
  colourHex: string;
  colourName: string;
  quantity: number;
  unitPrice: number;
  weightGrams?: number;
  printTimeHours?: number;
}

export type CartItem = ShopCartItem | CatalogueCartItem;

export function isCatalogueCartItem(i: CartItem): i is CatalogueCartItem {
  return i.type === "CATALOGUE";
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

function cartItemKey(i: CartItem): string {
  if (isCatalogueCartItem(i)) {
    return `cat:${i.catalogueItemId}:${i.materialCode}:${i.colourHex}`;
  }
  return `shop:${i.productId}:${i.variantId ?? ""}`;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  updateCatalogueQuantity: (catalogueItemId: string, materialCode: string, colourHex: string, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  removeCatalogueItem: (catalogueItemId: string, materialCode: string, colourHex: string) => void;
  clearCart: () => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      addItem: (item) => {
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          const normalized: CartItem = "type" in item && item.type === "CATALOGUE"
            ? { ...item, image: item.image ?? item.imageUrl }
            : { ...item, type: "SHOP" as const };
          return { items: [...state.items, normalized] };
        });
        scheduleCartSync();
      },
      updateQuantity: (productId, variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, variantId);
          return;
        }
        const key = `shop:${productId}:${variantId ?? ""}`;
        set((state) => ({
          items: state.items.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity } : i
          ),
        }));
        scheduleCartSync();
      },
      updateCatalogueQuantity: (catalogueItemId, materialCode, colourHex, quantity) => {
        if (quantity < 1) {
          get().removeCatalogueItem(catalogueItemId, materialCode, colourHex);
          return;
        }
        const key = `cat:${catalogueItemId}:${materialCode}:${colourHex}`;
        set((state) => ({
          items: state.items.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity } : i
          ),
        }));
        scheduleCartSync();
      },
      removeItem: (productId, variantId) => {
        const key = `shop:${productId}:${variantId ?? ""}`;
        set((state) => ({
          items: state.items.filter((i) => cartItemKey(i) !== key),
        }));
        scheduleCartSync();
      },
      removeCatalogueItem: (catalogueItemId, materialCode, colourHex) => {
        const key = `cat:${catalogueItemId}:${materialCode}:${colourHex}`;
        set((state) => ({
          items: state.items.filter((i) => cartItemKey(i) !== key),
        }));
        scheduleCartSync();
      },
      clearCart: () => {
        set({ items: [], appliedCoupon: null });
        scheduleCartSync();
      },
      setAppliedCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
        scheduleCartSync();
      },
      total: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "printhub-cart" }
  )
);
