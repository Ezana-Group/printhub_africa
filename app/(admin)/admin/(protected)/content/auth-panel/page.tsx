export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AuthPanelClient } from "./auth-panel-client";
import { prisma } from "@/lib/prisma";
import { getAuthPanelForPublic } from "@/lib/auth-panel";

export default async function AdminContentAuthPanelPage() {
  await requireAdminSettings();

  const panel = await getAuthPanelForPublic(prisma);
  const configRow = await prisma.authPanelConfig.findUnique({
    where: { id: "default" },
  });
  const slides = await prisma.authPanelSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const initialConfig = {
    backgroundColor: configRow?.backgroundColor?.trim() || panel.backgroundColor,
    backgroundImagePath: configRow?.backgroundImagePath?.trim() || null,
    carouselIntervalSeconds: configRow?.carouselIntervalSeconds ?? panel.carouselIntervalSeconds,
    updatedAt: configRow?.updatedAt?.toISOString() ?? null,
  };

  const initialSlides = slides.map((s) => ({
    id: s.id,
    sortOrder: s.sortOrder,
    subtitle: s.subtitle,
    headline: s.headline,
    body: s.body,
    imagePath: s.imagePath,
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Login panel" },
        ]}
      />
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Login &amp; Register panel
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Edit the left panel on the login and register pages: background, and rotating slides (subtitle, headline, body, optional image). Set auto-advance to 0 to show one slide only.
        </p>
      </div>
      <AuthPanelClient initialConfig={initialConfig} initialSlides={initialSlides} />
    </div>
  );
}
