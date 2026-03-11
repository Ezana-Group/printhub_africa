import { requireAdminSettings } from "@/lib/auth-guard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsBusinessClient } from "@/components/admin/settings-business-client";

function toStrMap(row: Record<string, unknown> | null): Record<string, string> {
  if (!row || typeof row !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "updatedAt" || k === "id") continue;
    out[k] = typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
  }
  return out;
}

export default async function AdminSettingsBusinessPage() {
  await requireAdminSettings();
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "STAFF";
  const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";

  const row = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });
  const saved = toStrMap(row as unknown as Record<string, unknown>);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Business Profile</h1>
      <SettingsBusinessClient initialData={saved} canEdit={canEdit} />
    </div>
  );
}
