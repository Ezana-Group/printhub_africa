import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

/**
 * GET /api/careers/[slug]
 * Public — returns single PUBLISHED job listing by slug. 404 if not found or not PUBLISHED.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const job = await prisma.jobListing.findFirst({
    where: { slug, status: JobStatus.PUBLISHED },
    include: {
      _count: { select: { applications: true } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { _count, ...rest } = job;
  const sanitized = {
    ...rest,
    salaryMin: job.showSalary ? job.salaryMin : null,
    salaryMax: job.showSalary ? job.salaryMax : null,
  };
  return NextResponse.json(sanitized);
}
