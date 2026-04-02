import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const staticPages = includePages
    ? [
        "",
        "/about",
        "/careers",
        "/shop",
        "/catalogue",
        "/get-a-quote",
        "/cart",
        "/checkout",
        "/services/large-format",
        "/services/3d-printing",
        "/faq",
        "/track",
        "/login",
        "/register",
      ].map((path) => ({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
        priority: path === "" ? 1 : 0.8,
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

  const feedUrls: MetadataRoute.Sitemap = [
    { url: `${base}/api/products/feed`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
    { url: `${base}/api/products/google`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
    { url: `${base}/api/products/tiktok`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...(Array.isArray(jobSlugs) ? jobSlugs : []),
    ...productUrls,
    ...categoryUrls,
    ...catalogueItemUrls,
    ...feedUrls,
  ];
}


