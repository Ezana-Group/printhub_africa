import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getBusinessPublic } from "@/lib/business-public";

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().max(30).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export async function POST(req: NextRequest) {
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
    const to = process.env.CONTACT_EMAIL ?? process.env.FROM_EMAIL ?? business.primaryEmail ?? "hello@printhub.africa";
    const footer = [business.businessName, business.city, business.country].filter(Boolean).join(" · ") || "PrintHub · Kenya";
    await sendEmail({
      to: to.includes("@") ? to : business.primaryEmail ?? "hello@printhub.africa",
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2 style="color: #FF4D00;">${business.businessName} – Contact form</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
        </div>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Contact form error:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
