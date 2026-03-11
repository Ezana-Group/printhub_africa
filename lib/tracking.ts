/**
 * Order tracking events — auto-created on status change, optional SMS/email.
 * Used by admin order update and payment callbacks.
 */

import { prisma } from "@/lib/prisma";

export const TRACKING_EVENTS: Record<
  string,
  {
    title: string;
    description: string;
    isPublic: boolean;
    sendSms: boolean;
    sendEmail: boolean;
  }
> = {
  PENDING: {
    title: "Order Received",
    description:
      "We've received your order and it's awaiting payment confirmation.",
    isPublic: true,
    sendSms: false,
    sendEmail: true,
  },
  CONFIRMED: {
    title: "Payment Confirmed",
    description:
      "Your payment has been received. Your order is confirmed and joining the production queue.",
    isPublic: true,
    sendSms: true,
    sendEmail: true,
  },
  PROCESSING: {
    title: "File Review & Prep",
    description:
      "Our team is reviewing your files and preparing them for print.",
    isPublic: true,
    sendSms: false,
    sendEmail: false,
  },
  PRINTING: {
    title: "In Production",
    description:
      "Your order is on the printer. We'll notify you when it's complete.",
    isPublic: true,
    sendSms: true,
    sendEmail: false,
  },
  QUALITY_CHECK: {
    title: "Quality Check",
    description:
      "Your print is complete and going through our quality inspection.",
    isPublic: true,
    sendSms: false,
    sendEmail: false,
  },
  READY_FOR_COLLECTION: {
    title: "Ready for Collection",
    description:
      "Your order is ready! Come collect it from our Nairobi location.",
    isPublic: true,
    sendSms: true,
    sendEmail: true,
  },
  SHIPPED: {
    title: "Out for Delivery",
    description:
      "Your order has been handed to our courier and is on its way to you.",
    isPublic: true,
    sendSms: true,
    sendEmail: true,
  },
  DELIVERED: {
    title: "Delivered",
    description:
      "Your order has been delivered. Thank you for choosing PrintHub!",
    isPublic: true,
    sendSms: true,
    sendEmail: true,
  },
  CANCELLED: {
    title: "Order Cancelled",
    description:
      "Your order has been cancelled. If you paid, a refund is being processed.",
    isPublic: true,
    sendSms: true,
    sendEmail: true,
  },
  REFUNDED: {
    title: "Refund Processed",
    description: "Your refund has been processed.",
    isPublic: true,
    sendSms: false,
    sendEmail: true,
  },
};

async function sendTrackingSms(_orderId: string, _status: string) {
  // TODO: integrate Africa's Talking or other SMS provider
  // const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shippingAddress: true } });
  // const phone = order?.shippingAddress?.phone ?? order?.user?.phone;
  // if (phone) await sendSms(phone, `PrintHub: Order update - ${TRACKING_EVENTS[status]?.title}`);
}

async function sendTrackingEmail(_orderId: string, _status: string) {
  // TODO: integrate Resend — send order update email with tracking link
  // const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shippingAddress: true } });
  // const email = order?.shippingAddress?.email ?? order?.user?.email;
  // if (email) await sendEmail(email, ...);
}

export type CreateTrackingEventOptions = {
  description?: string;
  location?: string;
  courierRef?: string;
  isPublic?: boolean;
  createdBy?: string;
};

export async function createTrackingEvent(
  orderId: string,
  status: string,
  options?: CreateTrackingEventOptions
) {
  const template = TRACKING_EVENTS[status];
  if (!template) return;

  await prisma.orderTrackingEvent.create({
    data: {
      orderId,
      status,
      title: template.title,
      description: options?.description ?? template.description,
      isPublic: options?.isPublic ?? template.isPublic,
      location: options?.location ?? null,
      courierRef: options?.courierRef ?? null,
      createdBy: options?.createdBy ?? null,
    },
  });

  if (template.sendSms) {
    void sendTrackingSms(orderId, status);
  }
  if (template.sendEmail) {
    void sendTrackingEmail(orderId, status);
  }
}
