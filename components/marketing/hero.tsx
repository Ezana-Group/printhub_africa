"use client";

import Link from "next/link";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { ShinyButton } from "@/components/ui/shiny-button";
import { BusinessStats } from "@/components/stats/BusinessStats";

interface HeroProps {
  heroImage?: unknown;
  largeFormatEnabled?: boolean;
}

export function Hero({ heroImage: _heroImage, largeFormatEnabled = false }: HeroProps) {
  void _heroImage;
  return (
    <section className="relative min-h-[68vh] flex items-center justify-center overflow-hidden bg-black">
      <WebGLShader />
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-10 px-4 md:px-6 lg:px-8 py-16 md:py-20 text-center">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
          {largeFormatEnabled ? "Large format & 3D printing" : "3D printing"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold max-w-4xl mx-auto leading-[1.1] text-white tracking-tight">
          Shop 3D Prints.
          <br />
          <span className="text-primary">Or Upload Your Model.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-xl mx-auto">
          {largeFormatEnabled
            ? "From Eldoret to all of Kenya — banners, signage, vehicle wraps, and custom 3D prints."
            : "Buy ready-made 3D products or request custom 3D printing for prototypes and parts. Delivered across Kenya."}
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
          <ShinyButton
            onClick={() => window.location.href = "/shop"}
            className="min-w-[200px]"
          >
            Shop 3D Products
          </ShinyButton>
          <ShinyButton
            asChild
            className="min-w-[200px]"
          >
            <Link href="/get-a-quote">Upload STL / Get Quote</Link>
          </ShinyButton>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs md:text-sm">
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200">
            Nationwide delivery
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200">
            M-Pesa / Card / Bank transfer
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-slate-200">
            Fast custom quotes
          </span>
        </div>
        <BusinessStats variant="compact" />
      </div>
    </section>
  );
}
