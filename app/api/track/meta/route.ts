import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/marketing/meta-capi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, params, eventId, url } = body;

    if (!eventName) {
      return NextResponse.json({ error: "Event name is required" }, { status:400 });
    }

    // Extract user data from headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip");
    const ua = req.headers.get("user-agent");

    // Get cookies for fbp/fbc (Facebook browser/click identifiers)
    const cookies = req.cookies;
    const fbp = cookies.get("_fbp")?.value;
    const fbc = cookies.get("_fbc")?.value;

    const result = await sendMetaCapiEvent({
      event_name: eventName,
      event_id: eventId,
      event_source_url: url || req.headers.get("referer") || undefined,
      user_data: {
        client_ip_address: ip || undefined,
        client_user_agent: ua || undefined,
        fbp,
        fbc,
      },
      custom_data: params,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[META_TRACK_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
