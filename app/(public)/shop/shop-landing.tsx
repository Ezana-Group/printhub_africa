"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, FileUp, Calculator, Truck, MessageCircle, ClipboardList } from "lucide-react";
import { CategoryCard } from "@/components/shop/CategoryCard";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  basePrice: number;
  comparePrice: number | null;
  category: { name: string; slug: string };
  stock: number;
  tags?: string[];
}

/** Card content per category slug (editorial) */
const CATEGORY_CARD_CONFIG: Record<
  string,
  { type: "SERVICE" | "SHOP"; href: string; ctaText: string; badge: string; fromPrice: string }
> = {
  "large-format": {
    type: "SERVICE",
    href: "/services/large-format-printing",
    ctaText: "Get a Quote →",
    badge: "Custom Orders",
    fromPrice: "From KES 500",
  },
  "3d-printing": {
    type: "SERVICE",
    href: "/services/3d-printing",
    ctaText: "Upload Your Model →",
    badge: "Custom Orders",
    fromPrice: "From KES 800",
  },
  merchandise: {
    type: "SHOP",
    href: "/shop?category=merchandise",
    ctaText: "Browse Products →",
    badge: "Ready to Ship",
    fromPrice: "From KES 350",
  },
};

function getCardConfig(slug: string) {
  return (
    CATEGORY_CARD_CONFIG[slug] ?? {
      type: "SHOP" as const,
      href: `/shop?category=${slug}`,
      ctaText: "Browse →",
      badge: "Shop",
      fromPrice: "",
    }
  );
}

const DEFAULT_WHATSAPP = "254700000000";

interface ShopLandingProps {
  categories: ShopCategory[];
  featuredProducts: FeaturedProduct[];
  whatsapp?: string | null;
}

