import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Card, CardContent } from "@/components/ui/card";
import { SendInvoiceButton } from "@/components/admin/SendInvoiceButton";

export default async function AdminFinanceInvoicesPage() {
  await requireAdminSection("/admin/finance");
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: 100,
    include: {
      order: { select: { id: true, orderNumber: true } },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/admin/finance" className="text-sm text-primary hover:underline">← Finance</Link>
      <h1 className="text-2xl font-bold mt-2">Invoices</h1>
      <p className="text-muted-foreground text-sm mt-1">Order invoices (PDF download).</p>
      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Invoice #</th>
                <th className="text-left p-3 font-medium">Order</th>
                <th className="text-left p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Issued</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No invoices yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <Link href={`/admin/orders/${inv.orderId}`} className="text-primary hover:underline">
                        {inv.order?.orderNumber ?? inv.orderId}
                      </Link>
                    </td>
                    <td className="p-3">KES {Number(inv.totalAmount).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td className="p-3 flex flex-wrap items-center gap-2">
                      <a
                        href={`/api/invoices/${inv.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Download PDF
                      </a>
                      <SendInvoiceButton invoiceId={inv.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
