import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getBusinessPublic } from "@/lib/business-public";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getNextTicketNumber } from "@/lib/next-invoice-number";

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().max(30).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

const CONTACT_LIMIT = 10;
const CONTACT_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getRateLimitClientIp(req) ?? "unknown";
  const limitResult = await rateLimit(`contact:${ip}`, { limit: CONTACT_LIMIT, windowMs: CONTACT_WINDOW_MS });
  if (!limitResult.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, email, phone, subject, message } = parsed.data;
    const business = await getBusinessPublic();
    const ticketNumber = await getNextTicketNumber();
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        guestName: name,
        guestEmail: email,
        guestPhone: phone ?? undefined,
        subject,
        status: "OPEN",
        priority: "MEDIUM",
        messages: {
          create: {
            senderType: "CUSTOMER",
            message,
            attachments: [],
          },
        },
      },
      select: { id: true, ticketNumber: true },
    });
    const to = process.env.CONTACT_EMAIL ?? process.env.FROM_EMAIL ?? business.primaryEmail ?? "hello@printhub.africa";
    const footer = [business.businessName, business.city, business.country].filter(Boolean).join(" · ") || "PrintHub · Kenya";
    await sendEmail({
      to: to.includes("@") ? to : business.primaryEmail ?? "hello@printhub.africa",
      subject: `[Contact #${ticketNumber}] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2 style="color: #CC3D00;">${business.businessName} – Contact form</h2>
          <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
        </div>
      `,
    });
    // --- AUTOMATION: Staff Alert ---
    void (async () => {
      try {
        const { n8n } = await import("@/lib/n8n");
        await n8n.staffAlert({
          type: 'SUPPORT_TICKET',
          title: `🎟️ New Support Ticket #${ticket.ticketNumber}`,
          message: `Subject: ${subject}\nFrom: ${name} (${email})\nPriority: MEDIUM`,
          urgency: 'medium',
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticket.id}`,
          targetRoles: ['STAFF', 'ADMIN']
        });
      } catch (err) {
        console.error("Failed to trigger n8n support alert:", err);
      }
    })();

    return NextResponse.json({ success: true, ticketNumber: ticket.ticketNumber });
  } catch (e) {
    console.error("Contact form error:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
