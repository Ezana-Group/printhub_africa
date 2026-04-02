import { MARKETING_CONFIG } from "@/config/marketing-channels";
import { prisma } from "@/lib/prisma";

/**
 * Server-side Conversions API (CAPI)
 * Improves tracking accuracy for Meta and TikTok by sending events from the backend.
 * Bypasses iOS privacy restrictions and ad blockers.
 */

export async function sendMetaConversionsEvent({
  eventName,
  eventTime = Math.floor(Date.now() / 1000),
  eventSourceUrl,
  eventId,
  userData = {},
  customData = {},
}: {
  eventName: string;
  eventTime?: number;
  eventSourceUrl?: string;
  eventId?: string;
  userData?: Record<string, any>;
  customData?: Record<string, any>;
}) {
  if (!MARKETING_CONFIG.META_CONVERSIONS_API_ENABLED || !MARKETING_CONFIG.META_ACCESS_TOKEN) {
    return { success: false, reason: "CAPI disabled or no token" };
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: userData.ip,
          client_user_agent: userData.userAgent,
          em: userData.email ? hashData(userData.email) : undefined,
          ph: userData.phone ? hashData(userData.phone) : undefined,
          fn: userData.firstName ? hashData(userData.firstName) : undefined,
          ln: userData.lastName ? hashData(userData.lastName) : undefined,
          fbc: userData.fbc,
          fbp: userData.fbp,
        },
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${MARKETING_CONFIG.META_PIXEL_ID}/events?access_token=${MARKETING_CONFIG.META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error("[CAPI] Meta Error:", error);
    return { success: false, error };
  }
}

export async function sendTikTokEventsApi({
  event,
  eventTime = Math.floor(Date.now() / 1000),
  eventId,
  userData = {},
  customData = {},
}: {
  event: string;
  eventTime?: number;
  eventId?: string;
  userData?: Record<string, any>;
  customData?: Record<string, any>;
}) {
  if (!MARKETING_CONFIG.TIKTOK_EVENTS_API_TOKEN || !MARKETING_CONFIG.TIKTOK_PIXEL_ID) {
    return { success: false, reason: "TikTok Events API disabled or no token" };
  }

  const payload = {
    event_source: "web",
    event_source_id: MARKETING_CONFIG.TIKTOK_PIXEL_ID,
    data: [
      {
        event: event,
        event_time: eventTime,
        event_id: eventId,
        user: {
          ip: userData.ip,
          ua: userData.userAgent,
          email: userData.email ? hashData(userData.email) : undefined,
          phone: userData.phone ? hashData(userData.phone) : undefined,
        },
        properties: customData,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/event/track/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": MARKETING_CONFIG.TIKTOK_EVENTS_API_TOKEN,
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error("[TikTok API] Error:", error);
    return { success: false, error };
  }
}

export async function sendSnapConversionsEvent({
  event,
  eventTime = Date.now(),
  eventId,
  userData = {},
  customData = {},
}: {
  event: string;
  eventTime?: number;
  eventId?: string;
  userData?: Record<string, any>;
  customData?: Record<string, any>;
}) {
  if (!MARKETING_CONFIG.SNAP_CONVERSIONS_API_TOKEN || !MARKETING_CONFIG.SNAP_PIXEL_ID) {
    return { success: false, reason: "Snap CAPI disabled or no token" };
  }

  const payload = {
    pixel_id: MARKETING_CONFIG.SNAP_PIXEL_ID,
    description: "PrintHub Africa CAPI",
    data: [
      {
        event_type: event,
        event_time: eventTime,
        client_deduplication_id: eventId,
        hashed_email: userData.email ? hashData(userData.email) : undefined,
        hashed_phone_number: userData.phone ? hashData(userData.phone) : undefined,
        hashed_ip_address: userData.ip ? hashData(userData.ip) : undefined,
        user_agent: userData.userAgent,
        ...customData,
      },
    ],
  };

  try {
    const res = await fetch("https://tr.snapchat.com/v2/conversion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MARKETING_CONFIG.SNAP_CONVERSIONS_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error("[Snap CAPI] Error:", error);
    return { success: false, error };
  }
}

/** Helper for hashing user data (SHA-256) as required by APIs. */
function hashData(data: string): string {
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(data.trim().toLowerCase())
    .digest("hex");
}
