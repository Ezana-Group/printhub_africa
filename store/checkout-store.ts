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
}

export interface CheckoutPayment {
  method:
    | "MPESA"
    | "AIRTEL_MONEY"
    | "TKASH"
    | "STRIPE"
    | "PESAPAL"
    | "FLUTTERWAVE"
    | "BANK_TRANSFER"
    | "CARD"
    | "APPLE_PAY"
    | "GOOGLE_PAY";
  mpesaPhone?: string;
  /** Airtel Money / TKash phone (Airtel: 07XX; Telkom: 07XX) */
  mobileMoneyPhone?: string;
  /** Card details (only for display/validation; never send raw card to server — use Stripe Elements token in production) */
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

  setStep: (step: CheckoutStep) => void;
  setContact: (contact: Partial<CheckoutContact>) => void;
  setDelivery: (delivery: Partial<CheckoutDelivery>) => void;
  setPayment: (payment: Partial<CheckoutPayment>) => void;
  setCoupon: (coupon: CheckoutCoupon | null) => void;
  setOrderId: (id: string | null) => void;
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

  setStep: (step) => set({ step }),
  setContact: (contact) => set((s) => ({ contact: { ...s.contact, ...contact } })),
  setDelivery: (delivery) => set((s) => ({ delivery: { ...s.delivery, ...delivery } })),
  setPayment: (payment) => set((s) => ({ payment: { ...s.payment, ...payment } })),
  setCoupon: (coupon) => set({ coupon }),
  setOrderId: (orderId) => set({ orderId }),
  reset: () =>
    set({
      step: 1,
      contact: initialContact,
      delivery: initialDelivery,
      payment: initialPayment,
      coupon: null,
      orderId: null,
    }),
}));
