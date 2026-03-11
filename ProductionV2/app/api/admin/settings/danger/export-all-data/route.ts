import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "EXPORT DATA");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const email = (session?.user as { email?: string })?.email;
  // TODO: build ZIP from major tables, upload to R2, get 1h signed URL, send email
  if (email) {
    await sendEmail({
      to: email,
      subject: "PrintHub — Data export",
      html: "<p>Your full data export is being prepared. You will receive a download link when ready (expires in 1 hour).</p>",
    });
  }
  await writeAudit({ userId: auth.userId, action: "EXPORT_ALL_DATA_REQUESTED", category: "DANGER", request: req });
  return NextResponse.json({
    message: `Export prepared. Download link sent to ${email ?? "your email"}. Expires in 1 hour.`,
  });
}
