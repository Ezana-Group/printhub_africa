import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";

/**
 * PATCH /api/admin/content/broadcasts/[id]
 * Endpoint to approve or reject a marketing broadcast.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { status } = await request.json();

  if (!["APPROVED", "REJECTED", "SENT"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const broadcast = await prisma.marketingBroadcast.update({
      where: { id },
      data: { status },
    });

    // If APPROVED, we could trigger the Actual Send logic here
    // For now, we just update the status.
    
    return NextResponse.json({ success: true, broadcast });
  } catch (error) {
    console.error("[Broadcasts Patch API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
