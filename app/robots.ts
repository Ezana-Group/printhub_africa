import { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/account/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
