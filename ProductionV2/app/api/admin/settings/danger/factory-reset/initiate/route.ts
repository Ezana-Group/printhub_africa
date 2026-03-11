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
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  const executeAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      pendingFactoryReset: true,
      factoryResetInitiatedBy: auth.userId,
      factoryResetExecuteAt: executeAt,
      updatedAt: new Date(),
    },
    create: {
      id: "default",
      pendingFactoryReset: true,
      factoryResetInitiatedBy: auth.userId,
      factoryResetExecuteAt: executeAt,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true, phone: true },
  });
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "⚠ FACTORY RESET SCHEDULED — PrintHub",
      html: `<p>A factory reset has been scheduled for ${executeAt.toLocaleString("en-KE")}.</p>
             <p>This will PERMANENTLY DELETE all orders, products, customers, and data.</p>
             <p><strong>To cancel:</strong> Log in and go to Settings → Danger Zone → Cancel Reset</p>`,
    });
  }
  await writeAudit({
    userId: auth.userId,
    action: "FACTORY_RESET_INITIATED",
    category: "DANGER",
    details: `Execute at: ${executeAt.toISOString()}`,
    request: req,
  });
  return NextResponse.json({ success: true, executeAt: executeAt.toISOString() });
}
