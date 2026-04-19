import { MARKETING_CONFIG } from "@/config/marketing-channels";

/**
 * Klaviyo Email Marketing Integration
 * https://developers.klaviyo.com/en/reference/events
 */

export async function trackKlaviyoEvent({
  email,
  eventName,
  properties = {},
}: {
  email: string;
  eventName: string;
  properties?: Record<string, any>;
}) {
  if (!MARKETING_CONFIG.KLAVIYO_ENABLED || !MARKETING_CONFIG.KLAVIYO_API_KEY) {
    return { success: false, reason: "Klaviyo disabled or no token" };
  }

  const payload = {
    data: {
      type: "event",
      attributes: {
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: email.trim().toLowerCase(),
            },
          },
        },
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: eventName,
            },
          },
        },
        properties: properties,
      },
    },
  };

  try {
    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${MARKETING_CONFIG.KLAVIYO_API_KEY}`,
        revision: "2024-02-15",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return { success: true };
  } catch (error) {
    console.error("[Klaviyo Event] Error:", error);
    return { success: false, error };
  }
}

/** Triggered when a new user signs up. */
export async function klaviyoWelcomeSignup(user: { email: string; name?: string }) {
  return trackKlaviyoEvent({
    email: user.email,
    eventName: "Signed Up",
    properties: {
      name: user.name,
      source: "website_signup",
    },
  });
}

/** Triggered when a user adds items to cart but hasn't finished. */
export async function klaviyoAbandonedCart(email: string, cart: { total: number; items: any[]; cartUrl: string }) {
  return trackKlaviyoEvent({
    email,
    eventName: "Started Checkout",
    properties: {
      Value: cart.total,
      ItemNames: cart.items.map((i) => i.name),
      CheckoutURL: cart.cartUrl,
      Items: cart.items.map((i) => ({
        ProductID: i.productId || i.id,
        ProductName: i.name,
        Quantity: i.quantity,
        ItemPrice: i.price,
      })),
    },
  });
}

/** Triggered after successful order. */
export async function klaviyoPlacedOrder(email: string, order: { id: string; total: number; items: any[] }) {
  return trackKlaviyoEvent({
    email,
    eventName: "Placed Order",
    properties: {
      OrderID: order.id,
      Value: order.total,
      ItemNames: order.items.map((i) => i.name),
      Items: order.items.map((i) => ({
        ProductID: i.productId || i.id,
        ProductName: i.name,
        Quantity: i.quantity,
        ItemPrice: i.unitPrice,
      })),
    },
  });
}
/** Triggered when user adds a product to cart. */
export async function trackAddToCart(email: string, item: { id: string; name: string; price: number; category?: string }) {
  return trackKlaviyoEvent({
    email,
    eventName: "Added to Cart",
    properties: {
      ProductID: item.id,
      ProductName: item.name,
      ItemPrice: item.price,
      Category: item.category,
    },
  });
}

/** Triggered when a product is restocked. */
export async function trackBackInStock(email: string, product: { id: string; name: string; slug: string }) {
  return trackKlaviyoEvent({
    email,
    eventName: "Back In Stock",
    properties: {
      ProductID: product.id,
      ProductName: product.name,
      ProductURL: `${process.env.NEXT_PUBLIC_APP_URL}/shop/${product.slug}`,
    },
  });
}

/** Triggered 6 days after delivery. */
export async function trackReviewRequest(email: string, order: { id: string; items: any[] }) {
  return trackKlaviyoEvent({
    email,
    eventName: "Review Request",
    properties: {
      OrderID: order.id,
      Items: order.items.map(i => ({
        ProductName: i.name,
        ReviewURL: `${process.env.NEXT_PUBLIC_APP_URL}/shop/${i.slug}#reviews`
      }))
    },
  });
}

/** 
 * Klaviyo-driven SMS Triggers via Africa's Talking 
 * Used for flows where Klaviyo acts as the brain but AT sends the SMS.
 */
import { sendSMS } from "@/lib/africas-talking";

export async function triggerMarketingSMS(phone: string, message: string) {
  if (!MARKETING_CONFIG.KLAVIYO_ENABLED) return;
  return sendSMS(phone, message);
}
