import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSMS } from "@/lib/africas-talking";

/** POST: Send a test SMS. Body: { to?: string } — phone number (defaults to current user's phone if set). Uses env AT_API_KEY / AT_USERNAME. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { to?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    // ignore
  }
  const userPhone = (session.user as { phone?: string })?.phone;
  const to = body.to?.trim() || userPhone;
  if (!to) {
    return NextResponse.json(
      { error: "No phone number. Add your phone in My Account or pass { \"to\": \"+254...\" } in the request body." },
      { status: 400 }
    );
  }
  const ok = await sendSMS(to, "PrintHub test SMS. Notifications are configured.");
  if (!ok) {
    return NextResponse.json({ error: "Failed to send test SMS (check AT_API_KEY / AT_USERNAME)" }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: "Test SMS sent to " + to });
}
