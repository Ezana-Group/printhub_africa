import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    await validateDanger(req, "DELETE EVERYTHING", true);
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }

  const executeAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {
      pendingFactoryReset: true,
      factoryResetExecuteAt: executeAt,
      factoryResetInitiatedBy: auth.userId,
    },
    create: {
      id: "default",
      pendingFactoryReset: true,
      factoryResetExecuteAt: executeAt,
      factoryResetInitiatedBy: auth.userId,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true },
  });

  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "⚠ FACTORY RESET SCHEDULED — PrintHub",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; border: 2px solid #FF0000; padding: 20px;">
          <h2 style="color: #FF0000;">⚠ CRITICAL ACTION SCHEDULED</h2>
          <p>A <strong>Factory Reset</strong> has been scheduled for <strong>${executeAt.toLocaleString("en-KE")}</strong>.</p>
          <p>This action will result in the <strong>PERMANENT DELETION</strong> of all business data, including:</p>
          <ul>
            <li>All Orders and Quotes</li>
            <li>All Products and Categories</li>
            <li>All Customers and Addresses</li>
            <li>All Analytics and Feeds</li>
          </ul>
          <p>If you did not initiate this, or wish to stop it, you must cancel it immediately via the Admin Panel.</p>
          <p><strong>To cancel:</strong> Settings → Danger Zone → Cancel Reset</p>
        </div>
      `,
    });
  }

  await writeAudit({
    userId: auth.userId,
    action: "FACTORY_RESET_INITIATED",
    category: "DANGER",
    details: `Execute at: ${executeAt.toISOString()}`,
    request: req,
    after: { executeAt: executeAt.toISOString() },
  });

  return NextResponse.json({ success: true, executeAt: executeAt.toISOString() });
}
