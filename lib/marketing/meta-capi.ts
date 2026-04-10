import { MARKETING_CONFIG } from "@/config/marketing-channels";

/**
 * Meta Conversions API (CAPI) Helper
 * Sends events directly from the server to Meta.
 * Requires META_ACCESS_TOKEN and NEXT_PUBLIC_META_PIXEL_ID.
 */

interface CapiEvent {
  event_name: string;
  event_time: number; // Unix timestamp in seconds
  action_source: "website";
  event_id?: string;
  event_source_url?: string;
  user_data: {
    client_ip_address?: string;
    client_user_agent?: string;
    em?: string[]; // Hashed emails
    ph?: string[]; // Hashed phone numbers
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    contents?: Array<{ id: string; quantity: number }>;
    num_items?: number;
    transaction_id?: string;
  };
  test_event_code?: string;
}

export async function sendMetaCapiEvent(event: Partial<CapiEvent> & { test_event_code?: string }) {
  if (!MARKETING_CONFIG.META_CONVERSIONS_API_ENABLED || !MARKETING_CONFIG.META_ACCESS_TOKEN) {
    // Silently skip if disabled or no token
    return { success: false, message: "CAPI disabled or token missing" };
  }

  const pixelId = MARKETING_CONFIG.META_PIXEL_ID;
  if (!pixelId) {
    return { success: false, message: "Pixel ID missing" };
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${MARKETING_CONFIG.META_ACCESS_TOKEN}`;

  const payload = {
    data: [
      {
        event_name: event.event_name,
        event_time: event.event_time || Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: event.event_id,
        event_source_url: event.event_source_url,
        user_data: event.user_data,
        custom_data: event.custom_data,
      },
    ],
    test_event_code: event.test_event_code,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return { 
      success: response.ok, 
      data: result,
      status: response.status 
    };
  } catch (error) {
    console.error("[META_CAPI_ERROR]", error);
    return { success: false, error };
  }
}
