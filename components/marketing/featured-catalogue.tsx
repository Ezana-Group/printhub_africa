import Link from "next/link";
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
      where: { isFeatured: true, status: "LIVE" },
      take: 8,
      orderBy: { sortOrder: "asc" },
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

  if (items.length === 0) {
    return (
      <section className="py-20 md:py-28 bg-slate-50/80">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
            Print on Demand
          </h2>
          <p className="text-center text-slate-600">No featured catalogue items yet.</p>
          <div className="text-center mt-8">
            <Button asChild className="rounded-2xl bg-primary hover:bg-primary/90">
              <Link href="/catalogue">Browse catalogue</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-slate-50/80">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          Print on Demand
        </h2>
        <p className="text-slate-600 text-center max-w-xl mx-auto mb-14">
          Customise and order 3D-printed pieces from our catalogue. Choose material, colour, and quantity.
        </p>
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
          {items.map((item) => {
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
                className="flex-shrink-0 w-72 snap-center md:w-auto overflow-hidden border-0 rounded-3xl shadow-lg shadow-slate-200/60 hover:shadow-xl transition-shadow bg-white"
              >
                <Link href={`/catalogue/${item.slug}`}>
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={primaryPhoto?.altText ?? item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <CardContent className="p-5">
                    <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                    {item.shortDescription ? (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.shortDescription}</p>
                    ) : null}
                    <p className="mt-3 font-bold text-primary">
                      {priceKes != null ? formatPrice(priceKes) : "From price on page"}
                    </p>
                    <Button size="sm" className="mt-3 w-full rounded-xl bg-primary hover:bg-primary/90">
                      Order Now
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg" className="rounded-2xl border-slate-300 text-slate-700">
            <Link href="/catalogue">View full catalogue</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
