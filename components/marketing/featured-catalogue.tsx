import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export async function FeaturedCatalogueSection() {
  let items: Array<{
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    basePriceKes: number | null;
    priceOverrideKes: number | null;
    photos: Array<{ url: string; storageKey: string | null; altText: string | null; isPrimary: boolean }>;
  }> = [];
  try {
    const rows = await prisma.catalogueItem.findMany({
      where: {
        status: "LIVE",
        OR: [{ isFeatured: true }, { isPOD: true }],
      },
      take: 8,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        basePriceKes: true,
        priceOverrideKes: true,
        photos: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true, storageKey: true, altText: true, isPrimary: true },
        },
      },
    });
    items = rows;
  } catch {
    // Build-time or when DB unavailable: show empty state
  }

  return (
    <section id="print-on-demand" className="bg-[#FAFAFA] py-[60px]">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="mb-3 block h-[3px] w-10 rounded-[2px] bg-[#FF4D00]" />
            <h2 className="font-display text-2xl font-extrabold text-slate-900 md:text-[2rem]">
              Print on Demand
            </h2>
          </div>
          <Link href="/catalogue" className="text-[15px] font-medium text-[#FF4D00] hover:underline">
            Browse catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.length > 0 ? (
            items.map((item) => {
              const priceKes = item.priceOverrideKes ?? item.basePriceKes;
              const primaryPhoto = item.photos[0];
              const photoUrl =
                primaryPhoto?.url?.startsWith("http")
                  ? primaryPhoto.url
                  : primaryPhoto?.storageKey
                    ? safePublicFileUrl(primaryPhoto.storageKey)
                    : primaryPhoto?.url ?? null;

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden rounded-xl border-0 bg-white"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                >
                  <Link href={`/catalogue/${item.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-[#F5F5F5]">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={primaryPhoto?.altText ?? item.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/catalogue/${item.slug}`}>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {item.shortDescription ?? "Customisable print-on-demand product."}
                    </p>
                    <p className="mt-3 text-lg font-bold text-[#FF4D00]">
                      {priceKes != null ? `From ${formatPrice(priceKes)}` : "From price on page"}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-4 w-full rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90"
                    >
                      <Link href={`/catalogue/${item.slug}`}>Customise &amp; Order</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center">
              <div className="mt-2">
                <PackageSearch className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-slate-600">No featured catalogue items yet.</p>
              </div>
              <div className="mt-6">
                <Button asChild className="rounded-2xl bg-primary hover:bg-primary/90">
                  <Link href="/catalogue">Browse catalogue</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
