import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUrlImport } from "@/lib/import-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get a batch of approved models to check
    const modelsToCheck = await prisma.externalModel.findMany({
      where: {
        status: "APPROVED"
      },
      take: 10
    });

    const results = {
      checked: 0,
      updated: 0,
      errors: 0
    };

    for (const model of modelsToCheck) {
      results.checked++;
      
      try {
        if (model.platform === "THINGIVERSE") {
          // Use sourceUrl from the model
          const extracted = await parseUrlImport(model.sourceUrl);
          
          if (!("error" in extracted)) {
            if (extracted.licenceType !== model.licenceType) {
              await prisma.externalModel.update({
                where: { id: model.id },
                data: {
                  licenceType: extracted.licenceType,
                }
              });
              results.updated++;
              
              // Log the change using the correct ImportLog schema
              await prisma.importLog.create({
                data: {
                  platform: model.platform,
                  trigger: "api_sync",
                  status: "success",
                  searchTerm: `License updated for ${model.name}`,
                  sourceUrl: model.sourceUrl,
                  triggeredBy: "system_cron"
                }
              });
            }
          }
        }
      } catch {
        results.errors++;
      }
      
      // Sleep slightly between checks
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
