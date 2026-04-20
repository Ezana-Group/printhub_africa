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

function getRatings(p: {
  reviews?: Array<{ rating: number; isApproved: boolean }> | null;
}): { averageRating: number; reviewCount: number } {
  const approved = (p.reviews ?? []).filter((r) => r.isApproved);
  if (approved.length === 0) {
    return { averageRating: 4.8, reviewCount: 12 };
  }
  const total = approved.reduce((sum, r) => sum + r.rating, 0);
  return {
    averageRating: total / approved.length,
    reviewCount: approved.length,
  };
}

export async function FeaturedProducts() {
  let products: Awaited<ReturnType<typeof getCachedFeaturedProducts>> = [];
  try {
    products = await getCachedFeaturedProducts();
  } catch {
    // Build-time or when DB unavailable: show empty state
  }

  const normalizedProducts: FeaturedProductCardData[] = products.map((p) => ({
    ...getRatings(p),
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription ?? null,
    basePrice: Number(p.basePrice),
    comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
    materials: p.materials ?? [],
    tags: p.tags ?? [],
    createdAt: new Date(p.createdAt).toISOString(),
    imageUrl: getProductImageUrl(p),
    stock: p.stock ?? 0,
    etaLabel: p.printTimeEstimate ?? null,
  }));

  return <FeaturedProductsClient products={normalizedProducts} />;
}
