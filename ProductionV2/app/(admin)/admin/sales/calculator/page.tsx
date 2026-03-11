import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { SalesPrintCalculator } from "@/components/admin/SalesPrintCalculator";

export default function AdminSalesCalculatorPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Quotes & Uploads", href: "/admin/quotes" },
          { label: "Sales calculator" },
        ]}
      />
      <div>
        <h1 className="text-[24px] font-bold text-[#111]">Sales calculator</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          Quote builder for the sales team. Add line items, set margins, and
          generate client-ready quotes.
        </p>
      </div>
      <SalesPrintCalculator />
    </div>
  );
}
