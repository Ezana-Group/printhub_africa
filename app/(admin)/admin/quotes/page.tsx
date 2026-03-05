import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { QuotesUploadsTabs } from "@/components/admin/quotes-uploads-tabs";
import { AdminQuotesList } from "@/components/admin/admin-quotes-list";
import { AdminQuotesStats, type QuoteStats } from "@/components/admin/admin-quotes-stats";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminQuotesPage() {
  await requireAdminSection("/admin/quotes");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [uploads, quotes, staff, statsResult] = await Promise.all([
    prisma.uploadedFile.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        assignedStaff: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.staff.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: "new" } }),
      prisma.quote.count({ where: { status: "quoted" } }),
      prisma.quote.count({
        where: {
          acceptedAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      prisma.quote.aggregate({
        where: { status: { in: ["accepted", "in_production", "completed"] } },
        _sum: { quotedAmount: true },
      }),
    ]),
  ]);

  const stats: QuoteStats = {
    total: statsResult[0],
    newCount: statsResult[1],
    quotedAwaiting: statsResult[2],
    acceptedThisMonth: statsResult[3],
    totalValueKes: Number(statsResult[4]._sum.quotedAmount ?? 0),
  };

  const uploadsSerialized = uploads.map((u) => ({
    id: u.id,
    originalName: u.originalName,
    fileType: u.fileType,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    user: u.user
      ? { name: u.user.name, email: u.user.email }
      : { name: null, email: "" },
  }));

  const quotesSerialized = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    type: q.type,
    status: q.status,
    customerName: q.customerName,
    customerEmail: q.customerEmail,
    projectName: q.projectName,
    deadline: q.deadline?.toISOString() ?? null,
    quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
    createdAt: q.createdAt.toISOString(),
    assignedStaff: q.assignedStaff
      ? { id: q.assignedStaff.id, name: q.assignedStaff.user?.name, email: q.assignedStaff.user?.email }
      : null,
  }));

  const staffList = staff.map((s) => ({
    id: s.id,
    name: s.user?.name ?? "",
    email: s.user?.email ?? "",
  }));

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 space-y-6">
      <AdminBreadcrumbs items={[{ label: "Quotes & Uploads" }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#111]">Quotes & Uploads</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            All quote requests (Get a Quote) and customer file uploads.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/quotes/new">New quote</Link>
        </Button>
      </div>
      <AdminQuotesStats stats={stats} />
      <QuotesUploadsTabs
        uploads={uploadsSerialized}
        quotes={quotesSerialized}
        staffList={staffList}
        quotesListComponent={<AdminQuotesList initialQuotes={quotesSerialized} staffList={staffList} />}
      />
    </div>
  );
}
