import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export const revalidate = 300; // 5 minutes

/**
 * GET /api/careers
 * Public — returns all PUBLISHED job listings (without salary if showSalary = false).
 */
export async function GET() {
  const listings = await prisma.jobListing.findMany({
    where: { status: JobStatus.PUBLISHED },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      department: true,
      type: true,
      location: true,
      isRemote: true,
      description: true,
      applicationDeadline: true,
      isFeatured: true,
      showSalary: true,
      salaryMin: true,
      salaryMax: true,
      benefits: true,
      createdAt: true,
    },
  });

  const sanitized = listings.map((l) => ({
    ...l,
    description: l.description?.slice(0, 400) + (l.description && l.description.length > 400 ? "…" : ""),
    salaryMin: l.showSalary ? l.salaryMin : null,
    salaryMax: l.showSalary ? l.salaryMax : null,
  }));

  return NextResponse.json(sanitized);
}
