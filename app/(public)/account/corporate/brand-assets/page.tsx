import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCorporateAccount } from "@/lib/corporate";
import { prisma } from "@/lib/prisma";
import { Image as ImageIcon, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time

export default async function CorporateBrandAssetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const corporate = await getCorporateAccount();
  if (!corporate || corporate.status !== "APPROVED") redirect("/account/corporate");

  const assets = await prisma.corporateBrandAsset.findMany({
    where: { corporateId: corporate.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/account/corporate"
        className="inline-flex items-center text-sm text-slate-600 hover:text-[#E8440A]"
      >
        <ChevronLeft className="h-4 w-4 mr-0.5" />
        Back to corporate dashboard
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Brand assets</h1>
      <p className="text-slate-600 text-sm">
        Logos and approved files for {corporate.companyName}. Upload and manage assets in your account settings or contact your account manager.
      </p>
      {assets.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-center">
          <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600">No brand assets yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <a
              key={a.id}
              href={a.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <p className="font-medium text-slate-900">{a.name}</p>
              {a.description && <p className="text-sm text-slate-500 mt-0.5">{a.description}</p>}
              <p className="text-xs text-slate-400 mt-2">{a.fileName}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
