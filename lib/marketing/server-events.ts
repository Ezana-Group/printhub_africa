import crypto from "crypto";
import { MARKETING_CONFIG } from "@/config/marketing-channels";
import { hashEmail, hashPhone } from "./hash-utils";

export interface ServerEventData {
  eventId?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  numItems?: number;
  userEmail?: string;
  userPhone?: string;
  userIp?: string;
  userAgent?: string;
  eventSourceUrl?: string;
}

export interface ServerEventResponse {
  success: boolean;
  eventId: string;
  results: Array<{ platform: string; success: boolean; status?: number; error?: unknown; response?: unknown }>;
}

const isDev = () => process.env.NODE_ENV === "development";

function buildMetaPayload(eventName: string, data: ServerEventData) {
  const hashedEmail = data.userEmail ? hashEmail(data.userEmail) : undefined;
  const hashedPhone = data.userPhone ? hashPhone(data.userPhone) : undefined;

  const userData: Record<string, unknown> = {
    client_ip_address: data.userIp,
    client_user_agent: data.userAgent,
  };

  if (hashedEmail) userData.em = [hashedEmail];
  if (hashedPhone) userData.ph = [hashedPhone];

  return {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        event_source_url: data.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: {
          value: data.value,
          currency: data.currency ?? "KES",
          content_ids: data.contentIds,
          content_name: data.contentName,
          content_type: data.contentIds?.length ? "product" : undefined,
          num_items: data.numItems,
        },
      },
    ],
  };
}

function buildTikTokPayload(eventName: string, data: ServerEventData) {
  return {
    pixel_code: MARKETING_CONFIG.TIKTOK_PIXEL_ID,
    event: eventName,
    event_id: data.eventId,
    timestamp: new Date().toISOString(),
    context: {
      user_agent: data.userAgent,
      ip: data.userIp,
      page: { url: data.eventSourceUrl },
      user: {
        email: data.userEmail ? hashEmail(data.userEmail) : undefined,
        phone_number: data.userPhone ? hashPhone(data.userPhone) : undefined,
      },
    },
    properties: {
      value: data.value,
      currency: data.currency ?? "KES",
      content_id: data.contentIds?.[0],
      content_name: data.contentName,
      content_type: data.contentIds?.length ? "product" : undefined,
      num_items: data.numItems,
    },
  };
}

function buildSnapPayload(eventName: string, data: ServerEventData) {
  return {
    pixel_id: MARKETING_CONFIG.SNAP_PIXEL_ID,
    event_type: eventName,
    event_conversion_type: "WEB",
    event_tag: data.eventId,
    client_dedup_id: data.eventId,
    timestamp: Date.now(),
    hashed_email: data.userEmail ? hashEmail(data.userEmail) : undefined,
    hashed_phone_number: data.userPhone ? hashPhone(data.userPhone) : undefined,
    price: data.value,
    currency: data.currency ?? "KES",
    item_ids: data.contentIds,
  };
}

function buildPinterestPayload(eventName: string, data: ServerEventData) {
  return {
    data: [
      {
        event_name: eventName,
        action_source: "web",
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        event_source_url: data.eventSourceUrl,
        user_data: {
          em: data.userEmail ? hashEmail(data.userEmail) : undefined,
          ph: data.userPhone ? hashPhone(data.userPhone) : undefined,
          client_ip_address: data.userIp,
          client_user_agent: data.userAgent,
        },
        custom_data: {
          value: data.value != null ? data.value.toString() : undefined,
          currency: data.currency ?? "KES",
          content_ids: data.contentIds,
          num_items: data.numItems,
        },
      },
    ],
  };
}

function sanitizeEventData(data: ServerEventData) {
  return {
    ...data,
    userEmail: data.userEmail ? "[HASHED]" : undefined,
    userPhone: data.userPhone ? "[HASHED]" : undefined,
  };
}

export async function sendMetaServerEvent(eventName: string, eventData: ServerEventData) {
  const eventNameMap: Record<string, string> = {
    ViewContent: "ViewContent",
    AddToCart: "AddToCart",
    Purchase: "Purchase",
    InitiateCheckout: "InitiateCheckout",
  };

  const mappedEventName = eventNameMap[eventName] || eventName;
  if (!MARKETING_CONFIG.META_CONVERSIONS_API_ENABLED || !MARKETING_CONFIG.META_ACCESS_TOKEN) {
    if (isDev()) console.log("[Meta CAPI] Disabled or missing token", mappedEventName, sanitizeEventData(eventData));
    return { success: false, platform: "meta", reason: "disabled" };
  }

  if (!MARKETING_CONFIG.META_PIXEL_ID) {
    return { success: false, platform: "meta", reason: "missing_pixel" };
  }

  const payload = buildMetaPayload(mappedEventName, eventData);
  const url = `https://graph.facebook.com/v18.0/${MARKETING_CONFIG.META_PIXEL_ID}/events?access_token=${MARKETING_CONFIG.META_ACCESS_TOKEN}`;

  if (isDev) {
    console.log("[Meta CAPI] Dry run", url, payload);
    return { success: true, platform: "meta", status: 0, payload };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: response.ok, platform: "meta", status: response.status, response: data, payload };
  } catch (error) {
    console.error("[Meta CAPI] Error sending event", sanitizeEventData(eventData), error);
    return { success: false, platform: "meta", error };
  }
}

