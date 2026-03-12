import { requireAdminSettings } from "@/lib/auth-guard";
import { OrderNumberPrefixesSection } from "@/components/settings/order-number-prefixes-section";
import { SkuPrefixesSection } from "@/components/settings/sku-prefixes-section";
import { SystemSettingsForm } from "@/components/admin/settings/system-settings-form";

export default async function AdminSettingsSystemPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">System</h1>
      <OrderNumberPrefixesSection />
      <SkuPrefixesSection />
      <SystemSettingsForm />
    </div>
  );
}
