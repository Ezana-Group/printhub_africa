import { requireAdminSettings } from "@/lib/auth-guard";
import { SeoSettingsClient } from "./seo-settings-client";

export default async function AdminSettingsSeoPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">SEO Settings</h1>
      <SeoSettingsClient />
    </div>
  );
}
