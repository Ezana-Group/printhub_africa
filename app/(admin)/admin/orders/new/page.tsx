import { AdminCreateOrderForm } from "@/components/admin/orders/AdminCreateOrderForm";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

export default async function AdminNewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; corporateId?: string }>;
}) {
  const params = await searchParams;
  const customerId = params.customerId ?? undefined;
  const corporateId = params.corporateId ?? undefined;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Orders", href: "/admin/orders" },
          { label: "New Order" },
        ]}
      />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Create Order</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create an order on behalf of a customer (corporate or regular).
      </p>
      <div className="mt-6">
        <AdminCreateOrderForm
          preselectedCustomerId={customerId}
          preselectedCorporateId={corporateId}
        />
      </div>
    </div>
  );
}
