import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  if (!email && !phone) {
    return NextResponse.json({ error: "Missing email or phone" }, { status: 400 });
  }

  try {
    const customer = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email } : {},
          phone ? { phone: phone } : {},
        ].filter((o) => Object.keys(o).length !== 0),
      },
      include: {
        orders: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                product: { select: { name: true } },
              },
            },
          },
        },
        quotes: {
          take: 2,
          orderBy: { createdAt: "desc" },
          select: {
            quoteNumber: true,
            status: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, found: false });
    }

    return NextResponse.json({
      success: true,
      found: true,
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      recentOrders: customer.orders.map((o: any) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        date: o.createdAt,
        items: o.items.map((oi: any) => oi.product?.name).join(", "),
      })),
      recentQuotes: customer.quotes.map((q: any) => ({
        number: q.quoteNumber,
        status: q.status,
      })),
    });
  } catch (err) {
    console.error("[get-customer-context]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