export function ShopLanding({ categories, featuredProducts, whatsapp: whatsappProp }: ShopLandingProps) {
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);
  const q = searchParams.get("q")?.trim() ?? "";
  const [searchInput, setSearchInput] = useState(q);
  const [productResults, setProductResults] = useState<{
    items: FeaturedProduct[];
    total: number;
    totalPages: number;
  } | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [whatsappFromApi, setWhatsappFromApi] = useState<string | null>(null);
  const [businessLabel, setBusinessLabel] = useState<string>("PrintHub Nairobi");
  const [largeFormatEnabled, setLargeFormatEnabled] = useState(false);
  const whatsapp = whatsappProp ?? whatsappFromApi;
  const waDigits = (whatsapp ?? DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP;
  const waHref = `https://wa.me/${waDigits}`;

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    fetch("/api/public/service-flags")
      .then((res) => (res.ok ? res.json() : null))
      .then((flags: { largeFormatEnabled?: boolean } | null) => {
        setLargeFormatEnabled(Boolean(flags?.largeFormatEnabled));
      })
      .catch(() => setLargeFormatEnabled(false));
  }, []);

  useEffect(() => {
    fetch("/api/settings/business-public")
      .then((r) => r.json())
      .then((d) => {
        if (whatsappProp == null && d?.whatsapp != null) setWhatsappFromApi(d.whatsapp);
        const name = d?.businessName?.trim();
        const city = d?.city?.trim();
        if (name || city) setBusinessLabel([name, city].filter(Boolean).join(" ") || "PrintHub Nairobi");
      })
      .catch(() => {});
  }, [whatsappProp]);

  const fetchProducts = useCallback(async (query: string, page = 1) => {
    if (!query) return;
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({ q: query, page: String(page), limit: "12" });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setProductResults(json);
    } catch {
      setProductResults({ items: [], total: 0, totalPages: 0 });
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (q) fetchProducts(q);
  }, [q, fetchProducts]);

  const showSearchResults = !!q;
  const hasFeatured = featuredProducts.length > 0;
  const visibleCategories = largeFormatEnabled
    ? categories
    : categories.filter((cat) => cat.slug !== "large-format");

  return (
    <main id="main-content" className="min-h-screen bg-[var(--brand-black)]">
      {/* Section 1 — Page header */}
      <header className="border-b border-white/10 px-6 pt-24 pb-16 md:px-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--brand-orange)]">
            PRINTHUB SHOP — NAIROBI, KENYA
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-[var(--brand-white)] md:text-5xl lg:text-[64px]">
            Everything
            <br />
            We Make.
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg text-white/55">
            From 3D printing services to ready-made products — browse options below.
          </p>
          <form
            method="get"
            action="/shop"
            className="mt-8 w-full md:max-w-[480px]"
            role="search"
          >
            <label htmlFor="shop-search" className="sr-only">
              Search products, services, materials
            </label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
                aria-hidden
              />
              <Input
                id="shop-search"
                type="search"
                name="q"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products, services, materials..."
                className="h-12 rounded-xl border-white/10 bg-white/5 pl-12 font-body text-[var(--brand-white)] placeholder:text-white/40 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
              />
            </div>
          </form>
        </div>
      </header>

      {showSearchResults ? (
        /* Search results view */
        <section className="px-6 py-12 md:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <p className="font-body text-white/60">
              Search results for &quot;{q}&quot;
              {productResults != null && ` (${productResults.total} found)`}
            </p>
            {productsLoading ? (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl bg-white/10" />
                ))}
              </div>
            ) : productResults && productResults.items.length > 0 ? (
              <>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {productResults.items.map((p) => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      image={p.image}
                      basePrice={p.basePrice}
                      comparePrice={p.comparePrice}
                      category={p.category}
                      stock={p.stock}
                      tags={p.tags}
                    />
                  ))}
                </div>
                {productResults.totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <Button asChild variant="outline" className="rounded-xl border-white/20 text-white">
                      <Link href={`/shop?q=${encodeURIComponent(q)}&page=2`}>Load more</Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="font-body text-white/70">No products found. Try a different search.</p>
                <Button asChild className="mt-4 rounded-xl bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange)]/90">
                  <Link href="/shop">Clear search</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Section 2 — Category grid */}
          <section className="px-6 py-16 md:px-12 lg:px-16" aria-label="Shop categories">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCategories.map((cat, i) => {
                  const config = getCardConfig(cat.slug);
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                    >
                      <CategoryCard
                        index={i + 1}
                        type={config.type}
                        name={cat.name}
                        description={cat.description}
                        imageUrl={cat.imageUrl ?? ""}
                        imageAlt={`${cat.name} — ${businessLabel}`}
                        href={config.href}
                        ctaText={config.ctaText}
                        badge={config.badge}
                        fromPrice={config.fromPrice}
                        productCount={cat.productCount}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 3 — Trust strip */}
          <section
            className="border-y border-white/10 overflow-hidden bg-[#111111] py-5"
            aria-label="Trust signals"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 font-mono text-xs text-white/50 md:flex-nowrap md:justify-center">
              <span className="flex items-center gap-2">
                <span className="text-[var(--brand-orange)]">✓</span> Same-day quotes
              </span>
              <span className="hidden text-white/20 md:inline">|</span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--brand-orange)]">✓</span> 48hr express available
              </span>
              <span className="hidden text-white/20 md:inline">|</span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--brand-orange)]">✓</span> Delivered to all 47 counties
              </span>
              <span className="hidden text-white/20 md:inline">|</span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--brand-orange)]">✓</span> M-Pesa accepted
              </span>
              <span className="hidden text-white/20 md:inline">|</span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--brand-orange)]">✓</span> KES pricing, no hidden fees
              </span>
            </div>
            {/* Mobile marquee duplicate for infinite scroll feel */}
            <div className="mt-2 flex animate-marquee gap-8 font-mono text-xs text-white/50 md:hidden" aria-hidden>
              <span className="flex shrink-0 items-center gap-2"><span className="text-[var(--brand-orange)]">✓</span> Same-day quotes</span>
              <span className="flex shrink-0 items-center gap-2"><span className="text-[var(--brand-orange)]">✓</span> 48hr express</span>
              <span className="flex shrink-0 items-center gap-2"><span className="text-[var(--brand-orange)]">✓</span> All 47 counties</span>
              <span className="flex shrink-0 items-center gap-2"><span className="text-[var(--brand-orange)]">✓</span> M-Pesa</span>
              <span className="flex shrink-0 items-center gap-2"><span className="text-[var(--brand-orange)]">✓</span> KES pricing</span>
            </div>
          </section>

          {/* Section 4 — How it works */}
          <section className="px-6 py-24 md:px-12 lg:px-16" aria-label="How it works">
            <div className="mx-auto max-w-5xl">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--brand-orange)]">
                HOW IT WORKS
              </p>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-[var(--brand-white)] md:text-4xl">
                Order in Minutes.
                <br />
                Delivered to Kenya.
              </h2>
              <div className="mt-16 grid gap-12 md:grid-cols-3">
                {[
                  {
                    num: "01",
                    icon: FileUp,
                    title: "Choose or Upload",
                    body: "Browse our shop or upload your file.",
                  },
                  {
                    num: "02",
                    icon: Calculator,
                    title: "Get Your Quote",
                    body: "Instant estimate for shop items. Custom jobs confirmed in 2 business hours.",
                  },
                  {
                    num: "03",
                    icon: Truck,
                    title: "Pay & We Deliver",
                    body: "M-Pesa, card, or bank transfer. Nairobi same-day, nationwide 2–5 days.",
                  },
                ].map((step, i) => (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="relative border-l-2 border-white/10 pl-8 transition-colors hover:border-[var(--brand-orange)]"
                  >
                    <span
                      className="absolute -left-2 top-0 font-display text-[80px] font-extrabold leading-none text-white/[0.07]"
                      aria-hidden
                    >
                      {step.num}
                    </span>
                    <step.icon className="mt-2 h-8 w-8 text-white/80" strokeWidth={1.5} />
                    <h3 className="mt-4 font-display text-lg font-bold text-[var(--brand-white)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-body text-sm text-white/55">{step.body}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5 — Featured products (only if merchandise has products) */}
          {hasFeatured && (
            <section className="border-t border-white/10 bg-[#111111] px-6 py-24 md:px-12 lg:px-16">
              <div className="mx-auto max-w-7xl">
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--brand-orange)]">
                  FEATURED PRODUCTS
                </p>
                <h2 className="mt-4 font-display text-3xl font-extrabold text-[var(--brand-white)] md:text-4xl">
                  Ready to Ship.
                  <br />
                  Order Today.
                </h2>
                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredProducts.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/shop/${p.slug}`}
                      className="group rounded-2xl border border-white/5 bg-[#1A1A1A] p-4 transition-all hover:-translate-y-1 hover:border-white/20"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 25vw"
                            className="object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/30">No image</div>
                        )}
                      </div>
                      <span className="mt-3 block font-mono text-[10px] uppercase text-[var(--brand-orange)]">
                        {p.category.name}
                      </span>
                      <h3 className="mt-1 font-display text-base font-bold text-[var(--brand-white)] line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="mt-2 font-body text-sm font-bold text-[var(--brand-orange)]">
                        KES {p.basePrice.toLocaleString()}
                        <span className="ml-1 font-normal text-white/50">incl. VAT</span>
                      </p>
                      <Button
                        size="sm"
                        className="mt-4 w-full rounded-xl border-white/20 bg-transparent font-body text-white hover:bg-[var(--brand-orange)] hover:text-white hover:border-[var(--brand-orange)]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem({
                            productId: p.id,
                            quantity: 1,
                            unitPrice: p.basePrice,
                            name: p.name,
                            slug: p.slug,
                            image: p.image ?? undefined,
                          });
                        }}
                        disabled={p.stock < 1}
                      >
                        Add to Cart
                      </Button>
                    </Link>
                  ))}
                </div>
                <div className="mt-10 text-center">
                  <Button
                    asChild
                    variant="ghost"
                    className="font-mono text-sm text-white/70 hover:text-[var(--brand-orange)]"
                  >
                    <Link href="/shop?category=merchandise">View All Products →</Link>
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Section 6 — Bottom CTA strip */}
          <section className="bg-[var(--brand-orange)] px-6 py-16 md:px-12 lg:px-16" aria-label="Contact">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="font-display text-3xl font-extrabold text-[var(--brand-black)] md:text-4xl">
                Not sure what you need?
              </h2>
              <p className="mt-4 font-body text-lg text-[var(--brand-black)]/70">
                Chat with our team — we&apos;ll tell you exactly what will work for your project and budget.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  className="h-12 rounded-xl bg-[var(--brand-black)] px-6 text-white hover:bg-[var(--brand-black)]/90"
                >
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp Us
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-xl border-2 border-[var(--brand-black)] bg-transparent text-[var(--brand-black)] hover:bg-[var(--brand-black)]/10"
                >
                  <Link href="/get-a-quote" className="inline-flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Submit a Brief
                  </Link>
                </Button>
              </div>
              <p className="mt-6 font-mono text-xs text-[var(--brand-black)]/50">
                Usually responds within 1 hour · Mon–Sat 8am–6pm EAT
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
