export const dynamic = 'force-dynamic'
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, FileText } from "lucide-react";

export default async function AdminCorporatePage() {
  await requireAdminSection("/admin/corporate");

  const [pendingCount, approvedAccountsCount] = await Promise.all([
    prisma.corporateApplication.count({ where: { status: "PENDING" } }),
    prisma.corporateAccount.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Corporate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          B2B applications and accounts.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/corporate/applications">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending applications</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/corporate-accounts">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved accounts</p>
                <p className="text-2xl font-bold">{approvedAccountsCount}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-2">Quick links</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin/corporate/applications" className="text-primary hover:underline">
                Review applications
              </Link>
              {pendingCount > 0 && (
                <span className="ml-2 text-amber-600 font-medium">({pendingCount} pending)</span>
              )}
            </li>
            <li>
              <Link href="/admin/corporate-accounts" className="text-primary hover:underline">
                View all corporate accounts
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
