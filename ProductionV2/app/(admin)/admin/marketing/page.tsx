import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponList } from "@/components/admin/coupon-list";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminMarketingPage() {
  await requireAdminSection("/admin/marketing");
  const coupons = await prisma.coupon.findMany({
    orderBy: { expiryDate: "desc" },
  });
  const subscribers = await prisma.newsletter.count();

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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
    </div>
  );
}