export async function sendTikTokServerEvent(eventName: string, eventData: ServerEventData) {
  const eventNameMap: Record<string, string> = {
    ViewContent: "ViewContent",
    AddToCart: "AddToCart",
    Purchase: "PlaceAnOrder",
    InitiateCheckout: "InitiateCheckout",
  };

  const mappedEventName = eventNameMap[eventName] || eventName;
  if (!MARKETING_CONFIG.TIKTOK_PIXEL_ID || !MARKETING_CONFIG.TIKTOK_EVENTS_API_TOKEN) {
    if (isDev()) console.log("[TikTok] Disabled or missing token", mappedEventName, sanitizeEventData(eventData));
    return { success: false, platform: "tiktok", reason: "disabled" };
  }

  const payload = buildTikTokPayload(mappedEventName, eventData);
  const url = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

  if (isDev) {
    console.log("[TikTok] Dry run", url, payload);
    return { success: true, platform: "tiktok", status: 0, payload };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": MARKETING_CONFIG.TIKTOK_EVENTS_API_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: response.ok, platform: "tiktok", status: response.status, response: data, payload };
  } catch (error) {
    console.error("[TikTok] Error sending event", sanitizeEventData(eventData), error);
    return { success: false, platform: "tiktok", error };
  }
}

export async function sendSnapServerEvent(eventName: string, eventData: ServerEventData) {
  const eventNameMap: Record<string, string> = {
    ViewContent: "VIEW_CONTENT",
    AddToCart: "ADD_CART",
    Purchase: "PURCHASE",
    InitiateCheckout: "START_CHECKOUT",
  };

  const mappedEventName = eventNameMap[eventName] || eventName;
  if (!MARKETING_CONFIG.SNAP_PIXEL_ID || !MARKETING_CONFIG.SNAP_CONVERSIONS_API_TOKEN) {
    if (isDev()) console.log("[Snapchat] Disabled or missing token", mappedEventName, sanitizeEventData(eventData));
    return { success: false, platform: "snap", reason: "disabled" };
  }

  const payload = buildSnapPayload(mappedEventName, eventData);
  const url = "https://tr.snapchat.com/v2/conversion";

  if (isDev) {
    console.log("[Snapchat] Dry run", url, payload);
    return { success: true, platform: "snap", status: 0, payload };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MARKETING_CONFIG.SNAP_CONVERSIONS_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: response.ok, platform: "snap", status: response.status, response: data, payload };
  } catch (error) {
    console.error("[Snapchat] Error sending event", sanitizeEventData(eventData), error);
    return { success: false, platform: "snap", error };
  }
}

export async function sendPinterestServerEvent(eventName: string, eventData: ServerEventData) {
  const eventNameMap: Record<string, string> = {
    ViewContent: "page_visit",
    AddToCart: "add_to_cart",
    Purchase: "checkout",
    InitiateCheckout: "checkout",
  };

  const mappedEventName = eventNameMap[eventName] || eventName;
  if (!MARKETING_CONFIG.PINTEREST_AD_ACCOUNT_ID || !MARKETING_CONFIG.PINTEREST_ACCESS_TOKEN) {
    if (isDev()) console.log("[Pinterest] Disabled or missing token", mappedEventName, sanitizeEventData(eventData));
    return { success: false, platform: "pinterest", reason: "disabled" };
  }

  const payload = buildPinterestPayload(mappedEventName, eventData);
  const url = `https://api.pinterest.com/v5/ad_accounts/${MARKETING_CONFIG.PINTEREST_AD_ACCOUNT_ID}/events`;

  if (isDev) {
    console.log("[Pinterest] Dry run", url, payload);
    return { success: true, platform: "pinterest", status: 0, payload };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MARKETING_CONFIG.PINTEREST_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: response.ok, platform: "pinterest", status: response.status, response: data, payload };
  } catch (error) {
    console.error("[Pinterest] Error sending event", sanitizeEventData(eventData), error);
    return { success: false, platform: "pinterest", error };
  }
}

export async function sendServerEvent(eventName: string, eventData: ServerEventData) {
  const eventId = eventData.eventId ?? crypto.randomUUID();
  const data = { ...eventData, eventId };

  if (isDev) {
    console.log("[Server Events] Sending", eventName, sanitizeEventData(data));
  }

  const results = await Promise.allSettled([
    sendMetaServerEvent(eventName, data),
    sendTikTokServerEvent(eventName, data),
    sendSnapServerEvent(eventName, data),
    sendPinterestServerEvent(eventName, data),
  ]);

  return {
    success: results.every((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value?.success !== false),
    eventId,
    results: results.map((result) => {
      if (result.status === "fulfilled") {
        return (result as PromiseFulfilledResult<any>).value;
      }
      return { platform: "unknown", success: false, error: result.reason };
    }),
  } as ServerEventResponse;
}
