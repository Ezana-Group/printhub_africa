import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const { userId, email, phone, sentiment, score, message, platform } = await req.json();

    if (!userId && !email && !phone) {
      return NextResponse.json({ error: "Missing customer identifier" }, { status: 400 });
    }

    let customerId = userId;
    if (!customerId) {
        const customer = await prisma.user.findFirst({
            where: {
                OR: [
                    email ? { email: email } : {},
                    phone ? { phone: phone } : {},
                ].filter((o) => Object.keys(o).length !== 0),
            },
            select: { id: true }
        });
        customerId = customer?.id;
    }

    // Existing AuditLog model supports category, action, and details (JSON)
    await (prisma.auditLog as any).create({
        data: {
          category: 'CUSTOMER',
          action: 'SENTIMENT_LOGGED',
          entity: 'User',
          entityId: customerId || 'UNKNOWN',
          details: {
            sentiment,
            score,
            message,
            platform,
            email,
            phone
          },
          severity: 'INFO',
          userId: customerId,
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-sentiment]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
