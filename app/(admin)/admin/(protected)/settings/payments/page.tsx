export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { PaymentsSettingsForm } from "@/components/admin/settings/payments-settings-form";

export default async function AdminSettingsPaymentsPage() {
  await requireAdminSettings();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold italic">Payments & Checkout</h1>
        <p className="text-sm text-muted-foreground italic">
          Manage your M-Pesa, PesaPal, and checkout configuration.
        </p>
      </div>
      <PaymentsSettingsForm />
    </div>
  );
}
