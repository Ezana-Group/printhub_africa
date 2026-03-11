import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getBusinessPublic } from "@/lib/business-public";

const bodySchema = z.object({
  type: z.enum(["large_format", "3d_print"]),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  responseMethod: z.enum(["email", "whatsapp", "phone"]).optional(),
  message: z.string().max(3000).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  material: z.string().max(100).optional(),
  quantity: z.number().int().min(1).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (session?.user?.id) {
      await prisma.printQuote.create({
        data: {
          userId: session.user.id,
          material: data.material ?? undefined,
          quantity: data.quantity ?? 1,
          dimensions: data.width != null && data.height != null ? { width: data.width, height: data.height } : undefined,
          area: data.width != null && data.height != null ? (data.width * data.height) / 10000 : undefined,
          status: "DRAFT",
        },
      });
    }

    const business = await getBusinessPublic();
    const to = process.env.CONTACT_EMAIL ?? process.env.FROM_EMAIL ?? business.primaryEmail ?? "hello@printhub.africa";
    const footer = [business.businessName, business.city, business.country].filter(Boolean).join(" · ") || "PrintHub · Kenya";
    const typeLabel = data.type === "large_format" ? "Large Format Quote" : "3D Print Quote";
    await sendEmail({
      to: to.includes("@") ? to : business.primaryEmail ?? "hello@printhub.africa",
      subject: `[Quote Request] ${typeLabel} – ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2 style="color: #FF4D00;">${business.businessName} – Quote request</h2>
          <p><strong>Type:</strong> ${typeLabel}</p>
          <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
          <p><strong>Preferred response:</strong> ${data.responseMethod ?? "email"}</p>
          ${data.width != null ? `<p><strong>Width × Height (cm):</strong> ${data.width} × ${data.height ?? "—"}</p>` : ""}
          ${data.material ? `<p><strong>Material:</strong> ${data.material}</p>` : ""}
          ${data.quantity ? `<p><strong>Quantity:</strong> ${data.quantity}</p>` : ""}
          ${data.message ? `<p><strong>Message:</strong><br/>${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""}
          <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Quote request error:", e);
    return NextResponse.json({ error: "Failed to submit quote request" }, { status: 500 });
  }
}
