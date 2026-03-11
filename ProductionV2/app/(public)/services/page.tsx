import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Printer,
  Box,
  FileUp,
  Calculator,
  CreditCard,
  Truck,
  Shield,
  Clock,
  Package,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { getBusinessPublic } from "@/lib/business-public";

const MAIN_SERVICES = [
  {
    title: "Large Format Printing",
    href: "/services/large-format-printing",
    description:
      "Professional wide-format printing for marketing, events, and branding. From small vinyl stickers to billboard-sized graphics, we produce durable, vibrant output on a range of materials.",
    bullets: [
      "Vinyl & flex banners — indoor and outdoor",
      "Vehicle wraps & fleet branding",
      "Billboard and signage",
      "Event backdrops, roll-ups, pop-ups",
      "Canvas prints and fine-art reproduction",
      "Window graphics, wall murals, floor graphics",
      "Mesh banners for wind-resistant outdoor use",
      "Foam board and rigid displays",
    ],
    cta: "Explore Large Format",
    icon: Printer,
    specs: "Max print width 3.2m · AI, PDF, PSD, EPS, PNG 300DPI+ · 3–5 day standard, 24–48hr express",
  },
  {
    title: "3D Printing",
    href: "/services/3d-printing",
    description:
      "From rapid prototypes to finished products. We use FDM and resin technologies with multiple materials and finishes for designers, engineers, educators, and makers.",
    bullets: [
      "FDM (filament) and SLA/resin printing",
      "Custom designs from your STL, OBJ, 3MF files",
      "Ready-made products in our shop",
      "Prototyping and small-batch production",
      "Industrial and consumer-grade materials",
      "Multiple finishes: raw, sanded, painted",
    ],
    cta: "Explore 3D Printing",
    icon: Box,
    specs: "Formats: STL, OBJ, FBX, 3MF · Instant quote by size, material & quantity",
  },
];

const HOW_IT_WORKS = [
  { icon: FileUp, title: "Upload or choose", text: "Send your design or pick a product from our shop." },
  { icon: Calculator, title: "Get a quote", text: "Instant estimate or a custom quote from our team." },
  { icon: CreditCard, title: "Pay securely", text: "M-Pesa, card, Pesapal, or bank transfer." },
  { icon: Truck, title: "Print & deliver", text: "We produce and deliver nationwide across Kenya." },
];

const WHY_US = (city: string) => [
  { icon: Shield, title: "Kenyan-owned", text: city ? `Proudly based in ${city}.` : "Proudly Kenyan." },
  { icon: Clock, title: "Fast turnaround", text: "Standard 3–5 days; express 24–48hrs on many orders." },
  { icon: Package, title: "Quality materials", text: "Premium substrates, inks, and filaments." },
  { icon: Truck, title: "Nationwide delivery", text: "Reliable delivery across Kenya." },
];

export default async function ServicesPage() {
  const business = await getBusinessPublic();
  const whyUs = WHY_US(business.city ?? "Nairobi");
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero */}
      <section className="border-b border-slate-200/80 bg-white">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 max-w-3xl">
            Professional printing solutions for Kenya
          </h1>
          <p className="text-slate-600 text-lg mt-4 max-w-2xl">
            Large format printing and 3D printing for businesses, creatives, and makers. Upload your design for a quote, or shop ready-made products. Fast turnaround, nationwide delivery.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/get-a-quote">Get a quote</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/get-a-quote">Get a quote</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/shop">Shop products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main services */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Our services
          </h2>
          <p className="text-slate-600 max-w-2xl mb-12">
            Two core offerings — large format for signage and branding, and 3D printing for prototypes and products. Both support custom file uploads and instant quoting.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl">
            {MAIN_SERVICES.map((service) => (
              <Card
                key={service.href}
                className="overflow-hidden border-0 bg-white rounded-3xl shadow-lg shadow-slate-200/60 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="aspect-[5/3] bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-primary/10 group-hover:to-primary/5 transition-colors flex items-center justify-center">
                  <service.icon className="h-20 w-20 text-slate-500 group-hover:text-primary transition-colors" />
                </div>
                <CardContent className="p-8">
                  <h3 className="font-display text-2xl font-bold text-slate-900">{service.title}</h3>
                  <p className="text-slate-600 mt-3">{service.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    {service.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
                    {service.specs}
                  </p>
                  <Button
                    asChild
                    className="mt-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group/btn"
                  >
                    <Link href={service.href} className="inline-flex items-center gap-2">
                      {service.cta}
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            How it works
          </h2>
          <p className="text-slate-600 max-w-2xl mb-12">
            From your idea to delivery in four simple steps.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                  <step.icon className="h-7 w-7" />
                </div>
                <p className="font-display font-semibold text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-600 mt-1">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild size="lg" className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/get-a-quote">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why PrintHub */}
      <section className="py-16 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Why PrintHub
          </h2>
          <p className="text-slate-600 max-w-2xl mb-12">
            Trusted by businesses and creatives across Kenya for quality, speed, and reliability.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
            {whyUs.map((r) => (
              <div
                key={r.title}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-slate-900 mt-4">{r.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-slate-900 text-white">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Ready to get started?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            Upload your design for an instant quote, request a custom quote, or browse our shop for ready-made products.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-xl bg-primary hover:bg-primary/90 text-white">
              <Link href="/get-a-quote">Get a quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl border-slate-600 text-white hover:bg-slate-800">
              <Link href="/">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
