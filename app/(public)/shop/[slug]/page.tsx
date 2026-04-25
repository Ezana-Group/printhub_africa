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
        basePrice: true,
        availability: true,
        variants: { select: { price: true }, take: 1 },
      },
    });
    if (!product) return { title: "Shop | PrintHub Kenya" };
    const title = product.metaTitle ?? `${product.name} | PrintHub Kenya`;
    const description = formatDescription(product.metaDescription ?? product.shortDescription) || undefined;
    const image = Array.isArray(product.images)
      ? product.images.find((img) => typeof img === "string" && img.trim().length > 0) ?? "/images/og/default-og.webp"
      : "/images/og/default-og.webp";

    const metaCanonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/shop/${slug}`;
    const price = product.variants?.[0]?.price ?? product.basePrice;

    return {
      title,
      description,
      alternates: { canonical: metaCanonicalUrl },
      openGraph: {
        title,
        description,
        url: metaCanonicalUrl,
        siteName: "PrintHub Africa",
        images: [{ url: image, width: 1200, height: 630 }],
        type: "product",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      other: {
        "product:price:amount": Number(price).toString(),
        "product:price:currency": "KES",
        "product:availability": product.availability === "IN_STOCK" ? "instock" : "out of stock",
        "product:condition": "new",
        "og:type": "product",
        "og:title": title,
        "og:description": description,
        "og:image": image,
        "og:price:amount": Number(price).toString(),
        "og:price:currency": "KES",
        "product:condition": "new",
      }
    };
  } catch (error) {
    console.error("[shop/slug] metadata fallback:", error);
    return { title: "Shop | PrintHub Kenya" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const shopCanonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/shop/${slug}`;
  const business = await getBusinessPublic();
  const shippingSettings = await prisma.shippingSettings
    .findUnique({
      where: { id: "default" },
      select: { freeShippingEnabled: true, freeShippingThresholdKes: true },
    })
    .catch(() => null);
  const freeDeliveryThresholdKes =
    shippingSettings?.freeShippingEnabled && shippingSettings?.freeShippingThresholdKes
      ? shippingSettings.freeShippingThresholdKes
      : undefined;
  
  const rawProduct = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      productImages: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { price: "asc" } },
      externalModel: true,
    },
  }).catch(() => null);

  if (!rawProduct) notFound();

  // Serialize Decimal objects to numbers for Client Components
  const product = serializeDecimal(rawProduct);
  const viewProduct = product as typeof product & {
    isPOD?: boolean;
    printTimeEstimate?: string | null;
    filamentWeightGrams?: number | null;
  };

  // Merge modern productImages relation with legacy images JSON array
  const legacyImages = Array.isArray(product.images)
    ? product.images.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];
  const adhocImages = (Array.isArray(product.productImages) ? product.productImages : [])
    .filter((img): img is { id: string; url: string; altText?: string | null; isPrimary?: boolean } => (
      !!img && typeof img.url === "string" && img.url.trim().length > 0
    ))
    .map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    }));

  // Create a combined list of unique images by URL
  const seenUrls = new Set(adhocImages.map(img => img.url));
  const mergedLegacy = legacyImages
    .filter(url => !seenUrls.has(url))
    .map((url, i) => ({ 
      url, 
      isPrimary: adhocImages.length === 0 && i === 0 
    }));

  const galleryImages = [...adhocImages, ...mergedLegacy];
  const descriptionParagraphs = toParagraphs(product.description);
  const shortDescription = formatDescription(product.shortDescription);

  const sharedUpsellWhere = {
    isActive: true,
    id: { not: product.id },
  };

  const frequentRaw = await prisma.product.findMany({
    where: {
      ...sharedUpsellWhere,
      categoryId: product.categoryId,
      ...(Array.isArray(product.tags) && product.tags.length > 0
        ? { tags: { hasSome: product.tags.slice(0, 6) } }
        : {}),
    },
    take: 3,
    orderBy: [{ soldThisMonth: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
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
    },
  }).catch(() => []);

  const relatedRaw = await prisma.product.findMany({
    where: {
      ...sharedUpsellWhere,
      categoryId: product.categoryId,
    },
    take: 6,
    orderBy: [{ isFeatured: "desc" }, { soldThisMonth: "desc" }, { createdAt: "desc" }],
    select: {
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
    },
  }).catch(() => []);

  const normalizeRailProduct = (
    item: (typeof frequentRaw)[number]
  ): {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    basePrice: number;
    comparePrice: number | null;
    imageUrl: string | null;
    stock: number;
    defaultVariantId?: string;
  } => {
    const firstProductImage = Array.isArray(item.productImages)
      ? item.productImages.find((img) => typeof img?.url === "string" && img.url.trim().length > 0)?.url
      : undefined;
    const firstLegacyImage = Array.isArray(item.images)
      ? item.images.find((img) => typeof img === "string" && img.trim().length > 0)
      : undefined;
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      basePrice: Number(item.basePrice),
      comparePrice: item.comparePrice != null ? Number(item.comparePrice) : null,
      imageUrl: firstProductImage ?? firstLegacyImage ?? null,
      stock: item.stock ?? 0,
      defaultVariantId: item.variants[0]?.id ?? undefined,
    };
  };

  const frequentProducts = frequentRaw.map(normalizeRailProduct);
  const frequentIds = new Set(frequentProducts.map((p) => p.id));
  const relatedProducts = relatedRaw
    .map(normalizeRailProduct)
    .filter((item) => !frequentIds.has(item.id))
    .slice(0, 3);

  return (
    <div className="bg-white min-h-screen">
      {/* Google Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: (() => {
            try {
              return JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.shortDescription || product.description,
                "image":
                  galleryImages.find((img) => img.isPrimary)?.url ??
                  galleryImages[0]?.url ??
                  "/images/og/default-og.webp",
                "brand": {
                  "@type": "Brand",
                  "name": "PrintHub Africa"
                },
                "offers": {
                  "@type": "Offer",
                  "price": Number(product.basePrice),
                  "priceCurrency": "KES",
                  "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : (product.isPOD ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"),
                  "url": shopCanonicalUrl,
                  "seller": {
                    "@type": "Organization",
                    "name": "PrintHub Africa"
                  }
                },
                "category": product.category?.name,
                "sku": `shop-${product.id}`
              });
            } catch {
              return "{}";
            }
          })()
        }}
      />
      
      <ViewContentTracker 
        product={{ 
          id: product.id, 
          name: product.name, 
          price: Number(product.basePrice), 
          category: product.category?.name 
        }} 
      />
      
      {/* Premium Breadcrumbs */}
      <div className="bg-slate-50/50 border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <nav className="text-[13px] font-bold flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide text-slate-400">
            <Link href="/" className="hover:text-[#FF4D00] transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4 text-slate-200" />
            <Link href="/shop" className="hover:text-[#FF4D00] transition-colors">Shop</Link>
            {product.category && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-200" />
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-[#FF4D00] transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 text-slate-200" />
            <span className="text-slate-900 truncate max-w-[200px]">{formatDescription(product.name)}</span>
          </nav>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          {/* Left: Gallery (Sticky on desktop) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <ProductImageGallery images={galleryImages} />
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5">
            <ProductInfoBlock
              product={product}
              business={business}
              freeDeliveryThresholdKes={freeDeliveryThresholdKes}
            />
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-900">
              <Truck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Delivery across Kenya</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Tracked nationwide delivery with careful packaging for 3D printed items.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Quality checked before dispatch</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Every item is inspected for print quality, finish consistency, and fit.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-900">
              <BadgeCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Secure payments</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Pay safely via M-Pesa, cards, or bank transfer with clear pricing.
            </p>
          </div>
        </div>

        {/* Bottom Content: Detailed Tabs */}
        <div className="mt-20 max-w-5xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-12">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-5 font-black text-base text-slate-300 data-[state=active]:text-slate-900 transition-all uppercase tracking-widest"
              >
                Story
              </TabsTrigger>
              {viewProduct.isPOD && (
                <TabsTrigger 
                  value="specs" 
                  className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-5 font-black text-base text-slate-300 data-[state=active]:text-slate-900 transition-all uppercase tracking-widest"
                >
                  Tech
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-5 font-black text-base text-slate-300 data-[state=active]:text-slate-900 transition-all uppercase tracking-widest"
              >
                Proof
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="prose prose-slate max-w-none">
                {shortDescription && (
                  <p className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap font-medium font-serif italic mb-10">
                    {shortDescription}
                  </p>
                )}
                <div className="text-slate-700 leading-relaxed text-lg space-y-6">
                  {descriptionParagraphs.length > 0 ? (
                    descriptionParagraphs.map((para, i) => <p key={i}>{para}</p>)
                  ) : (
                    <p>No product story available yet. Message us for full details and customization options.</p>
                  )}
                </div>
                
                {product.externalModel && (
                  <div className="mt-16 p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 shadow-sm">
                    <div className="space-y-4 text-center md:text-left">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Artist Spotlight</p>
                      <h4 className="text-2xl font-bold text-slate-900">Masterfully designed by <span className="text-[#FF4D00]">{product.externalModel.designerName}</span></h4>
                      <div className="flex justify-center md:justify-start gap-4">
                        <LicenceBadge licence={product.externalModel.licenceType} size="sm" />
                      </div>
                    </div>
                    {product.externalModel.designerUrl && (
                      <Button variant="outline" className="rounded-2xl h-14 px-8 border-slate-200 font-bold hover:bg-white" asChild>
                        <a href={product.externalModel.designerUrl} target="_blank">Explore Portfolio</a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specs" className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Precision Engineering</h4>
                     <dl className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                           <dt className="text-slate-500 font-bold">Process</dt>
                           <dd className="font-black text-slate-900">FDM 3D Manufacture</dd>
                        </div>
                        {viewProduct.printTimeEstimate && (
                          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <dt className="text-slate-500 font-bold">Production Cycle</dt>
                            <dd className="font-black text-slate-900">{viewProduct.printTimeEstimate}</dd>
                          </div>
                        )}
                        {viewProduct.filamentWeightGrams && (
                          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <dt className="text-slate-500 font-bold">Net Material weight</dt>
                            <dd className="font-black text-slate-900">{viewProduct.filamentWeightGrams}g</dd>
                          </div>
                        )}
                     </dl>
                  </div>
                  <div className="p-10 bg-[#FFF5F0] rounded-[40px] border border-orange-100/50">
                     <h4 className="text-2xl font-black text-[#FF4D00] uppercase tracking-tighter mb-4">Material Excellence</h4>
                     <p className="text-slate-700 leading-relaxed font-medium">
                        Crafted using premium, industrial-grade filaments. Our PLA+ and PETG selections offer superior tensile strength, thermal stability, and an exquisite matte finish that standard materials cannot match.
                     </p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="reviews" className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <ProductReviewsSection productSlug={product.slug} />
            </TabsContent>
          </Tabs>
        </div>

        <ProductDetailConversionRails
          currentProduct={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            shortDescription: product.shortDescription,
            basePrice: Number(product.basePrice),
            comparePrice: product.comparePrice != null ? Number(product.comparePrice) : null,
            imageUrl: galleryImages[0]?.url ?? null,
            stock: product.stock ?? 0,
            defaultVariantId: product.variants[0]?.id ?? undefined,
          }}
          frequentlyBoughtTogether={frequentProducts}
          relatedProducts={relatedProducts}
          freeDeliveryThresholdKes={freeDeliveryThresholdKes}
        />
      </div>
    </div>
  );
}
