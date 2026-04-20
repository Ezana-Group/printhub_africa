"use client";

import Link from "next/link";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { BusinessStats } from "@/components/stats/BusinessStats";

interface HeroProps {
  heroImage?: any;
  largeFormatEnabled?: boolean;
}

export function Hero({ heroImage, largeFormatEnabled = false }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      <WebGLShader />
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-10 px-4 md:px-6 lg:px-8 py-24 text-center">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
          {largeFormatEnabled ? "Large format & 3D printing" : "3D printing"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold max-w-4xl mx-auto leading-[1.1] text-white tracking-tight">
          Print Anything.
          <br />
          <span className="text-primary">Deliver Everywhere.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-xl mx-auto">
          {largeFormatEnabled
            ? "From Eldoret to all of Kenya — banners, signage, vehicle wraps, and custom 3D prints."
            : "From Eldoret to all of Kenya — custom 3D prints, prototypes, and production-ready parts."}
        </p>
        <div className="mt-10 flex flex-wrap gap-6 justify-center items-center">
          <ShinyButton
            onClick={() => window.location.href = "/shop"}
            className="min-w-[200px]"
          >
            Shop Now
          </ShinyButton>
          <ShinyButton
            asChild
            className="min-w-[200px]"
          >
            <Link href="/services">Explore Services</Link>
          </ShinyButton>
          <Link
            href="/get-a-quote"
            className="text-base font-semibold text-slate-300 hover:text-white transition-colors ml-2"
          >
            Get a Free Quote →
          </Link>
        </div>
        <BusinessStats variant="compact" />
      </div>
    </section>
  );
}
