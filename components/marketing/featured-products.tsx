import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

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

export async function FeaturedProducts() {
  let products: Array<
    { id: string; name: string; slug: string; materials?: string[] | null; basePrice: unknown } & {
      images?: string[] | null;
      productImages?: Array<{ url: string; storageKey: string | null; isPrimary?: boolean }>;
    }
  > = [];
  try {
    products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });
  } catch {
    // Build-time or when DB unavailable: show empty state
  }

  if (products.length === 0) {
    return (
      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
            Shop Ready-Made 3D Prints
          </h2>
          <p className="text-center text-slate-600">No featured products yet.</p>
          <div className="text-center mt-8">
            <Button asChild className="rounded-2xl bg-primary hover:bg-primary/90">
              <Link href="/shop">View all products</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          Shop Ready-Made 3D Prints
        </h2>
        <p className="text-slate-600 text-center max-w-xl mx-auto mb-14">
          Handpicked favourites, ready to ship.
        </p>
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
          {products.map((p) => {
            const imageUrl = getProductImageUrl(p);
            return (
              <Card
                key={p.id}
                className="flex-shrink-0 w-72 snap-center md:w-auto overflow-hidden border-0 rounded-3xl shadow-lg shadow-slate-200/60 hover:shadow-xl transition-shadow"
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
                  </div>
                  <CardContent className="p-5">
                  <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                  {p.materials?.length ? (
                    <p className="text-xs text-slate-500 mt-1">{p.materials[0]}</p>
                  ) : null}
                  <p className="mt-3 font-bold text-primary">
                    {formatPrice(Number(p.basePrice))}
                  </p>
                  <Button size="sm" className="mt-3 w-full rounded-xl bg-primary hover:bg-primary/90">
                    Add to Cart
                  </Button>
                </CardContent>
              </Link>
            </Card>
            );
          })}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg" className="rounded-2xl border-slate-300 text-slate-700">
            <Link href="/shop">View All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
