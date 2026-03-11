import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteAcceptDecline } from "@/components/account/quote-accept-decline";

const TYPE_LABELS: Record<string, string> = {
  large_format: "Large Format",
  three_d_print: "3D Print",
  design_and_print: "Design+Print",
};

export default async function AccountQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const [quote, businessSettings] = await Promise.all([
    prisma.quote.findFirst({ where: { id, customerId: session.user.id } }),
    prisma.businessSettings.findUnique({ where: { id: "default" }, select: { businessName: true } }).catch(() => null),
  ]);

  if (!quote) notFound();
  const businessName = businessSettings?.businessName ?? "PrintHub";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/account/quotes"
            className="text-sm font-medium text-[#E8440A] hover:underline"
          >
            ← Back to My Quotes
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">{quote.quoteNumber}</h1>
          <p className="text-sm text-slate-500">
            {TYPE_LABELS[quote.type] ?? quote.type}
            {quote.projectName ? ` · ${quote.projectName}` : ""}
          </p>
        </div>
        <Badge
          className={
            quote.status === "quoted"
              ? "bg-purple-100 text-purple-800"
              : quote.status === "accepted" || quote.status === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-700"
          }
        >
          {quote.status.replace("_", " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Your request</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {quote.projectName && <p><span className="text-muted-foreground">Project:</span> {quote.projectName}</p>}
          {quote.description && (
            <div className="pt-2 border-t">
              <p className="text-muted-foreground mb-1">Description</p>
              <p className="whitespace-pre-wrap">{quote.description}</p>
            </div>
          )}
          <p className="text-muted-foreground pt-2">Submitted {new Date(quote.createdAt).toLocaleString()}</p>
        </CardContent>
      </Card>

      {quote.status === "quoted" && quote.quotedAmount != null && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Quote from {businessName}</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(Number(quote.quotedAmount))}
            </p>
            {quote.quoteBreakdown && (
              <div className="text-sm text-slate-600 whitespace-pre-wrap border-t pt-3">
                {quote.quoteBreakdown}
              </div>
            )}
            <QuoteAcceptDecline quoteId={quote.id} />
          </CardContent>
        </Card>
      )}

      {(quote.status === "accepted" || quote.status === "completed") && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm">
          Your quote has been accepted. Our team will be in touch to arrange payment and production.
        </div>
      )}
    </div>
  );
}
