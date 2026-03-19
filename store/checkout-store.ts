"use client";

import { create } from "zustand";

export type CheckoutStep = 1 | 2 | 3 | 4;

export interface CheckoutContact {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createAccount: boolean;
  password?: string;
}

export interface CheckoutDelivery {
  street: string;
  area: string;
  county: string;
  city: string;
  postalCode: string;
  notes: string;
  method: "STANDARD" | "EXPRESS" | "PICKUP";
  fee: number;
  estimatedDays?: string;
  /** Delivery zone id (from shipping fee API) for order record */
  deliveryZoneId?: string;
  /** Estimated delivery date ISO string for order record */
  estimatedDelivery?: string;
  /** When method is PICKUP, chosen location id and display name */
  pickupLocationId?: string;
  pickupLocationName?: string;
  /** Preferred courier location (for STANDARD/EXPRESS delivery) */
  preferredCourierId?: string;
  preferredCourierName?: string;
}

export interface CheckoutPayment {
  method:
    | "MPESA"
    | "AIRTEL_MONEY"
    | "TKASH"
    | "PESAPAL"
    | "BANK_TRANSFER"
    | "CARD"
    | "APPLE_PAY"
    | "GOOGLE_PAY"
    | "INVOICE_NET_30"
    | "INVOICE_NET_60";
  mpesaPhone?: string;
  /** PO / reference when paying by invoice (corporate) */
  poReference?: string;
  /** Airtel Money / TKash phone (Airtel: 07XX; Telkom: 07XX) */
  mobileMoneyPhone?: string;
  /** Card details (only for display; card payment is via PesaPal redirect at checkout) */
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardholderName?: string;
}

export interface CheckoutCoupon {
  code: string;
  discountKes: number;
  valid: boolean;
}

interface CheckoutState {
  step: CheckoutStep;
  contact: Partial<CheckoutContact>;
  delivery: Partial<CheckoutDelivery>;
  payment: Partial<CheckoutPayment>;
  coupon: CheckoutCoupon | null;
  orderId: string | null;
  /** For abandoned-cart recovery: cart id and session id from PATCH /api/checkout/cart */
  cartId: string | null;
  cartSessionId: string | null;

  setStep: (step: CheckoutStep) => void;
  setContact: (contact: Partial<CheckoutContact>) => void;
  setDelivery: (delivery: Partial<CheckoutDelivery>) => void;
  setPayment: (payment: Partial<CheckoutPayment>) => void;
  setCoupon: (coupon: CheckoutCoupon | null) => void;
  setOrderId: (id: string | null) => void;
  setCartId: (cartId: string | null, cartSessionId: string | null) => void;
  reset: () => void;
}

const initialContact: Partial<CheckoutContact> = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  createAccount: false,
};

const initialDelivery: Partial<CheckoutDelivery> = {
  street: "",
  area: "",
  county: "",
  city: "Nairobi",
  postalCode: "",
  notes: "",
  method: "STANDARD",
  fee: 0,
};

const initialPayment: Partial<CheckoutPayment> = {
  method: "MPESA",
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 1,
  contact: initialContact,
  delivery: initialDelivery,
  payment: initialPayment,
  coupon: null,
  orderId: null,
  cartId: null,
  cartSessionId: null,

  setStep: (step) => set({ step }),
  setContact: (contact) => set((s) => ({ contact: { ...s.contact, ...contact } })),
  setDelivery: (delivery) => set((s) => ({ delivery: { ...s.delivery, ...delivery } })),
  setPayment: (payment) => set((s) => ({ payment: { ...s.payment, ...payment } })),
  setCoupon: (coupon) => set({ coupon }),
  setOrderId: (orderId) => set({ orderId }),
  setCartId: (cartId, cartSessionId) => set({ cartId, cartSessionId }),
  reset: () =>
    set({
      step: 1,
      contact: initialContact,
      delivery: initialDelivery,
      payment: initialPayment,
      coupon: null,
      orderId: null,
      cartId: null,
      cartSessionId: null,
    }),
}));
