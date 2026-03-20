import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Weekly Licence Monitor Cron
 * Checks all active products linked to external models.
 * If a model's source no longer exists or licence changed (theoretical), it flags it.
 * Realistically, it would re-parse the source URL.
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeImports = await prisma.externalModel.findMany({
      where: {
        status: "APPROVED",
        sourceUrl: { not: "" },
      },
      include: {
        product: true
      }
    });

    const results = {
      checked: activeImports.length,
      flagged: 0,
      errors: 0,
    };

    // Process in batches to avoid timeout
    for (const model of activeImports) {
      try {
        const res = await fetch(model.sourceUrl, {
          method: "HEAD",
          headers: { "User-Agent": "PrintHubBot/1.0" }
        });

        if (res.status === 404) {
          // Model URL is dead
          results.flagged++;
          await prisma.importLog.create({
            data: {
              platform: model.platform,
              trigger: "cron_monitor",
              sourceUrl: model.sourceUrl,
              status: "warning",
              searchTerm: `URL DEAD: ${model.name}`,
            }
          });
        }
      } catch (e) {
        results.errors++;
      }
      
      // Sleep slightly between checks
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
