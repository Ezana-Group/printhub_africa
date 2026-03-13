import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import Link from "next/link";
import { ReviewActions } from "./review-actions";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminSection("/admin/products");
  const { status } = await searchParams;
  const pendingOnly = status === "pending";
  const reviews = await prisma.productReview.findMany({
    where: pendingOnly ? { isApproved: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { id: true, name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });
  const pendingCount = await prisma.productReview.count({ where: { isApproved: false } });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Product reviews</h1>
        <div className="flex gap-2">
          <Link
            href={pendingOnly ? "/admin/reviews" : "/admin/reviews?status=pending"}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pendingOnly ? "bg-muted" : "bg-primary text-primary-foreground"}`}
          >
            All
          </Link>
          <Link
            href="/admin/reviews?status=pending"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pendingOnly ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Pending ({pendingCount})
          </Link>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No reviews found.</div>
        ) : (
          <ul className="divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="p-4 flex flex-wrap gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.product?.name ?? "—"}</span>
                    <Link href={`/shop/${r.product?.slug}`} className="text-sm text-primary hover:underline">
                      View product
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded ${r.isApproved ? "bg-green-100" : "bg-amber-100"}`}>
                      {r.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {r.user?.name ?? "—"} · {r.user?.email ?? "—"}
                  </p>
                  <div className="flex gap-1 mt-1 text-amber-500">{[...Array(r.rating)].map((_, i) => <span key={i}>★</span>)}</div>
                  {r.title && <p className="font-medium mt-1">{r.title}</p>}
                  {r.body && <p className="text-sm text-slate-700 mt-0.5">{r.body}</p>}
                  <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <ReviewActions reviewId={r.id} isApproved={r.isApproved} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
