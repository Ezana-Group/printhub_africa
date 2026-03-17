import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SERVICES = [
  {
    title: "Large Format Printing",
    href: "/services/large-format-printing",
    description: "Banners, billboards, vehicle wraps, canvas, signage, and more.",
    bullets: ["Vinyl & flex banners", "Vehicle wraps & branding", "Canvas prints", "Event backdrops"],
    cta: "Explore Large Format",
    defaultImage: "/images/services/large-format-hero.webp",
    alt: "Large format printing — banners, signage, vehicle wraps",
  },
  {
    title: "3D Printing",
    href: "/services/3d-printing",
    description: "From prototypes to finished products. Multiple materials and finishes.",
    bullets: ["FDM & resin printing", "Custom designs", "Ready-made products", "Industrial & consumer"],
    cta: "Explore 3D Printing",
    defaultImage: "/images/services/3d-printing-hero.webp",
    alt: "3D printing — FDM and resin printing Kenya",
  },
];

export function ServicesOverview({
  largeFormatImage,
  threeDImage,
}: {
  largeFormatImage?: string;
  threeDImage?: string;
} = {}) {
  const images = [
    largeFormatImage ?? SERVICES[0].defaultImage,
    threeDImage ?? SERVICES[1].defaultImage,
  ];
  return (
    <section className="py-20 md:py-28 bg-slate-50/80">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          Our Services
        </h2>
        <p className="text-slate-600 text-center max-w-xl mx-auto mb-14">
          Professional printing solutions for businesses and creatives across Kenya.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {SERVICES.map((service, i) => (
            <Card
              key={service.href}
              className="overflow-hidden border-0 bg-white rounded-3xl shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-slate-200/80 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="relative aspect-[5/3] rounded-t-3xl overflow-hidden">
                <Image
                  src={images[i] ?? service.defaultImage}
                  alt={service.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <CardContent className="p-8">
                <h3 className="font-display text-xl font-bold text-slate-900">{service.title}</h3>
                <p className="text-slate-600 mt-2">{service.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  {service.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <Link href={service.href}>{service.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
