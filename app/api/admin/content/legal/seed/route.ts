import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import type { LegalSlug } from "@/lib/legal";
import { getLegalContent } from "@/prisma/legal-content";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

const LEGAL_PAGES: { slug: LegalSlug; title: string }[] = [
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "terms-of-service", title: "Terms of Service" },
  { slug: "refund-policy", title: "Refund and Returns Policy" },
  { slug: "cookie-policy", title: "Cookie Policy" },
  { slug: "account-terms", title: "Account Registration Terms" },
  { slug: "corporate-terms", title: "Corporate Account Terms and Conditions" },
];

/**
 * POST /api/admin/content/legal/seed
 * Upserts all 6 legal pages from prisma/legal-content (same as db seed).
 * Use when Legal Pages table is empty or you want to reset content to seed.
 */
export async function POST() {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const results: { slug: string; title: string }[] = [];

  for (const { slug, title } of LEGAL_PAGES) {
    const content = getLegalContent(slug);
    await prisma.legalPage.upsert({
      where: { slug },
      update: {
        title: title,
        content,
        lastUpdated: new Date(),
      },
      create: {
        slug,
        title: title,
        content,
        lastUpdated: new Date(),
        isPublished: true,
        version: 1,
      },
    });
    results.push({ slug, title });
  }

  return NextResponse.json({ ok: true, seeded: results });
}
