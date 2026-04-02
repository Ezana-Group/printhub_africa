export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponList } from "@/components/admin/coupon-list";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminMarketingPage() {
  try {

  await requireAdminSection("/admin/marketing");
  const coupons = await prisma.coupon.findMany({
    orderBy: { expiryDate: "desc" },
  });
  const subscribers = await prisma.newsletter.count();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const abandonedCartsCount = await prisma.cart.count({
    where: {
      email: { not: null },
      convertedAt: null,
      lastActivityAt: { gte: sevenDaysAgo },
    },
  });
  const abandonedCartsRecent = await prisma.cart.findMany({
    where: {
      email: { not: null },
      convertedAt: null,
      lastActivityAt: { gte: sevenDaysAgo },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 10,
    select: { id: true, email: true, lastActivityAt: true, recoveryEmailSent1At: true, recoveryEmailSent2At: true },
  });

  const activeCoupons = coupons.filter((c) => c.isActive);
  const now = new Date();
  const notExpired = activeCoupons.filter((c) => c.expiryDate >= now);

  const serialized = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    startDate: c.startDate.toISOString(),
    expiryDate: c.expiryDate.toISOString(),
    isActive: c.isActive,
  }));

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 space-y-6">
      <AdminBreadcrumbs items={[{ label: "Marketing" }]} />
      <div>
        <h1 className="text-[24px] font-bold text-[#111]">Marketing</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          Coupons, promo codes, and newsletter subscribers.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Total Coupons</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{coupons.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Active (not expired)</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{notExpired.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Newsletter</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{subscribers}</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">subscribers</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Abandoned carts (7d)</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{abandonedCartsCount}</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">with email, not converted</p>
          </CardContent>
        </Card>
      </div>

      <CouponForm />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#111]">Coupons</CardTitle>
            <p className="text-sm text-[#6B7280]">All discount codes. Edit or delete from the list.</p>
          </CardHeader>
          <CardContent>
            <CouponList coupons={serialized} />
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#111]">Newsletter</CardTitle>
            <p className="text-sm text-[#6B7280]">Total email subscribers.</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#111]">{subscribers}</p>
            <p className="text-sm text-[#6B7280]">subscribers</p>
          </CardContent>
        </Card>
      </div>

      {abandonedCartsRecent.length > 0 && (
        <Card className="bg-white border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#111]">Abandoned carts (recent)</CardTitle>
            <p className="text-sm text-[#6B7280]">Carts with email in the last 7 days. Cron sends 1h and 24h recovery emails.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[#6B7280]">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Last activity</th>
                    <th className="py-2">Emails sent</th>
                  </tr>
                </thead>
                <tbody>
                  {abandonedCartsRecent.map((c) => (
                    <tr key={c.id} className="border-b border-[#E5E7EB]">
                      <td className="py-2 pr-4">{c.email}</td>
                      <td className="py-2 pr-4">{c.lastActivityAt?.toLocaleString() ?? "—"}</td>
                      <td className="py-2">
                        {c.recoveryEmailSent1At ? "1h ✓" : "—"}
                        {c.recoveryEmailSent2At ? " 24h ✓" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
