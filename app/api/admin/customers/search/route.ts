import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

/** GET: Search customers by name, email, or phone (for admin order form). */
export async function GET(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      primaryCorporateAccount: {
        select: {
          id: true,
          companyName: true,
          accountNumber: true,
          discountPercent: true,
          paymentTerms: true,
          creditLimit: true,
          creditUsed: true,
        },
      },
      corporateTeamMemberships: {
        where: { isActive: true },
        include: {
          corporate: {
            select: {
              id: true,
              companyName: true,
              accountNumber: true,
              discountPercent: true,
              paymentTerms: true,
              creditLimit: true,
              creditUsed: true,
            },
          },
        },
        take: 1,
      },
    },
    take: 10,
  });

  const customers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    corporateAccount:
      u.primaryCorporateAccount ?? u.corporateTeamMemberships[0]?.corporate ?? null,
  }));

  return NextResponse.json({ customers });
}
