import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductReviewsSection } from "./reviews-section";
import { formatPrice } from "@/lib/utils";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";

const DEFAULT_WHATSAPP = "254700000000";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        name: true,
        shortDescription: true,
        metaTitle: true,
        metaDescription: true,
        images: true,
        productImages: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });
    if (!product) return { title: "Shop | PrintHub Kenya" };
    const primaryUrl = product.images?.[0] ?? product.productImages?.[0]?.url;
    return {
      title: product.metaTitle ?? `${product.name} | PrintHub Kenya`,
      description: product.metaDescription ?? product.shortDescription ?? undefined,
      openGraph: {
        title: product.metaTitle ?? product.name,
        images: primaryUrl ? [primaryUrl] : undefined,
      },
    };
  } catch {
    return { title: "Shop | PrintHub Kenya" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const business = await getBusinessPublic();
  const whatsappDigits = (business.whatsapp ?? "").replace(/\D/g, "") || DEFAULT_WHATSAPP;
  const waHref = (text: string) => `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let product: any = null;
  try {
    product = await prisma.product.findFirst({
      where: { slug, isActive: true },
        include: {
        category: { select: { name: true, slug: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
        variants: true,
        externalModel: true,
      },
    });
  } catch {
    // DB unavailable
  }
  if (!product) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productWithRelations = product as any;
  const dbImages = productWithRelations.productImages ?? [];
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const galleryImages: any[] =
    dbImages.length > 0
      ? dbImages.map((img: any) => ({ id: img.id, url: img.url, altText: img.altText, isPrimary: img.isPrimary }))
      : (product.images ?? []).map((url: string, i: number) => ({ id: undefined, url, altText: null as string | null, isPrimary: i === 0 }));
  const primaryImage = product.images?.[0] ?? galleryImages.find((i: any) => i.isPrimary)?.url ?? galleryImages[0]?.url;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const basePrice = Number(product.basePrice);
  const comparePrice = product.comparePrice != null ? Number(product.comparePrice) : null;

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <nav className="mb-6 text-sm text-slate-600">
        <Link href="/shop" className="hover:text-slate-900">Shop</Link>
        <span className="mx-2">/</span>
        {productWithRelations.category && (
          <>
            <Link href={`/shop?category=${productWithRelations.category.slug}`} className="hover:text-slate-900">{productWithRelations.category.name}</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="max-w-lg">
          <ProductImageGallery images={galleryImages} />
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">{product.name}</h1>
          {product.sku && <p className="mt-1 text-sm text-slate-500">SKU: {product.sku}</p>}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">{formatPrice(basePrice)}</span>
            {comparePrice != null && comparePrice > basePrice && (
              <span className="text-lg text-slate-500 line-through">{formatPrice(comparePrice)}</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">Prices include 16% VAT.</p>

          {product.shortDescription && (
            <p className="mt-4 text-slate-700">{product.shortDescription}</p>
          )}

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700">Stock: {product.stock > 0 ? (product.stock <= 5 ? `Low (${product.stock} left)` : "In stock") : "Out of stock"}</p>
          </div>

          <AddToCartButton
            productId={product.id}
            name={product.name}
            slug={product.slug}
            image={primaryImage ?? undefined}
            basePrice={basePrice}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants={productWithRelations.variants.map((v: any) => ({ id: v.id, name: v.name, price: Number(v.price), stock: v.stock }))}
            stock={product.stock}
            minOrderQty={product.minOrderQty}
            maxOrderQty={product.maxOrderQty ?? undefined}
          />

          <div className="mt-8 flex gap-4">
            <a
              href={waHref(`Hi, I have a question about: ${product.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-600 hover:underline"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="mt-12 border-t border-slate-200 pt-12">
          <h2 className="font-display text-xl font-bold text-slate-900">Description</h2>
          <p className="mt-4 text-slate-700 whitespace-pre-wrap">{product.description}</p>
          
          {productWithRelations.externalModel && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Original design by {productWithRelations.externalModel.designerName}</p>
                <div className="flex gap-2">
                  <LicenceBadge licence={productWithRelations.externalModel.licenceType} size="sm" />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {productWithRelations.externalModel.designerUrl && (
                  <a href={productWithRelations.externalModel.designerUrl} target="_blank" className="text-blue-600 hover:underline block mb-1">
                    View Designer Profile
                  </a>
                )}
                <span>Printed by PrintHub Africa</span>
              </div>
            </div>
          )}
        </div>
      )}

      <ProductReviewsSection productSlug={product.slug} />
    </div>
  );
}
