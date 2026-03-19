import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { CatalogueStatus } from "@prisma/client";

function getProductImageUrl(p: {
  images?: string[] | null;
  productImages?: Array<{ url: string; storageKey: string | null; isPrimary?: boolean }> | null;
}): string | null {
  const imgs = p.productImages ?? [];
  const featured = imgs.find((i) => i.isPrimary) ?? imgs[0];
  const raw = p.images?.[0] ?? featured?.url ?? null;
  if (raw?.startsWith("http")) return raw;
  if (featured?.storageKey) return safePublicFileUrl(featured.storageKey);
  return null;
}

export async function NewArrivalsSection() {
  const [catalogueItems, shopProducts] = await Promise.all([
    prisma.catalogueItem.findMany({
      where: { status: CatalogueStatus.LIVE, isNewArrival: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { tags: { has: "New arrival" } },
          { tags: { has: "new arrival" } },
          { tags: { has: "New design" } },
          { tags: { has: "new design" } },
        ],
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  const hasCatalogue = catalogueItems.length > 0;
  const hasShop = shopProducts.length > 0;
  if (!hasCatalogue && !hasShop) return null;

  return (
    <section className="py-16 md:py-20 bg-slate-50/80">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          New arrivals & new designs
        </h2>
        <p className="text-slate-600 mb-8 max-w-xl">
          Fresh prints and staff picks — ready to ship or customise.
        </p>

        {hasCatalogue && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Print on demand
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
              {catalogueItems.map((item) => {
                const photo = item.photos[0];
                const photoUrl =
                  photo?.url?.startsWith("http")
                    ? photo.url
                    : photo?.storageKey
                      ? safePublicFileUrl(photo.storageKey)
                      : null;
                const priceKes = item.priceOverrideKes ?? item.basePriceKes;
                return (
                  <Card
                    key={item.id}
                    className="flex-shrink-0 w-64 snap-center md:w-auto overflow-hidden border-0 rounded-2xl shadow-md bg-white"
                  >
                    <Link href={`/catalogue/${item.slug}`}>
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : null}
                        <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-white">
                          New
                        </span>
                      </div>
                      <CardContent className="p-4">
                        <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {priceKes != null ? formatPrice(priceKes) : "Price on request"}
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/catalogue">View all catalogue</Link>
              </Button>
            </div>
          </div>
        )}

        {hasShop && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Shop
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
              {shopProducts.map((p) => {
                const imageUrl = getProductImageUrl(p);
                return (
                  <Card
                    key={p.id}
                    className="flex-shrink-0 w-64 snap-center md:w-auto overflow-hidden border-0 rounded-2xl shadow-md bg-white"
                  >
                    <Link href={`/shop/${p.slug}`}>
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={p.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : null}
                        <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-white">
                          New
                        </span>
                      </div>
                      <CardContent className="p-4">
                        <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatPrice(Number(p.basePrice))}
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/shop">View all shop</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
