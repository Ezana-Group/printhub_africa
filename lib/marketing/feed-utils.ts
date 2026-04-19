import { safePublicFileUrl } from "@/lib/r2";
import { Product, ProductImage, ProductAvailability } from "@prisma/client";

export function getBaseUrl(req: Request): string {
  try {
    const u = new URL(req.url);
    return u.origin;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  }
}

export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getProductImageUrl(
  p: Partial<Product> & { productImages?: ProductImage[] },
  baseUrl: string
): string {
  const imgs = p.productImages ?? [];
  const featured = imgs.find((i) => i.isPrimary) ?? imgs[0];
  const rawImage = p.images?.[0] ?? featured?.url ?? null;

  if (rawImage && (rawImage.startsWith("http") || rawImage.startsWith("https"))) {
    return rawImage;
  }

  if (featured?.storageKey) {
    return safePublicFileUrl(featured.storageKey);
  }

  if (featured?.url) {
    return featured.url.startsWith("http") ? featured.url : `${baseUrl}${featured.url}`;
  }

  return `${baseUrl}/images/placeholder-product.webp`;
}

export const AVAILABILITY_MAP: Record<ProductAvailability, string> = {
  IN_STOCK: "in stock",
  ON_ORDER: "out of stock",
  PRE_ORDER: "preorder",
  IMPORT_ON_REQUEST: "out of stock",
  PRINT_ON_DEMAND: "in stock",
};
