import { requireAdminSettings } from "@/lib/auth-guard";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { SiteImagesClient } from "./site-images-client";
import { prisma } from "@/lib/prisma";
import {
  SITE_IMAGE_SLOT_KEYS,
  SITE_IMAGE_DEFAULTS,
  SITE_IMAGE_SLOT_META,
} from "@/lib/site-images";

export default async function AdminContentSiteImagesPage() {
  await requireAdminSettings();

  const slots = await prisma.siteImageSlot.findMany({
    where: { key: { in: [...SITE_IMAGE_SLOT_KEYS] } },
    select: { key: true, label: true, description: true, imagePath: true, alt: true, updatedAt: true },
  });
  const byKey = Object.fromEntries(slots.map((s) => [s.key, s]));

  const initialSlots = SITE_IMAGE_SLOT_KEYS.map((key) => {
    const meta = SITE_IMAGE_SLOT_META[key];
    const row = byKey[key];
    const imagePath = row?.imagePath?.trim() || SITE_IMAGE_DEFAULTS[key];
    return {
      key,
      tab: meta.tab,
      group: meta.group ?? null,
      label: row?.label ?? meta.label,
      description: row?.description ?? meta.description,
      imagePath,
      defaultPath: SITE_IMAGE_DEFAULTS[key],
      isOverridden: !!row?.imagePath?.trim(),
      alt: row?.alt ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Site Images" },
        ]}
      />
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Site Images</h1>
        <p className="text-slate-600 text-sm mt-1">
          Upload or change images used on the Services page, About page, and homepage. Each slot shows where the image appears.
        </p>
      </div>
      <SiteImagesClient initialSlots={initialSlots} />
    </div>
  );
}
