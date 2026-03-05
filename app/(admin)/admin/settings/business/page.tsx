import { requireAdminSettings } from "@/lib/auth-guard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsBusinessClient } from "@/components/admin/settings-business-client";

function toStrMap(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? v : String(v ?? "");
  }
  return out;
}

export default async function AdminSettingsBusinessPage() {
  await requireAdminSettings();
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "STAFF";
  const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";

  const row = await prisma.pricingConfig.findUnique({
    where: { key: "adminSettings:business" },
  });
  let saved: Record<string, string> = {};
  if (row?.valueJson) {
    try {
      saved = toStrMap(JSON.parse(row.valueJson) as Record<string, unknown>);
    } catch (err) {
      console.error("Business settings JSON parse error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Business Profile</h1>
      <SettingsBusinessClient initialData={saved} canEdit={canEdit} />
    </div>
  );
}
