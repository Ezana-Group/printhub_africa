import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { searchThingiverse, searchMyMiniFactory } from "@/lib/import-utils";
import { ImportPlatform } from "@prisma/client";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { platform, term, page = 1 } = await req.json();
    if (!platform || !term) {
      return NextResponse.json({ error: "PLATFORM_AND_TERM_REQUIRED" }, { status: 400 });
    }

    let results = [];
    if (platform === "THINGIVERSE") {
      results = await searchThingiverse(term, page);
    } else if (platform === "MYMINIFACTORY") {
      results = await searchMyMiniFactory(term, page);
    } else if (platform === "CGTRADER") {
      if (!process.env.CGTRADER_CLIENT_ID) {
        return NextResponse.json({ error: "CGTRADER_NOT_CONFIGURED" });
      }
      // CGTrader logic would go here if API were available
      return NextResponse.json({ error: "CGTRADER_API_NOT_IMPLEMENTED" });
    } else {
      return NextResponse.json({ error: "UNSUPPORTED_PLATFORM" }, { status: 400 });
    }

    // Check for duplicates in results
    const externalIds = results.map(r => r.externalId);
    const existing = await prisma.externalModel.findMany({
      where: {
        platform: platform as ImportPlatform,
        externalId: { in: externalIds }
      },
      select: { externalId: true }
    });
    const existingIds = new Set(existing.map(e => e.externalId));

    const finalResults = results.map(r => ({
      ...r,
      alreadyImported: existingIds.has(r.externalId)
    }));

    await prisma.importLog.create({
      data: {
        platform: platform as ImportPlatform,
        trigger: "api_search",
        searchTerm: term,
        resultCount: results.length,
        status: "success",
        triggeredBy: auth.session.user.id,
      }
    });

    return NextResponse.json({ results: finalResults });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error("API Search Import Error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", detail: err.message }, { status: 500 });
  }
}
