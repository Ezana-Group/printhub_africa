export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation";
import { Lock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteDetailClient } from "@/components/admin/quote-detail-client";
import { QuoteSubmissionDetails } from "@/components/admin/quote-submission-details";
import { QuoteFilesSection } from "@/components/admin/quote-files-section";
import { QuoteUploadedFilesCard } from "@/components/admin/quote-uploaded-files-card";
import { QuoteThreadCard } from "@/components/admin/quote-thread-card";
import { AdminQuoteCancelRestore } from "@/components/admin/quote-cancel-restore";

const TYPE_LABELS: Record<string, string> = {
  large_format: "Large Format",
  three_d_print: "3D Print",
  design_and_print: "I Have an Idea",
};

// AUDIT FIX: brand orange — no blue
const TYPE_BADGE_CLASS: Record<string, string> = {
  large_format: "bg-orange-100 text-orange-800 border-0",
  three_d_print: "bg-purple-100 text-purple-800 border-0",
  design_and_print: "bg-green-100 text-green-800 border-0",
};

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/quotes");
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      assignedStaff: { select: { id: true, user: { select: { name: true, email: true } } } },
      cancelledByAdmin: { select: { name: true } },
      uploadedFiles: {
        orderBy: { createdAt: "asc" },
        select: { id: true, originalName: true, filename: true, mimeType: true, size: true, fileType: true, createdAt: true },
      },
    },
  });

  if (!quote) notFound();

  const staffList = await prisma.staff.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const specs = quote.specifications as Record<string, unknown> | null;
  const specEstimateLow = specs && typeof specs.estimateLow === "number" ? specs.estimateLow : null;
  const specEstimateHigh = specs && typeof specs.estimateHigh === "number" ? specs.estimateHigh : null;
  const deadlineHint =
    !quote.deadline && quote.description && quote.description.trim().length > 0
      ? quote.description.trim().length > 80
        ? quote.description.trim().slice(0, 77) + "..."
        : quote.description.trim()
      : null;

  const serialized = {
    ...quote,
    type: quote.type,
    quotedAmount: quote.quotedAmount != null ? Number(quote.quotedAmount) : null,
    deadline: quote.deadline?.toISOString() ?? null,
    quotedAt: quote.quotedAt?.toISOString() ?? null,
    acceptedAt: quote.acceptedAt?.toISOString() ?? null,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    closedAt: quote.closedAt?.toISOString() ?? null,
    staffList: staffList.map((s) => ({
      id: s.id,
      name: s.user?.name ?? "",
      email: s.user?.email ?? "",
    })),
  };

  const isCancelledStatus = quote.status === "cancelled" || quote.status === "rejected";

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Quotes & Uploads", href: "/admin/quotes" },
          { label: quote.quoteNumber },
        ]}
      />

      {isCancelledStatus && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-red-800">
              {quote.status === "cancelled" && quote.closedBy === "CUSTOMER"
                ? "Customer withdrew this quote request"
                : quote.status === "rejected"
                  ? "Customer declined this quote"
                  : "This quote was cancelled by a staff member"}
            </p>
            <div className="mt-1 space-y-0.5 text-sm text-red-700">
              {quote.cancelledAt && (
                <p>Cancelled: {new Date(quote.cancelledAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              )}
              {(quote.closedReason ?? quote.cancellationReason) && (
                <p>Reason: <span className="font-medium">&quot;{quote.closedReason ?? quote.cancellationReason}&quot;</span></p>
              )}
              {quote.closedBy === "CUSTOMER" && (
                <p>The customer cancelled from their account portal.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#111]">{quote.quoteNumber}</h1>
          <Badge className={TYPE_BADGE_CLASS[quote.type] ?? ""}>
            {TYPE_LABELS[quote.type] ?? quote.type}
          </Badge>
        </div>
        <Badge
          className={
            quote.status === "new"
              ? "bg-red-100 text-red-800"
              : quote.status === "reviewing"
                ? "bg-amber-100 text-amber-800"
                :                 quote.status === "quoted"
                  ? "bg-orange-100 text-orange-800"
                  : quote.status === "accepted"
                    ? "bg-green-100 text-green-800"
                    : quote.status === "in_production"
                      ? "bg-orange-100 text-orange-800"
                      : quote.status === "completed"
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-600"
          }
        >
          {quote.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Customer</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {quote.customerName}</p>
              <p><span className="text-muted-foreground">Email:</span> {quote.customerEmail}</p>
              {quote.customerPhone && (
                <p><span className="text-muted-foreground">Phone:</span> {quote.customerPhone}</p>
              )}
              <p><span className="text-muted-foreground">Preferred contact:</span> {quote.preferredContact}</p>
              {quote.projectName && (
                <p><span className="text-muted-foreground">Project:</span> {quote.projectName}</p>
              )}
            </CardContent>
          </Card>

          <QuoteSubmissionDetails
            type={quote.type}
            specifications={quote.specifications as Record<string, unknown> | null}
            description={quote.description}
            projectName={quote.projectName}
          />

          <QuoteUploadedFilesCard
            files={quote.uploadedFiles.map((f) => ({
              id: f.id,
              originalName: f.originalName,
              filename: f.filename,
              mimeType: f.mimeType,
              size: f.size,
              fileType: f.fileType,
              createdAt: f.createdAt.toISOString(),
            }))}
          />

          {quote.referenceFiles && quote.referenceFiles.length > 0 && (
            <QuoteFilesSection
              urls={quote.referenceFiles}
              filesMeta={Array.isArray(quote.referenceFilesMeta) ? quote.referenceFilesMeta as { url: string; originalName?: string; sizeBytes?: number; uploadedAt?: string }[] : undefined}
            />
          )}

          <QuoteThreadCard
            createdAt={serialized.createdAt}
            quotedAt={serialized.quotedAt}
            acceptedAt={serialized.acceptedAt}
            status={quote.status}
            adminNotes={quote.adminNotes}
          />
        </div>

        <div>
          {quote.closedBy === "CUSTOMER" && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 mb-6">
              <Lock className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  Customer closed this quote — no changes allowed
                </p>
                <p className="text-red-600 text-sm mt-0.5">
                  {quote.closedReason ?? "This quote was withdrawn or declined by the customer."}
                  {quote.closedAt && (
                    <> Closed on {new Date(quote.closedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}.</>
                  )}
                </p>
                <p className="text-red-500 text-xs mt-1">
                  The customer&apos;s decision is final. To reopen, the customer must submit a new quote request.
                </p>
              </div>
            </div>
          )}
          <QuoteDetailClient
            quoteId={quote.id}
            quoteNumber={quote.quoteNumber}
            currentStatus={quote.status}
            assignedStaffId={quote.assignedStaffId}
            quotedAmount={serialized.quotedAmount}
            quoteBreakdown={quote.quoteBreakdown}
            quoteValidityDays={quote.quoteValidityDays}
            quotePdfUrl={quote.quotePdfUrl}
            notes={quote.notes}
            adminNotes={quote.adminNotes}
            staffList={serialized.staffList}
            createdAt={serialized.createdAt}
            quotedAt={serialized.quotedAt}
            deadline={serialized.deadline}
            customerEstimateLow={specEstimateLow}
            customerEstimateHigh={specEstimateHigh}
            deadlineHint={deadlineHint}
            closedBy={quote.closedBy}
            closedAt={serialized.closedAt}
            closedReason={quote.closedReason}
          />
          <AdminQuoteCancelRestore
            quoteId={quote.id}
            quoteNumber={quote.quoteNumber}
            status={quote.status}
            cancellationReason={quote.cancellationReason}
            cancellationNotes={quote.cancellationNotes}
            cancelledByAdminName={quote.cancelledByAdmin?.name}
            closedBy={quote.closedBy}
          />
        </div>
      </div>
    </div>
  );
}
