import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BusinessStats } from "@/components/stats/BusinessStats";
import { WovenLightHero } from "@/components/ui/woven-light-hero";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Background with WovenLightHero particles */}
      <div className="absolute inset-0 z-0">
        <WovenLightHero showText={false} showNav={false} />
      </div>

      {/* Edge Fading Overlays */}
      <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-[30%] bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-20 px-4 md:px-8 lg:px-12 py-24 flex flex-col md:flex-row justify-between items-center gap-12">
        {/* Left Column (30% width) */}
        <div className="w-full md:w-[30%] text-left space-y-6">
          <div className="space-y-2">
            <p className="text-secondary font-semibold text-xs md:text-sm uppercase tracking-[0.2em]">
              Large format & 3D printing
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              Print Anything.
            </h1>
          </div>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-sm">
            High-precision printing & 3D fabrication services for businesses and individuals across the continent.
          </p>
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full border-2 border-white/20 bg-white/10 px-8 h-12 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 shadow-xl shadow-primary/10"
            >
              <Link href="/shop">Shop Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-2 border-white/10 bg-white/5 text-white hover:bg-white/10 px-8 h-12 text-sm font-semibold backdrop-blur-sm transition-all"
            >
              <Link href="/services">Explore Services</Link>
            </Button>
          </div>
        </div>

        {/* Center Space (40% width) - Clear for background art */}
        <div className="hidden md:block md:w-[40%]" />

        {/* Right Column (30% width) */}
        <div className="w-full md:w-[30%] text-left md:text-right space-y-6">
          <div className="space-y-2">
            <p className="text-secondary font-semibold text-xs md:text-sm uppercase tracking-[0.2em]">
              Nationwide Delivery
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#ff5500] tracking-tight leading-[1.1]">
              Deliver Everywhere.
            </h1>
          </div>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-sm ml-0 md:ml-auto">
            From our Eldoret hub to every corner of Kenya, ensuring your projects reach their destination on time.
          </p>
          <div className="flex flex-col gap-4 items-start md:items-end pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full border-2 border-white/20 bg-white/10 px-8 h-12 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 shadow-xl shadow-primary/10"
            >
              <Link href="/get-a-quote">Get a Free Quote →</Link>
            </Button>
            <Link
              href="/delivery"
              className="text-xs md:text-sm font-medium text-slate-500 hover:text-white transition-colors underline-offset-4 hover:underline pr-0 md:pr-4"
            >
              View Delivery Zones
            </Link>
          </div>
        </div>
      </div>

      {/* Re-adding BusinessStats at the bottom */}
      <div className="absolute bottom-12 left-0 right-0 z-30 pointer-events-none">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block pointer-events-auto">
            <BusinessStats variant="compact" />
          </div>
        </div>
      </div>
    </section>
  );
}
