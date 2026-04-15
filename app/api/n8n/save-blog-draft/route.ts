/**
 * POST /api/n8n/save-blog-draft
 *
 * Saves an AI-generated blog article as a DRAFT for editorial review.
 * Called by the SEO Content Engine workflow (AI-13).
 *
 * Body:
 *   { article: string | object, title?: string, source?: string }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface SaveBlogDraftBody {
  article: string | Record<string, unknown>;
  title?: string;
  source?: string;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: SaveBlogDraftBody;
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

  // Extract title from first markdown heading if not provided
  const derivedTitle =
    title ??
    (typeof article === "string"
      ? article.match(/^#\s+(.+)/m)?.[1]?.trim() ?? null
      : null);

  const record = await prisma.blogPost.create({
    data: {
      title: derivedTitle,
      body: bodyText,
      status: "DRAFT",
      source: source ?? "n8n-ai-seo",
    },
  });

  return NextResponse.json({ ok: true, id: record.id, status: "DRAFT" });
}
