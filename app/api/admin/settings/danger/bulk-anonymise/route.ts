import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";
import { subDays } from "date-fns";

/** POST: Anonymize all customers inactive for more than X days. */
export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const { days = 730, dryRun = false } = await req.json().catch(() => ({}));
    
    try {
      await validateDanger(req, "ANONYMISE INACTIVE CUSTOMERS");
    } catch (e: any) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
    }

    const cutOffDate = subDays(new Date(), days);

    // Find users who haven't logged in OR had an order since cutOffDate
    // And are NOT already anonymised
    const inactiveUsers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        isAnonymised: { not: true },
        OR: [
          { lastLogin: { lt: cutOffDate } },
          { 
            AND: [
              { lastLogin: null },
              { createdAt: { lt: cutOffDate } }
            ]
          }
        ],
        orders: {
          none: {
            createdAt: { gte: cutOffDate }
          }
        }
      },
      select: { id: true }
    });

    if (dryRun) {
      return NextResponse.json({ 
        success: true, 
        dryRun: true, 
        count: inactiveUsers.length,
        message: `Found ${inactiveUsers.length} inactive customers to anonymise.`
      });
    }

    const userIds = inactiveUsers.map(u => u.id);
    
    // Perform bulk update
    const result = await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          name: "Anonymised Customer",
          email: "anonymised@printhub-internal.com", // More generic for bulk
          phone: null,
          passwordHash: null,
          isAnonymised: true,
          anonymisedAt: new Date(),
          dateOfBirth: null,
          stripeCustomerId: null,
          totpSecret: null,
        }
      }),
      // Also clear addresses for these users
      prisma.address.deleteMany({
        where: { userId: { in: userIds } }
      })
    ]);

    await writeAudit({
      userId: auth.userId,
      action: "BULK_ANONYMISE_CUSTOMERS",
      category: "DANGER",
      details: `Anonymised ${userIds.length} users inactive for ${days} days.`,
      request: req,
    });

    return NextResponse.json({ 
      success: true, 
      count: userIds.length,
      message: `Successfully anonymised ${userIds.length} inactive customers.`
    });

  } catch (error: any) {
    console.error("Bulk anonymise failed:", error);
    return NextResponse.json({ error: "Failed to perform bulk anonymization" }, { status: 500 });
  }
}
