import { requireAdminSettings } from "@/lib/auth-guard";
import { SecuritySettingsClient } from "./security-settings-client";

export default async function AdminSettingsSecurityPage() {
  await requireAdminSettings();
  return <SecuritySettingsClient />;
}
