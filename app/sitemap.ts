import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await prisma.seoSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  const includePages = seo?.sitemapIncludePages ?? true;
  const includeProducts = seo?.sitemapIncludeProducts ?? true;
  const includeCategories = seo?.sitemapIncludeCategories ?? true;

  const staticPages = includePages
    ? [
        "",
        "/about",
        "/careers",
        "/shop",
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
      .findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
      .then((rows) =>
        rows.map((r) => ({
          url: `${base}/shop/category/${r.slug}`,
          lastModified: r.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      )
      .catch(() => []);
  }

  return [...staticPages, ...(Array.isArray(jobSlugs) ? jobSlugs : []), ...productUrls, ...categoryUrls];
}
