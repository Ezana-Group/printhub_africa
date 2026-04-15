/**
 * POST /api/n8n/save-blog-post
 *
 * Publishes an AI-generated blog article directly (status = PUBLISHED).
 * Called by the SEO Content Engine cron workflow (AI-13 cron variant).
 *
 * Body:
 *   { article: string | object, title?: string, slug?: string, source?: string }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface SaveBlogPostBody {
  article: string | Record<string, unknown>;
  title?: string;
  slug?: string;
  source?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: SaveBlogPostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { article, title, source } = body;

  if (!article) {
    return NextResponse.json({ error: "article is required" }, { status: 400 });
  }

  const bodyText = typeof article === "string" ? article : JSON.stringify(article);

  const derivedTitle =
    title ??
    (typeof article === "string"
      ? article.match(/^#\s+(.+)/m)?.[1]?.trim() ?? null
      : null);

  // Generate a unique slug
  const baseSlug = body.slug ?? (derivedTitle ? slugify(derivedTitle) : null);
  let slug: string | null = baseSlug;

  if (slug) {
    const exists = await prisma.blogPost.findUnique({ where: { slug } });
    if (exists) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const record = await prisma.blogPost.create({
    data: {
      title: derivedTitle,
      slug,
      body: bodyText,
      status: "PUBLISHED",
      source: source ?? "n8n-ai-seo-cron",
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    id: record.id,
    slug: record.slug,
    status: "PUBLISHED",
  });
}
