import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BusinessStats } from "@/components/stats/BusinessStats";
import { WovenLightHero } from "@/components/ui/woven-light-hero";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      <div className="absolute inset-0 z-0">
        <WovenLightHero showText={false} showNav={false} />
      </div>

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
            className="rounded-full border-2 border-white/20 bg-white/10 px-8 h-12 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 shadow-xl shadow-primary/20"
          >
            <Link href="/shop">Shop Now</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="rounded-full border-2 border-white/20 bg-white/10 px-8 h-12 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
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
        <BusinessStats variant="compact" />
      </div>
    </section>
  );
}
