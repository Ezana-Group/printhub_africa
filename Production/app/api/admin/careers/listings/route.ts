import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

/**
 * GET /api/admin/careers/listings — all listings (all statuses).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const listings = await prisma.jobListing.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { applications: true } } },
  });
  return NextResponse.json(listings);
}

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  department: z.string().min(1),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "ATTACHMENT"]),
  location: z.string().default("Nairobi, Kenya"),
  isRemote: z.boolean().default(false),
  description: z.string(),
  responsibilities: z.string(),
  requirements: z.string(),
  niceToHave: z.string().optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  showSalary: z.boolean().default(false),
  benefits: z.array(z.string()).default([]),
  applicationDeadline: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "FILLED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  customQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.string(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
});

/**
 * POST /api/admin/careers/listings — create listing.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.jobListing.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  const listing = await prisma.jobListing.create({
    data: {
      title: data.title,
      slug: data.slug,
      department: data.department,
      type: data.type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "ATTACHMENT",
      location: data.location,
      isRemote: data.isRemote,
      description: data.description,
      responsibilities: data.responsibilities,
      requirements: data.requirements,
      niceToHave: data.niceToHave ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      showSalary: data.showSalary,
      benefits: data.benefits,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      status: data.status as JobStatus,
      isFeatured: data.isFeatured,
      sortOrder: data.sortOrder,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      customQuestions: data.customQuestions == null ? undefined : data.customQuestions,
      createdBy: (session!.user as { id?: string })?.id ?? null,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  return NextResponse.json(listing);
}
