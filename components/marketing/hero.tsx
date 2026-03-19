import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const DEFAULT_HERO_IMAGE = "/images/hero/hero-main.webp";

export function Hero({ heroImage }: { heroImage?: string } = {}) {
  const src = heroImage?.trim() || DEFAULT_HERO_IMAGE;
  const isExternal = src.startsWith("http");
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {isExternal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Large format and 3D printing services in Nairobi, Kenya"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
        />
      ) : (
        <Image
          src={src}
          alt="Large format and 3D printing services in Nairobi, Kenya"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,77,0,0.2),transparent)]" />

      <div className="container max-w-7xl mx-auto relative z-10 px-4 md:px-6 lg:px-8 py-24 text-center">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
          Large format & 3D printing
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold max-w-4xl mx-auto leading-[1.1] text-white tracking-tight">
          Print Anything.
          <br />
          <span className="text-primary">Deliver Everywhere.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-xl mx-auto">
          From Nairobi to all of Kenya — banners, signage, vehicle wraps, and custom 3D prints.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 text-base font-semibold shadow-xl shadow-primary/30"
          >
            <Link href="/shop">Shop Now</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="rounded-2xl px-8 h-12 text-base font-semibold border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#0A0A0A]"
          >
            <Link href="/services">Explore Services</Link>
          </Button>
          <Link
            href="/get-a-quote"
            className="text-base font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Get a Free Quote →
          </Link>
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            10,000+ prints delivered
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            500+ happy clients
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            48hr turnaround
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Nairobi based
          </span>
        </div>
      </div>
    </section>
  );
}
