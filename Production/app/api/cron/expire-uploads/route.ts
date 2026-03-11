import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;
const UPLOADING_EXPIRY_HOURS = 2;

/**
 * Mark UploadedFile records stuck in UPLOADING for > 2 hours as EXPIRED.
 * Call from Vercel Cron or external cron with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - UPLOADING_EXPIRY_HOURS * 60 * 60 * 1000);
  const result = await prisma.uploadedFile.updateMany({
    where: {
      status: "UPLOADING",
      createdAt: { lt: cutoff },
    },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ expired: result.count });
}
