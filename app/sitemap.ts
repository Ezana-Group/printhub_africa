import { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/shop",
    "/get-a-quote",
    "/cart",
    "/checkout",
    "/services/large-format",
    "/services/3d-printing",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  return staticPages;
}
