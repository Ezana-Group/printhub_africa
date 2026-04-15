/**
 * POST /api/n8n/save-ai-content
 *
 * Saves AI-generated social media posts to the N8nGeneratedContent table
 * for human review and approval before publishing.
 *
 * Body:
 *   {
 *     productId?: string,
 *     socialPosts: object,   // JSON from GPT-4o/Claude
 *     source?: string
 *   }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface SaveAIContentBody {
  productId?: string;
  socialPosts: unknown;
  source?: string;
  title?: string;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: SaveAIContentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, socialPosts, source, title } = body;

  if (!socialPosts) {
    return NextResponse.json({ error: "socialPosts is required" }, { status: 400 });
  }

  // Parse if string (GPT sometimes returns JSON as a string)
  let parsedPosts: unknown = socialPosts;
  if (typeof socialPosts === "string") {
    try {
      parsedPosts = JSON.parse(socialPosts);
    } catch {
      parsedPosts = { raw: socialPosts };
    }
  }

  const record = await prisma.n8nGeneratedContent.create({
    data: {
      type: "SOCIAL_POSTS",
      productId: productId ?? null,
      title: title ?? null,
      body: parsedPosts as object,
      status: "PENDING_APPROVAL",
      source: source ?? "AI-1 social-media-posts",
    },
  });

  return NextResponse.json({ ok: true, id: record.id });
}
