import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

/** POST: Send a test email to the current user (or to the email in the body). Uses env RESEND_API_KEY. */
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
  const to = body.to?.trim() || (session.user.email as string);
  if (!to) {
    return NextResponse.json({ error: "No email address to send to" }, { status: 400 });
  }
  try {
    await sendEmail({
      to,
      subject: "PrintHub — Test email",
      html: "<p>This is a test email from your PrintHub admin notification settings. If you received this, email is configured correctly.</p>",
    });
    return NextResponse.json({ success: true, message: "Test email sent to " + to });
  } catch (e) {
    console.error("Test email error:", e);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
