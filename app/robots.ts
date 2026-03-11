import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";

const defaultRobots: MetadataRoute.Robots = {
  rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/account/"] },
  sitemap: `${base}/sitemap.xml`,
};

function parseRobotsTxt(txt: string): MetadataRoute.Robots | null {
  const lines = txt.trim().split(/\r?\n/);
  const rules: NonNullable<MetadataRoute.Robots["rules"]>[] = [];
  let sitemap: string | undefined;
  let currentAgent = "*";
  const allow: string[] = [];
  const disallow: string[] = [];

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":").map((s) => s.trim());
    const value = valueParts.join(":").trim();
    if (!key || !value) continue;
    const k = key.toLowerCase();
    if (k === "user-agent") {
      if (currentAgent && (allow.length || disallow.length)) {
        rules.push({ userAgent: currentAgent, allow: allow.length ? allow : undefined, disallow: disallow.length ? disallow : undefined });
      }
      currentAgent = value;
      allow.length = 0;
      disallow.length = 0;
    } else if (k === "allow") allow.push(value);
    else if (k === "disallow") disallow.push(value);
    else if (k === "sitemap") sitemap = value;
  }
  if (currentAgent && (allow.length || disallow.length)) {
    rules.push({ userAgent: currentAgent, allow: allow.length ? allow : undefined, disallow: disallow.length ? disallow : undefined });
  }
  if (rules.length === 0 && !sitemap) return null;
  return {
    rules: rules.length ? (rules.length === 1 ? rules[0] : rules) : defaultRobots.rules,
    sitemap: sitemap ?? defaultRobots.sitemap,
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const seo = await prisma.seoSettings.findUnique({ where: { id: "default" } });
    if (seo?.robotsTxt) {
      const parsed = parseRobotsTxt(seo.robotsTxt);
      if (parsed) return parsed;
    }
  } catch {
    // fallback
  }
  return defaultRobots;
}
