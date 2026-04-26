export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { IntegrationsClient } from "./integrations-client";

export default async function AdminSettingsIntegrationsPage() {
  const session = await requireAdminSettings();
  const role = (session.user as { role?: string }).role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  const tokens = await prisma.oAuthToken.findMany();
  
  const xeroToken = tokens.find(t => t.provider === "xero");
  const qbToken = tokens.find(t => t.provider === "quickbooks");
  const googleToken = tokens.find(t => t.provider === "google-business");

  const initialData = {
    ga4MeasurementId: settings?.ga4MeasurementId || "",
    hotjarSiteId: settings?.hotjarSiteId || "",
    searchConsoleVerification: settings?.searchConsoleVerification || "",
    algoliaEnabled: settings?.algoliaEnabled ?? false,
    sentryDsn: settings?.sentryDsn || "",
    storageBucket: settings?.storageBucket || "",
    storagePublicBucket: settings?.storagePublicBucket || "",
    storageCdnUrl: settings?.storageCdnUrl || "",
    xeroConnected: !!xeroToken,
    quickbooksConnected: !!qbToken,
    googleBusinessConnected: !!googleToken,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";
  const webhookUrl = `${appUrl}/api/webhooks`;

  // WhatsApp Express service URL — used to build the Meta webhook callback URL
  const whatsappServiceUrl = (process.env.WHATSAPP_SERVICE_URL ?? "").replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Integrations</h1>
      <IntegrationsClient
        initialData={initialData}
        webhookUrl={webhookUrl}
        isSuperAdmin={isSuperAdmin}
        whatsappServiceUrl={whatsappServiceUrl}
      />
    </div>
  );
}
