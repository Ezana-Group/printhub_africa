import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Monthly Cron: Resets the 'soldThisMonth' counter for all products.
 * Should be called by a scheduler (e.g. Vercel Cron) on the 1st of every month.
 * curl -X POST https://.../api/cron/reset-sold-this-month -H "Authorization: Bearer CRON_SECRET"
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prisma.product as any).updateMany({
      data: {
        soldThisMonth: 0,
      },
    });

    return NextResponse.json({
      message: "Monthly sales counter reset successful",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Cron reset-sold-this-month failed:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
