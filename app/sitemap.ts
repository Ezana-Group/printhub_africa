import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { getServiceFlags } from "@/lib/service-flags";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { largeFormatEnabled } = await getServiceFlags();
  const settings = await prisma.businessSettings.findUnique({ 
    where: { id: "default" },
    select: {
      sitemapIncludePages: true,
      sitemapIncludeProducts: true,
      sitemapIncludeCategories: true,
      canonicalDomain: true,
    }
  }).catch(() => null);

  const base = settings?.canonicalDomain || process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";
  const includePages = settings?.sitemapIncludePages ?? true;
  const includeProducts = settings?.sitemapIncludeProducts ?? true;
  const includeCategories = settings?.sitemapIncludeCategories ?? true;

  const PAGE_CONFIG: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "/shop", changeFrequency: "weekly", priority: 0.9 },
    { path: "/catalogue", changeFrequency: "weekly", priority: 0.9 },
    { path: "/services/3d-printing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/services/3d-scanning", changeFrequency: "monthly", priority: 0.8 },
    { path: "/materials", changeFrequency: "monthly", priority: 0.8 },
    { path: "/get-a-quote", changeFrequency: "monthly", priority: 0.8 },
    ...(largeFormatEnabled ? [{ path: "/services/large-format", changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
    { path: "/blog/what-is-3d-printing-kenya", changeFrequency: "monthly", priority: 0.6 },
    { path: "/blog/3d-printing-cost-kenya", changeFrequency: "monthly", priority: 0.6 },
    { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
    { path: "/track", changeFrequency: "monthly", priority: 0.4 },
  ];

  const staticPages = includePages
    ? PAGE_CONFIG.map(({ path, changeFrequency, priority }) => ({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      }))
    : [];

  const jobSlugs =
    includePages &&
    (await prisma.jobListing
      .findMany({
        where: { status: JobStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
      })
      .then((rows) =>
        rows.map((r) => ({
          url: `${base}/careers/${r.slug}`,
          lastModified: r.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      )
      .catch(() => []));

  let productUrls: MetadataRoute.Sitemap = [];
  if (includeProducts) {
    productUrls = await prisma.product
      .findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
      .then((rows) =>
        rows.map((r) => ({
          url: `${base}/shop/${r.slug}`,
          lastModified: r.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      )
      .catch(() => []);
  }

  let categoryUrls: MetadataRoute.Sitemap = [];
  if (includeCategories) {
    categoryUrls = await prisma.category
      .findMany({ where: { isActive: true }, select: { slug: true } })
      .then((rows) =>
        rows.map((r) => ({
          url: `${base}/shop?category=${r.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      )
      .catch(() => []);
  }

  let catalogueItemUrls: MetadataRoute.Sitemap = [];
  if (includeProducts) {
    try {
      const rows = await prisma.catalogueItem.findMany({
        where: { status: "LIVE" },
        select: { slug: true, updatedAt: true },
      });
      catalogueItemUrls = rows.map((r) => ({
        url: `${base}/catalogue/${r.slug}`,
        lastModified: r.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch {
      catalogueItemUrls = [];
    }
  }

  return [
    ...staticPages,
    ...(Array.isArray(jobSlugs) ? jobSlugs : []),
    ...productUrls,
    ...categoryUrls,
    ...catalogueItemUrls,
  ];
}


