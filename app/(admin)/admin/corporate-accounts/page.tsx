import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminCorporateAccountsPage() {
  await requireAdminSection("/admin/corporate-accounts");

  const corporateAccounts = await prisma.corporateAccount.findMany({
    include: { primaryUser: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Corporate Accounts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          B2B accounts with credit limits and NET-30 terms.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          {corporateAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Account</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Credit limit</th>
                    <th className="text-left p-4 font-medium">Terms</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {corporateAccounts.map((acc) => (
                    <tr key={acc.id} className="border-b hover:bg-muted/30">
                      <td className="p-4 font-medium">{acc.companyName}</td>
                      <td className="p-4">{acc.primaryUser?.name ?? acc.primaryUser?.email ?? "—"}</td>
                      <td className="p-4">{acc.creditLimit != null ? `KES ${Number(acc.creditLimit).toLocaleString("en-KE")}` : "—"}</td>
                      <td className="p-4">{acc.paymentTerms ?? "—"}</td>
                      <td className="p-4">
                        <Link href={acc.primaryUserId ? `/admin/customers/${acc.primaryUserId}` : "#"} className="text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No corporate accounts yet.</p>
              <Link href="/admin/customers" className="text-primary hover:underline mt-2 inline-block">
                View all customers
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
