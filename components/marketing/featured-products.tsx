import { getCachedFeaturedProducts } from "@/lib/cache/unstable-cache";
import { safePublicFileUrl } from "@/lib/r2";
import {
  FeaturedProductsClient,
  type FeaturedProductCardData,
} from "@/components/marketing/featured-products-client";

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
  let products: Awaited<ReturnType<typeof getCachedFeaturedProducts>> = [];
  try {
    products = await getCachedFeaturedProducts();
  } catch {
    // Build-time or when DB unavailable: show empty state
  }

  const normalizedProducts: FeaturedProductCardData[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription ?? null,
    basePrice: Number(p.basePrice),
    comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
    materials: p.materials ?? [],
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
    imageUrl: getProductImageUrl(p),
  }));

  return <FeaturedProductsClient products={normalizedProducts} />;
}
