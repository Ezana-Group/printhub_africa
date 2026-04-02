/**
 * Order tracking events — auto-created on status change, optional SMS/email.
 * Used by admin order update and payment callbacks.
 */

import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { sendOrderStatusEmail } from "@/lib/email";
import { sendSMS } from "@/lib/africas-talking";
import { klaviyoPlacedOrder } from "@/lib/marketing/klaviyo";
import { waOrderConfirmation, waShippingUpdate } from "@/lib/marketing/whatsapp";
import { sendMetaConversionsEvent, sendTikTokEventsApi, sendSnapConversionsEvent } from "@/lib/marketing/conversions-api";

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
      "Your order is ready! Come collect it from our {{city}} location.",
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
      "Your order has been delivered. Thank you for choosing {{businessName}}!",
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

async function sendTrackingSms(orderId: string, status: string) {
  const template = TRACKING_EVENTS[status];
  if (!template) return;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true, user: { select: { phone: true } } },
  });
  const phone = order?.shippingAddress?.phone ?? order?.user?.phone;
  if (phone) {
    await sendSMS(phone, `PrintHub: ${template.title} – Order ${order?.orderNumber ?? orderId}. Track: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/track?ref=${order?.orderNumber ?? ""}`);
  }
}

async function sendTrackingEmail(orderId: string, status: string) {
  const template = TRACKING_EVENTS[status];
  if (!template) return;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true, user: { select: { email: true } } },
  });
  const email = order?.shippingAddress?.email ?? order?.user?.email;
  if (email && order?.orderNumber) {
    const business = await getBusinessPublic();
    const description = template.description
      .replace(/\{\{city\}\}/g, business.city || "facility")
      .replace(/\{\{businessName\}\}/g, business.businessName);
    await sendOrderStatusEmail(email, order.orderNumber, template.title, description);
  }
}

export type CreateTrackingEventOptions = {
  description?: string;
  location?: string;
  courierRef?: string;
  isPublic?: boolean;
  createdBy?: string;
  userData?: {
    ip?: string;
    userAgent?: string;
    fbc?: string;
    fbp?: string;
  };
};

export async function createTrackingEvent(
  orderId: string,
  status: string,
  options?: CreateTrackingEventOptions
) {
  const template = TRACKING_EVENTS[status];
  if (!template) return;

  const business = await getBusinessPublic();
  let description = options?.description ?? template.description;
  description = description
    .replace(/\{\{city\}\}/g, business.city || "facility")
    .replace(/\{\{businessName\}\}/g, business.businessName);

  await prisma.orderTrackingEvent.create({
    data: {
      orderId,
      status,
      title: template.title,
      description,
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

  // --- MARKETING TRIGGERS ---
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      shippingAddress: true, 
      user: { select: { email: true, phone: true, name: true } },
      items: { include: { product: true } } 
    },
  });

  if (order) {
    const email = order.shippingAddress?.email ?? order.user?.email;
    const phone = order.shippingAddress?.phone ?? order.user?.phone;

    if (status === "CONFIRMED") {
      if (email) {
        void klaviyoPlacedOrder(email, { 
          id: order.id, 
          total: Number(order.total), 
          items: order.items.map(i => ({ id: i.productId, name: i.product?.name || "Product", unitPrice: Number(i.unitPrice), quantity: i.quantity }))
        });
        
        if (options?.userData) {
          const eventId = `order-${order.id}-${Date.now()}`;
          const userData = { ...options.userData, email, phone };
          
          // Meta CAPI
          sendMetaConversionsEvent({
            eventName: "Purchase",
            eventId,
            userData,
            customData: { value: Number(order.total), currency: "KES", order_id: order.id }
          }).then((res: { success: boolean; error?: any }) => {
            if (!res.success) logMarketingError("Meta CAPI", res.error, { orderId, eventId });
          });

          // TikTok CAPI
          sendTikTokEventsApi({
            event: "CompletePayment",
            eventId,
            userData,
            customData: { value: Number(order.total), currency: "KES" }
          }).then((res: { success: boolean; error?: any }) => {
            if (!res.success) logMarketingError("TikTok API", res.error, { orderId, eventId });
          });

          // Snapchat CAPI
          sendSnapConversionsEvent({
            event: "PURCHASE",
            eventId,
            userData,
            customData: { price: Number(order.total), currency: "KES", transaction_id: order.id }
          }).then((res: { success: boolean; error?: any }) => {
            if (!res.success) logMarketingError("Snap CAPI", res.error, { orderId, eventId });
          });
        }
      }
      if (phone) {
        void waOrderConfirmation(phone, order.orderNumber, Number(order.total).toLocaleString());
      }
    }

    if (status === "SHIPPED" && phone) {
      void waShippingUpdate(phone, order.orderNumber, order.trackingNumber || undefined);
    }
  }
}

/** Logs marketing errors to the database for admin troubleshooting. */
async function logMarketingError(channel: string, error: any, payload?: any) {
  try {
    // @ts-ignore - bypassing persistent prisma property linting after generation
    await prisma.marketingErrorLog.create({
      data: {
        channel,
        error: typeof error === "string" ? error : JSON.stringify(error),
        payload: payload || null,
      },
    });
  } catch (e) {
    console.error("Failed to log marketing error:", e);
  }
}
