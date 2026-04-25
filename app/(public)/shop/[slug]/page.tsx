import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { ProductImageGallery } from "@/components/shop/ProductImageGallery";
import { ProductInfoBlock } from "@/components/shop/ProductInfoBlock";
import { ProductDetailConversionRails } from "@/components/shop/ProductDetailConversionRails";
import { ProductReviewsSection } from "./reviews-section";
import { formatDescription, serializeDecimal, toParagraphs } from "@/lib/utils";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ViewContentTracker } from "@/components/marketing/ViewContentTracker";
import { ChevronRight, Truck, ShieldCheck, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const row = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        name: true,
        shortDescription: true,
        metaTitle: true,
        metaDescription: true,
        images: true,
        basePrice: true,
        availability: true,
        variants: { select: { price: true }, take: 1 },
      },
    }).catch(() => null);

    if (!row) return { title: "Shop | PrintHub Kenya" };

    const pageTitle = row.metaTitle ?? `${row.name} | PrintHub Kenya`;
    const pageDesc = formatDescription(row.metaDescription ?? row.shortDescription) || undefined;
    const ogImageSrc = Array.isArray(row.images)
      ? (row.images.find((src) => typeof src === "string" && src.trim().length > 0) ?? "/images/og/default-og.webp")
      : "/images/og/default-og.webp";
    const pageHref = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/shop/${slug}`;
    const displayPrice = row.variants?.[0]?.price ?? row.basePrice;

    return {
      title: pageTitle,
      description: pageDesc,
      alternates: { canonical: pageHref },
      openGraph: {
        title: pageTitle,
        description: pageDesc,
        url: pageHref,
        siteName: "PrintHub Africa",
        images: [{ url: ogImageSrc, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description: pageDesc,
        images: [ogImageSrc],
      },
      other: {
        "product:price:amount": Number(displayPrice).toString(),
        "product:price:currency": "KES",
        "product:availability": row.availability === "IN_STOCK" ? "instock" : "out of stock",
        "product:condition": "new",
      },
    };
  } catch {
    return { title: "Shop | PrintHub Kenya" };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely build the JSON-LD string for this product — never throws. */
function buildProductJsonLd(opts: {
  productName: string;
  productDesc: string | null | undefined;
  heroImageSrc: string;
  offerPrice: number;
  inStock: boolean;
  offerHref: string;
  categoryName: string | null | undefined;
  productSku: string;
}): string {
  try {
    const ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: opts.productName,
      description: opts.productDesc ?? undefined,
      image: opts.heroImageSrc,
      brand: { "@type": "Brand", name: "PrintHub Africa" },
      sku: opts.productSku,
      category: opts.categoryName ?? undefined,
      offers: {
        "@type": "Offer",
        price: opts.offerPrice,
        priceCurrency: "KES",
        availability: opts.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: opts.offerHref,
        seller: { "@type": "Organization", name: "PrintHub Africa" },
      },
    };
    return JSON.stringify(ld);
  } catch {
    return "{}";
  }
}

type UpsellItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  basePrice: number;
  comparePrice: number | null;
  imageUrl: string | null;
  stock: number;
  defaultVariantId?: string;
};

function normaliseUpsellRow(item: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  basePrice: unknown;
  comparePrice: unknown;
  stock: number | null;
  images: unknown;
  productImages: Array<{ url: string }>;
  variants: Array<{ id: string }>;
}): UpsellItem {
  const firstRelationImg = item.productImages.find(
    (img) => typeof img?.url === "string" && img.url.trim().length > 0
  )?.url;
  const firstLegacyImg = Array.isArray(item.images)
    ? item.images.find((src) => typeof src === "string" && (src as string).trim().length > 0)
    : undefined;
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    shortDescription: item.shortDescription,
    basePrice: Number(item.basePrice),
    comparePrice: item.comparePrice != null ? Number(item.comparePrice) : null,
    imageUrl: (firstRelationImg ?? firstLegacyImg ?? null) as string | null,
    stock: item.stock ?? 0,
    defaultVariantId: item.variants[0]?.id ?? undefined,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  // All DB calls are guarded — a connection hiccup never crashes the render
  const [rawProduct, business, shippingSettings] = await Promise.all([
    prisma.product
      .findFirst({
        where: { slug, isActive: true },
        include: {
          category: { select: { name: true, slug: true } },
          productImages: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { price: "asc" } },
          externalModel: true,
        },
      })
      .catch(() => null),
    getBusinessPublic(),
    prisma.shippingSettings
      .findUnique({
        where: { id: "default" },
        select: { freeShippingEnabled: true, freeShippingThresholdKes: true },
      })
      .catch(() => null),
  ]);

  if (!rawProduct) notFound();

  // Serialize Decimal fields for Client Components
  const product = serializeDecimal(rawProduct);
  const typedProduct = product as typeof product & {
    isPOD?: boolean;
    printTimeEstimate?: string | null;
    filamentWeightGrams?: number | null;
  };

  const freeShippingThreshold =
    shippingSettings?.freeShippingEnabled && shippingSettings.freeShippingThresholdKes
      ? shippingSettings.freeShippingThresholdKes
      : undefined;

  // ── Gallery images: merge productImages relation + legacy images array ──────
  const relationImages = (Array.isArray(product.productImages) ? product.productImages : [])
    .filter(
      (img): img is { id: string; url: string; altText?: string | null; isPrimary?: boolean } =>
        !!img && typeof img.url === "string" && img.url.trim().length > 0
    )
    .map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    }));

  const seenImageUrls = new Set(relationImages.map((img) => img.url));
  const legacyImageList = (Array.isArray(product.images) ? product.images : []).filter(
    (src): src is string => typeof src === "string" && src.trim().length > 0 && !seenImageUrls.has(src)
  );
  const legacyAsGallery = legacyImageList.map((legacySrc, idx) => ({
    url: legacySrc,
    isPrimary: relationImages.length === 0 && idx === 0,
  }));

  const galleryImages = [...relationImages, ...legacyAsGallery];
  const heroImageSrc =
    galleryImages.find((img) => img.isPrimary)?.url ??
    galleryImages[0]?.url ??
    "/images/og/default-og.webp";

  // ── Copy ─────────────────────────────────────────────────────────────────────
  const descParagraphs = toParagraphs(product.description);
  const shortDesc = formatDescription(product.shortDescription);

  // ── Upsell queries ────────────────────────────────────────────────────────────
  const upsellBase = { isActive: true, id: { not: product.id } };
  const upsellSelect = {
    id: true,
    slug: true,
    name: true,
    shortDescription: true,
    basePrice: true,
    comparePrice: true,
    stock: true,
    images: true,
    productImages: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    variants: { select: { id: true }, orderBy: { price: "asc" }, take: 1 },
  } as const;

  const [frequentRaw, relatedRaw] = await Promise.all([
    prisma.product
      .findMany({
        where: {
          ...upsellBase,
          categoryId: product.categoryId,
          ...(Array.isArray(product.tags) && product.tags.length > 0
            ? { tags: { hasSome: (product.tags as string[]).slice(0, 6) } }
            : {}),
        },
        take: 3,
        orderBy: [{ soldThisMonth: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
        select: upsellSelect,
      })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { ...upsellBase, categoryId: product.categoryId },
        take: 6,
        orderBy: [{ isFeatured: "desc" }, { soldThisMonth: "desc" }, { createdAt: "desc" }],
        select: upsellSelect,
      })
      .catch(() => []),
  ]);

  const frequentProducts = frequentRaw.map(normaliseUpsellRow);
  const frequentIdSet = new Set(frequentProducts.map((p) => p.id));
  const relatedProducts = relatedRaw
    .map(normaliseUpsellRow)
    .filter((item) => !frequentIdSet.has(item.id))
    .slice(0, 3);

  // ── Structured data ───────────────────────────────────────────────────────────
  const productPageHref = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/shop/${slug}`;
  const jsonLdString = buildProductJsonLd({
    productName: product.name,
    productDesc: product.shortDescription ?? product.description,
    heroImageSrc,
    offerPrice: Number(product.basePrice),
    inStock: (product.stock ?? 0) > 0 || !!typedProduct.isPOD,
    offerHref: productPageHref,
    categoryName: product.category?.name,
    productSku: `shop-${product.id}`,
  });

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white min-h-screen">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      {/* Pixel / analytics tracking (client-side) */}
      <ViewContentTracker
        product={{
          id: product.id,
          name: product.name,
          price: Number(product.basePrice),
          category: product.category?.name,
        }}
      />

      {/* Breadcrumb */}
      <div className="bg-slate-50/50 border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <nav
            aria-label="Breadcrumb"
            className="text-[13px] font-bold flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide text-slate-400"
          >
            <Link href="/" className="hover:text-[#FF4D00] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-200 shrink-0" />
            <Link href="/shop" className="hover:text-[#FF4D00] transition-colors">
              Shop
            </Link>
            {product.category && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-200 shrink-0" />
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="hover:text-[#FF4D00] transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 text-slate-200 shrink-0" />
            <span className="text-slate-900 truncate max-w-[200px]">
              {formatDescription(product.name)}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero: gallery + info */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-12 items-start">
          {/* Gallery — sticky on desktop */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <ProductImageGallery images={galleryImages} />
          </div>

          {/* Product info */}
          <div className="lg:col-span-5">
            <ProductInfoBlock
              product={product}
              business={business}
              freeDeliveryThresholdKes={freeShippingThreshold}
            />
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-start gap-4">
            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Truck className="h-4 w-4 text-[#FF4D00]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Nationwide delivery</p>
              <p className="mt-1 text-sm text-slate-500">
                Tracked delivery across Kenya — packaged carefully for 3D printed items.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-start gap-4">
            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-[#FF4D00]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Quality checked</p>
              <p className="mt-1 text-sm text-slate-500">
                Every item is inspected for print quality, finish, and fit before dispatch.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-start gap-4">
            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <BadgeCheck className="h-4 w-4 text-[#FF4D00]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Secure checkout</p>
              <p className="mt-1 text-sm text-slate-500">
                Pay via M-Pesa, card, or bank transfer with clear, transparent pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Detail tabs */}
        <div className="mt-20 max-w-5xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-10">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-5 font-black text-sm text-slate-400 data-[state=active]:text-slate-900 transition-all uppercase tracking-widest"
              >
                Story
              </TabsTrigger>
              {typedProduct.isPOD && (
                <TabsTrigger
                  value="specs"
                  className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-5 font-black text-sm text-slate-400 data-[state=active]:text-slate-900 transition-all uppercase tracking-widest"
                >
                  Tech specs
                </TabsTrigger>
              )}
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-5 font-black text-sm text-slate-400 data-[state=active]:text-slate-900 transition-all uppercase tracking-widest"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            {/* Story tab */}
            <TabsContent
              value="description"
              className="py-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="prose prose-slate max-w-none">
                {shortDesc && (
                  <p className="text-xl text-slate-600 leading-relaxed font-medium font-serif italic mb-10">
                    {shortDesc}
                  </p>
                )}
                <div className="text-slate-700 leading-relaxed text-[17px] space-y-5">
                  {descParagraphs.length > 0 ? (
                    descParagraphs.map((para, idx) => <p key={idx}>{para}</p>)
                  ) : (
                    <p className="text-slate-400">
                      Full product details coming soon. Message us for customisation options.
                    </p>
                  )}
                </div>

                {/* Designer credit */}
                {product.externalModel && (
                  <div className="mt-14 p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 text-center md:text-left">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Artist Spotlight
                      </p>
                      <h4 className="text-xl font-bold text-slate-900">
                        Designed by{" "}
                        <span className="text-[#FF4D00]">
                          {product.externalModel.designerName}
                        </span>
                      </h4>
                      <LicenceBadge
                        licence={product.externalModel.licenceType}
                        size="sm"
                      />
                    </div>
                    {product.externalModel.designerUrl && (
                      <Button
                        variant="outline"
                        className="rounded-2xl h-12 px-6 border-slate-200 font-semibold hover:bg-white shrink-0"
                        asChild
                      >
                        <a
                          href={product.externalModel.designerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Portfolio
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Specs tab (POD only) */}
            <TabsContent
              value="specs"
              className="py-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Production details
                  </h4>
                  <dl className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <dt className="text-slate-500 font-semibold text-sm">Process</dt>
                      <dd className="font-bold text-slate-900 text-sm">FDM 3D Printing</dd>
                    </div>
                    {typedProduct.printTimeEstimate && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <dt className="text-slate-500 font-semibold text-sm">Production time</dt>
                        <dd className="font-bold text-slate-900 text-sm">
                          {typedProduct.printTimeEstimate}
                        </dd>
                      </div>
                    )}
                    {typedProduct.filamentWeightGrams && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <dt className="text-slate-500 font-semibold text-sm">Material weight</dt>
                        <dd className="font-bold text-slate-900 text-sm">
                          {typedProduct.filamentWeightGrams}g
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div className="p-8 bg-[#FFF5F0] rounded-3xl border border-orange-100/60">
                  <h4 className="text-lg font-black text-[#FF4D00] uppercase tracking-tight mb-3">
                    Material quality
                  </h4>
                  <p className="text-slate-700 leading-relaxed text-sm">
                    Crafted from premium PLA+ and PETG filaments — superior tensile strength,
                    thermal stability, and a refined matte finish that standard materials
                    cannot match.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Reviews tab */}
            <TabsContent
              value="reviews"
              className="py-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <ProductReviewsSection productSlug={product.slug} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Upsell rails */}
        <ProductDetailConversionRails
          currentProduct={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            shortDescription: product.shortDescription,
            basePrice: Number(product.basePrice),
            comparePrice:
              product.comparePrice != null ? Number(product.comparePrice) : null,
            imageUrl: galleryImages[0]?.url ?? null,
            stock: product.stock ?? 0,
            defaultVariantId: product.variants[0]?.id ?? undefined,
          }}
          frequentlyBoughtTogether={frequentProducts}
          relatedProducts={relatedProducts}
          freeDeliveryThresholdKes={freeShippingThreshold}
        />
      </div>
    </div>
  );
}
