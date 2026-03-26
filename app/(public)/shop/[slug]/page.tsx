import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductInfoBlock } from "@/components/shop/ProductInfoBlock";
import { ProductReviewsSection } from "./reviews-section";
import { formatDescription } from "@/lib/utils";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getWhatsAppTemplate } from "@/lib/whatsapp-templates";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { name: true, shortDescription: true, metaTitle: true, metaDescription: true, images: true },
  });
  if (!product) return { title: "Shop | PrintHub Kenya" };
  return {
    title: product.metaTitle ?? `${product.name} | PrintHub Kenya`,
    description: product.metaDescription ?? product.shortDescription ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [business, whatsappTemplate] = await Promise.all([
    getBusinessPublic(),
    getWhatsAppTemplate("product-enquiry"),
  ]);
  
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      productImages: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { price: "asc" } },
      externalModel: true,
      printMaterials: {
        include: {
          consumable: true,
        },
      },
      filamentColors: {
        include: {
          filamentColor: true,
        },
      },
    },
  });

  if (!product) notFound();

  const galleryImages = product.productImages.length > 0
    ? product.productImages.map(img => ({ id: img.id, url: img.url, altText: img.altText, isPrimary: img.isPrimary }))
    : product.images.map((url, i) => ({ url, isPrimary: i === 0 }));

  return (
    <div className="bg-white min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-[13px] font-medium text-slate-400 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {product.category && (
            <>
              <span className="text-slate-300">/</span>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 truncate max-w-[200px]">{formatDescription(product.name)}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 xl:col-span-7">
            <ProductImageGallery images={galleryImages} />
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5 xl:col-span-5">
            <ProductInfoBlock 
              product={product as any} 
              business={business} 
              whatsappTemplate={whatsappTemplate}
            />
          </div>
        </div>

        {/* Bottom: Tabs/Content */}
        <div className="mt-20 max-w-4xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all"
              >
                Description
              </TabsTrigger>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(product as any).isPOD && (
                <TabsTrigger 
                  value="specs" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all"
                >
                  Technical Specs
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4D00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-4 font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="py-8 animate-in fade-in duration-500">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                  {formatDescription(product.description || product.shortDescription)}
                </p>
                
                {product.externalModel && (
                  <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Designer Attribution</p>
                      <p className="text-sm text-slate-600">This model was designed by <span className="font-bold text-slate-900">{product.externalModel.designerName}</span></p>
                      <div className="flex justify-center sm:justify-start gap-2">
                        <LicenceBadge licence={product.externalModel.licenceType} size="sm" />
                      </div>
                    </div>
                    {product.externalModel.designerUrl && (
                      <Button variant="outline" className="rounded-xl border-slate-200" asChild>
                        <a href={product.externalModel.designerUrl} target="_blank">View Portfolio</a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specs" className="py-8 animate-in fade-in duration-500">
               <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <h4 className="font-bold text-slate-900">Printing Details</h4>
                     <dl className="space-y-2">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                           <dt className="text-sm text-slate-500">Process</dt>
                           <dd className="text-sm font-bold text-slate-900">FDM 3D Printing</dd>
                        </div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(product as any).printTimeEstimate && (
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                            <dt className="text-sm text-slate-500">Print Time</dt>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <dd className="text-sm font-bold text-slate-900">{(product as any).printTimeEstimate}</dd>
                          </div>
                        )}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(product as any).filamentWeightGrams && (
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                            <dt className="text-sm text-slate-500">Material Weight</dt>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <dd className="text-sm font-bold text-slate-900">{(product as any).filamentWeightGrams}g</dd>
                          </div>
                        )}
                     </dl>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-bold text-slate-900">Material Properties</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">
                        We use high-quality, eco-friendly filaments. Most products are printed in PLA+, offering superior strength and surface finish compared to standard PLA.
                     </p>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="reviews" className="py-8 animate-in fade-in duration-500">
               <ProductReviewsSection productSlug={product.slug} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
