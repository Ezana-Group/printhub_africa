import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  return NextResponse.json({
    ga4MeasurementId: settings.ga4MeasurementId || "",
    hotjarSiteId: settings.hotjarSiteId || "",
    searchConsoleVerification: settings.searchConsoleVerification || "",
    algoliaEnabled: settings.algoliaEnabled ?? false,
    sentryDsn: settings.sentryDsn || "",
    storageBucket: settings.storageBucket || "",
    storagePublicBucket: settings.storagePublicBucket || "",
    storageCdnUrl: settings.storageCdnUrl || "",
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      ga4MeasurementId,
      hotjarSiteId,
      searchConsoleVerification,
      algoliaEnabled,
      sentryDsn,
      storageBucket,
      storagePublicBucket,
      storageCdnUrl,
    } = body;

    const updated = await prisma.businessSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ga4MeasurementId,
        hotjarSiteId,
        searchConsoleVerification,
        algoliaEnabled: algoliaEnabled === true || algoliaEnabled === "true",
        sentryDsn,
        storageBucket,
        storagePublicBucket,
        storageCdnUrl,
      },
      update: {
        ga4MeasurementId,
        hotjarSiteId,
        searchConsoleVerification,
        algoliaEnabled: algoliaEnabled === true || algoliaEnabled === "true",
        sentryDsn,
        storageBucket,
        storagePublicBucket,
        storageCdnUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
