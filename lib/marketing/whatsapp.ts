import { MARKETING_CONFIG } from "@/config/marketing-channels";

/**
 * WhatsApp Business Cloud API Integration
 * https://developers.facebook.com/docs/whatsapp/cloud-api
 */

export async function sendWhatsAppMessage({
  to,
  templateName,
  parameters = [],
  languageCode = "en",
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters?: Array<{ type: string; text?: string; image?: { link: string } }>;
}) {
  if (!MARKETING_CONFIG.WHATSAPP_ENABLED || !MARKETING_CONFIG.WHATSAPP_ACCESS_TOKEN || !MARKETING_CONFIG.WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, reason: "WhatsApp disabled or no token" };
  }

  const phone = to.replace(/\D/g, "").replace(/^0/, "254");

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: "body",
          parameters: parameters,
        },
      ],
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${MARKETING_CONFIG.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MARKETING_CONFIG.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Message] Error:", error);
    return { success: false, error };
  }
}

/** 
 * Standardized template names in Meta Business Manager:
 * 1. order_confirmation (vars: orderNumber, total, trackUrl)
 * 2. shipping_update (vars: orderNumber, trackingNumber, trackUrl)
 * 3. abandoned_cart_recovery (vars: cartUrl, shopUrl)
 * 4. back_in_stock_notification (vars: productName, productUrl)
 */

/** Triggered on successful order confirmation. */
// TODO: replace with template slug: order-confirmation-meta
export async function waOrderConfirmation(to: string, orderNumber: string, total: string) {
  return sendWhatsAppMessage({
    to,
    templateName: "order_confirmation",
    parameters: [
      { type: "text", text: orderNumber },
      { type: "text", text: total },
      { type: "text", text: `${process.env.NEXT_PUBLIC_APP_URL}/track?ref=${orderNumber}` },
    ],
  });
}

/** Triggered when order status → SHIPPED. */
// TODO: replace with template slug: shipping-update-meta
export async function waShippingUpdate(to: string, orderNumber: string, trackingNumber?: string) {
  return sendWhatsAppMessage({
    to,
    templateName: "shipping_update",
    parameters: [
      { type: "text", text: orderNumber },
      { type: "text", text: trackingNumber || "N/A" },
      { type: "text", text: `${process.env.NEXT_PUBLIC_APP_URL}/track?ref=${orderNumber}` },
    ],
  });
}

/** Abandoned cart recovery. */
export async function waAbandonedCart(to: string, cartUrl: string) {
  return sendWhatsAppMessage({
    to,
    templateName: "abandoned_cart_recovery",
    parameters: [
      { type: "text", text: cartUrl },
      { type: "text", text: `${process.env.NEXT_PUBLIC_APP_URL}/shop` },
    ],
  });
}

/** Back in stock notification. */
export async function waBackInStock(to: string, productName: string, productUrl: string) {
  return sendWhatsAppMessage({
    to,
    templateName: "back_in_stock_notification",
    parameters: [
      { type: "text", text: productName },
      { type: "text", text: productUrl },
    ],
  });
}
