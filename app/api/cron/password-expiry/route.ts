import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getBusinessPublic } from "@/lib/business-public";

export async function GET(req: Request) {
  // Simple secret check for cron
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { passwordPolicy: true },
  });

  const policy = settings?.passwordPolicy as any;
  const expiry = policy?.passwordExpiry;

  if (!expiry || expiry === "Never") {
    return NextResponse.json({ message: "Password expiry not enabled." });
  }

  let days = 90;
  if (expiry === "30 days") days = 30;
  else if (expiry === "180 days") days = 180;
  else if (expiry === "1 year") days = 365;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Find users whose password is older than the cutoff and not already flagged as expired
  const expiredUsers = await prisma.user.findMany({
    where: {
      passwordHash: { not: null },
      passwordExpired: false,
      OR: [
        { passwordChangedAt: { lt: cutoff } },
        { passwordChangedAt: null, createdAt: { lt: cutoff } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  if (expiredUsers.length === 0) {
    return NextResponse.json({ message: "No expired passwords found." });
  }

  const b = await getBusinessPublic();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";

  for (const user of expiredUsers) {
    // Flag user
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordExpired: true },
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Action Required: Your password has expired",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #CC3D00;">${b.businessName}</h1>
          <p>Hi ${user.name || "there"},</p>
          <p>For security reasons, we require users to change their passwords every ${expiry}. Your password has now expired.</p>
          <p>Please click the link below to reset your password and regain access to your account:</p>
          <p><a href="${baseUrl}/forgot-password" style="color: #CC3D00; font-weight: bold;">Reset my password</a></p>
          <p>If you have any questions, please contact our support team.</p>
          <p style="color: #6B6B6B; font-size: 12px;">${b.businessName} · Nairobi, Kenya</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ message: `Processed ${expiredUsers.length} expired accounts.` });
}
