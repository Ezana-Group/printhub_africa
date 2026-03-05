import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
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
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 text-base font-semibold shadow-xl shadow-primary/30"
          >
            <Link href="/shop">Shop Now</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-2xl px-8 h-12 text-base font-semibold border-2 border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/80"
          >
            <Link href="/get-a-quote">Get a Quote</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-2xl px-8 h-12 text-base text-slate-300 hover:text-white hover:bg-white/5"
          >
            <Link href="/get-a-quote">Get a Free Quote</Link>
          </Button>
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
