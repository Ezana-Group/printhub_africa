"use client";

/**
 * Client-side Event Tracker
 * Standardizes e-commerce events across all active pixels.
 */

declare global {
  interface Window {
    fbq: any;
    ttq: any;
    gtag: any;
    twq: any;
    snaptr: any;
    pintrk: any;
    dataLayer: any[];
  }
}

/** 
 * Generates a unique ID for event deduplication between client and server.
 * Should be passed to both fbq/ttq and the backend CAPI call.
 */
export const generateEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "ev-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();
};

export const trackEvent = (eventName: string, params: Record<string, any> = {}, eventId?: string) => {
  if (typeof window === "undefined") return;

  const dedupeId = eventId || generateEventId();

  // --- META PIXEL ---
  if (window.fbq) {
    window.fbq("track", eventName, params, { eventID: dedupeId });
  }

  // --- TIKTOK PIXEL ---
  if (window.ttq) {
    window.ttq.track(eventName, { ...params, event_id: dedupeId });
  }

  // --- PINTEREST ---
  if (window.pintrk) {
    const pinterestEventMap: Record<string, string> = {
      ViewContent: "page_visit",
      AddToCart: "add_to_cart",
      InitiateCheckout: "checkout",
      Purchase: "checkout",
      Search: "search"
    };
    window.pintrk("track", pinterestEventMap[eventName] || eventName, params);
  }

  // --- GOOGLE ANALYTICS / GTAG (Standard) ---
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }

  // --- GTM / GA4 DATALAYER (E-commerce) ---
  if (window.dataLayer) {
    const ga4EventMap: Record<string, string> = {
      ViewContent: "view_item",
      AddToCart: "add_to_cart",
      InitiateCheckout: "begin_checkout",
      Purchase: "purchase"
    };
    
    if (ga4EventMap[eventName]) {
      window.dataLayer.push({
        event: ga4EventMap[eventName],
        event_id: dedupeId,
        ecommerce: {
          currency: params.currency || "KES",
          value: params.value,
          transaction_id: params.transaction_id,
          items: params.items || (params.content_ids ? [{
            item_id: params.content_ids[0],
            item_name: params.content_name,
            price: params.value,
            quantity: params.quantity || 1
          }] : [])
        }
      });
    }
  }

  // --- X (TWITTER) ---
  if (window.twq) {
    window.twq("event", eventName, params);
  }

  // --- SNAPCHAT ---
  if (window.snaptr) {
    const snapEventMap: Record<string, string> = {
      ViewContent: "VIEW_CONTENT",
      AddToCart: "ADD_CART",
      InitiateCheckout: "START_CHECKOUT",
      Purchase: "PURCHASE"
    };
    window.snaptr("track", snapEventMap[eventName] || eventName, {
      ...params,
      client_deduplication_id: dedupeId
    });
  }

  console.log(`[Tracking] Event: ${eventName} (ID: ${dedupeId})`, params);

  // --- META CONVERSIONS API (Server-side) ---
  // We trigger this from the client to the backend proxy
  fetch("/api/marketing/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId: dedupeId,
      eventData: {
        ...params,
        eventSourceUrl: window.location.href,
      },
    }),
  }).catch((err) => console.error("[Tracking] Marketing server event error:", err));

  return dedupeId;
};

/**
 * Formats an ID to match the Meta/Google catalog feed.
 * Products are prefixed with 'shop-', CatalogueItems with 'catalogue-'.
 */
export const formatCatalogId = (id: string, type: "product" | "catalogue" = "product") => {
  if (id.startsWith("shop-") || id.startsWith("catalogue-")) return id;
  return type === "product" ? `shop-${id}` : `catalogue-${id}`;
};

// Standard e-commerce helpers
export const trackViewContent = (item: { id: string; name: string; price: number; category?: string; type?: "product" | "catalogue" }) => {
  const formattedId = formatCatalogId(item.id, item.type);
  return trackEvent("ViewContent", {
    content_ids: [formattedId],
    content_name: item.name,
    content_type: "product",
    value: item.price,
    currency: "KES",
    content_category: item.category,
    items: [{
      item_id: formattedId,
      item_name: item.name,
      price: item.price,
      item_category: item.category,
      quantity: 1
    }]
  });
};

export const trackAddToCart = (item: { id: string; name: string; price: number; quantity: number; category?: string; type?: "product" | "catalogue" }) => {
  const formattedId = formatCatalogId(item.id, item.type);
  return trackEvent("AddToCart", {
    content_ids: [formattedId],
    content_name: item.name,
    content_type: "product",
    value: item.price * item.quantity,
    currency: "KES",
    quantity: item.quantity,
    items: [{
      item_id: formattedId,
      item_name: item.name,
      price: item.price,
      item_category: item.category,
      quantity: item.quantity
    }]
  });
};

export const trackInitiateCheckout = (cart: { items: any[]; total: number }) => {
  return trackEvent("InitiateCheckout", {
    content_ids: cart.items.map((i) => formatCatalogId(i.productId || i.id, i.variantId ? "product" : "product")), // Default to product for cart
    contents: cart.items.map((i) => ({ id: formatCatalogId(i.productId || i.id), quantity: i.quantity })),
    content_type: "product",
    value: cart.total,
    currency: "KES",
    num_items: cart.items.length,
    items: cart.items.map(i => ({
      item_id: formatCatalogId(i.productId || i.id),
      item_name: i.name,
      price: i.price,
      quantity: i.quantity
    }))
  });
};

export const trackPurchase = (order: { id: string; total: number; items: any[] }, eventId?: string) => {
  return trackEvent(
    "Purchase",
    {
      content_ids: order.items.map((i) => formatCatalogId(i.productId || i.id)),
      contents: order.items.map((i) => ({ id: formatCatalogId(i.productId || i.id), quantity: i.quantity })),
      content_type: "product",
      value: order.total,
      currency: "KES",
      transaction_id: order.id,
      items: order.items.map(i => ({
        item_id: formatCatalogId(i.productId || i.id),
        item_name: i.name || i.product?.name,
        price: i.unitPrice || i.price,
        quantity: i.quantity
      }))
    },
    eventId
  );
};

export const trackSearch = (query: string) => {
  return trackEvent("Search", {
    search_string: query,
    content_category: "Product Search"
  });
};
