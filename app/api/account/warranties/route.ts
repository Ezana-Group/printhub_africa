import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/account/warranties
 * Fetch warranty records for the authenticated user.
 * Optional serialNumber query param for specific lookup.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const serialNumber = searchParams.get("serialNumber");

  // MED-5: Rate limiting to prevent serial number enumeration
  const ip = getRateLimitClientIp(req) || userId;
  const rl = await rateLimit(`warranty-lookup:${ip}`, { limit: 10, windowMs: 3600000 }); // 10 per hour
  if (!rl.success) {
    return NextResponse.json({ 
      error: "Too many lookup attempts. Please try again later.",
      resetAt: rl.resetAt 
    }, { status: 429 });
  }

  try {
    if (serialNumber) {
      // Specific lookup - MUST scope to current user
      const warranty = await prisma.warrantyRecord.findFirst({
        where: { 
          serialNumber,
          customerId: userId 
        },
        include: {
          HardwareProduct: {
            select: {
              name: true,
              model: true,
            }
          }
        }
      });

      if (!warranty) {
        // Log potential enumeration attempt if serialNumber is provided but not found for user
        await createAuditLog({
          userId,
          action: "WARRANTY_LOOKUP_NOT_FOUND",
          entity: "WarrantyRecord",
          after: { serialNumber, ip },
        });
        // Return generic 404 even if it exists for another user to prevent enumeration
        return NextResponse.json({ error: "Warranty record not found" }, { status: 404 });
      }

      return NextResponse.json(warranty);
    }

    // List all warranties for user
    const warranties = await prisma.warrantyRecord.findMany({
      where: { 
        customerId: userId 
      },
      include: {
        HardwareProduct: {
          select: {
            name: true,
            model: true,
          }
        }
      },
      orderBy: { purchaseDate: "desc" }
    });

    return NextResponse.json(warranties);
  } catch (error) {
    console.error("[GET /api/account/warranties]", error);
    return NextResponse.json({ error: "An error occurred while fetching warranty records" }, { status: 500 });
  }
}
