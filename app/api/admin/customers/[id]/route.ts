import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

/** GET: Fetch customer by id with corporate account (for admin order form preselection). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      primaryCorporateAccount: {
        select: {
          id: true,
          accountNumber: true,
          companyName: true,
          tradingName: true,
          tier: true,
          status: true,
          discountPercent: true,
          creditLimit: true,
          creditUsed: true,
          paymentTerms: true,
          kraPin: true,
          industry: true,
        },
      },
      corporateTeamMemberships: {
        where: { isActive: true },
        include: {
          corporate: {
            select: {
              id: true,
              accountNumber: true,
              companyName: true,
              tradingName: true,
              tier: true,
              status: true,
              discountPercent: true,
              creditLimit: true,
              creditUsed: true,
              paymentTerms: true,
              kraPin: true,
              industry: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const corporateAccount =
    user.primaryCorporateAccount ??
    user.corporateTeamMemberships[0]?.corporate ??
    null;
  const corporateRole = user.corporateTeamMemberships[0]?.role ?? null;

  return NextResponse.json({
    customer: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      corporateAccount: corporateAccount
        ? {
            ...corporateAccount,
            paymentTerms: corporateAccount.paymentTerms,
          }
        : null,
      corporateRole,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).nullable().optional(),
});

/** PATCH: Update customer profile (name, email, phone). ADMIN/SUPER_ADMIN only. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
  });
  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.email !== undefined && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.email != null && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    console.error("Customer profile PATCH error:", e);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
