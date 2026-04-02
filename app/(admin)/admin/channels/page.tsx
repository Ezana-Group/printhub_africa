import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { MARKETING_CONFIG } from "@/config/marketing-channels";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { ChannelsDashboard } from "@/components/admin/marketing/ChannelsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminChannelsPage() {
  await requireAdminSection("/admin/marketing");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";

  const channels = [
    {
      name: "Meta (Facebook/Instagram)",
      enabled: MARKETING_CONFIG.META_PIXEL_ENABLED,
      pixelId: MARKETING_CONFIG.META_PIXEL_ID,
      capi: MARKETING_CONFIG.META_CONVERSIONS_API_ENABLED,
      feedUrl: `${baseUrl}/api/products/feed`,
    },
    {
      name: "Google Ads & Shopping",
      enabled: MARKETING_CONFIG.GTM_ENABLED,
      pixelId: MARKETING_CONFIG.GTM_ID,
      capi: false,
      feedUrl: `${baseUrl}/api/products/google`,
    },
    {
      name: "TikTok Shop",
      enabled: MARKETING_CONFIG.TIKTOK_PIXEL_ENABLED,
      pixelId: MARKETING_CONFIG.TIKTOK_PIXEL_ID,
      capi: !!MARKETING_CONFIG.TIKTOK_EVENTS_API_TOKEN,
      feedUrl: `${baseUrl}/api/products/tiktok`,
    },
    {
      name: "Pinterest Ads",
      enabled: MARKETING_CONFIG.PINTEREST_TAG_ENABLED,
      pixelId: MARKETING_CONFIG.PINTEREST_TAG_ID,
      capi: false,
      feedUrl: `${baseUrl}/api/products/pinterest`,
    },
    {
      name: "X (Twitter) Ads",
      enabled: MARKETING_CONFIG.X_PIXEL_ENABLED,
      pixelId: MARKETING_CONFIG.X_PIXEL_ID,
      capi: false,
    },
    {
      name: "Snapchat Ads",
      enabled: MARKETING_CONFIG.SNAP_PIXEL_ENABLED,
      pixelId: MARKETING_CONFIG.SNAP_PIXEL_ID,
      capi: !!MARKETING_CONFIG.SNAP_CONVERSIONS_API_TOKEN,
    },
  ];

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 space-y-6">
      <AdminBreadcrumbs items={[{ label: "Marketing", href: "/admin/marketing" }, { label: "Channels" }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Advertising Channels</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your sales and advertising integrations.
          </p>
        </div>
      </div>

      <ChannelsDashboard channels={channels} baseUrl={baseUrl} config={MARKETING_CONFIG} />

      <div className="pt-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Marketing Automations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Klaviyo</CardTitle>
                {MARKETING_CONFIG.KLAVIYO_ENABLED ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Offline</Badge>
                )}
              </div>
              <CardDescription>Email & SMS automation (via Africa's Talking).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Abandoned Cart Flow (1h)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Post-Purchase Automation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Back-in-Stock Alerts (Email/SMS)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">WhatsApp Business</CardTitle>
                {MARKETING_CONFIG.WHATSAPP_ENABLED ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Offline</Badge>
                )}
              </div>
              <CardDescription>Order updates via WhatsApp Cloud API.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Automated Confirmations</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Shipping Updates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Restock Notifications (WA)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
