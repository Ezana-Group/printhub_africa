import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function requireAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user || !ADMIN_ROLES.includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "ATTACHMENT"]).optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  description: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  niceToHave: z.string().nullable().optional(),
  salaryMin: z.number().int().nullable().optional(),
  salaryMax: z.number().int().nullable().optional(),
  showSalary: z.boolean().optional(),
  benefits: z.array(z.string()).optional(),
  applicationDeadline: z.string().datetime().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "FILLED"]).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  customQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.string(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const err = requireAdmin(session);
  if (err) return err;

  const { id } = await params;
  const listing = await prisma.jobListing.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const err = requireAdmin(session);
  if (err) return err;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.slug) {
    const existing = await prisma.jobListing.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }
  }

  const update: Record<string, unknown> = { ...data };
  if (data.applicationDeadline !== undefined) {
    update.applicationDeadline = data.applicationDeadline ? new Date(data.applicationDeadline) : null;
  }
  if (data.status === "PUBLISHED") {
    const current = await prisma.jobListing.findUnique({ where: { id } });
    if (current?.status !== "PUBLISHED") update.publishedAt = new Date();
  }

  const listing = await prisma.jobListing.update({
    where: { id },
    data: update as Parameters<typeof prisma.jobListing.update>[0]["data"],
  });
  return NextResponse.json(listing);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const err = requireAdmin(session);
  if (err) return err;

  const { id } = await params;
  await prisma.jobListing.update({
    where: { id },
    data: { status: JobStatus.CLOSED },
  });
  return NextResponse.json({ success: true });
}
