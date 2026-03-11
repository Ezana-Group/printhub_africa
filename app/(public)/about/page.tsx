import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AboutHero } from "./about-hero";
import { getBusinessPublic } from "@/lib/business-public";

export const metadata: Metadata = {
  title: "About PrintHub | Professional Printing in Nairobi, Kenya",
  description:
    "PrintHub is Nairobi's professional large format and 3D printing studio. Fast turnaround, premium materials, nationwide delivery. An Ezana Group Company.",
  openGraph: {
    title: "About PrintHub",
    description:
      "Nairobi's professional printing studio. Large format, 3D printing, custom merchandise.",
    images: ["/og-about.jpg"],
  },
};

const STORY_IMAGE =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";

export default async function AboutPage() {
  const business = await getBusinessPublic();
  const whatsappDigits = (business.whatsapp ?? "").replace(/\D/g, "") || "254700000000";
  const whatsappHref = `https://wa.me/${whatsappDigits}`;
  return (
    <div className="bg-[#0A0A0A] text-white">
      {/* SECTION 1 — HERO */}
      <section className="min-h-[100dvh] md:min-h-screen flex flex-col justify-center px-4 md:px-6 lg:px-8 pt-24 pb-16 md:pt-28">
        <div className="container max-w-6xl mx-auto w-full">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-6"
            style={{ letterSpacing: "0.2em" }}
          >
            EST. 2023 — NAIROBI, KENYA
          </p>
          <h1 className="font-display font-extrabold text-[40px] md:text-[72px] leading-[1.1] text-white max-w-4xl">
            We Make Things
            <br />
            That Get Noticed.
          </h1>
          <p className="font-body text-base md:text-xl text-white/60 max-w-[560px] mt-6 leading-relaxed">
            PrintHub is Nairobi&apos;s professional large format and 3D printing
            studio. From vehicle wraps to architectural models, we bring ideas to
            life with precision and speed.
          </p>
          <AboutHero />
          <div className="mt-16 flex justify-center">
            <span className="animate-bounce inline-block text-white/50">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2 — OUR STORY */}
      <section className="bg-[#0A0A0A] py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto grid md:grid-cols-[60%_40%] gap-12 md:gap-16 items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
              OUR STORY
            </p>
            <h2 className="font-display text-3xl md:text-[48px] font-bold text-white leading-tight mb-6">
              Built for Makers.
              <br />
              Built for Kenya.
            </h2>
            <div className="font-body text-[17px] text-white/70 leading-[1.7] space-y-4">
              <p>
                PrintHub was founded with a simple belief: businesses in Kenya
                deserve the same quality of print production that global brands
                take for granted.
              </p>
              <p>
                We started with a single large format printer in Nairobi and a
                commitment to fast turnaround, honest pricing, and work that
                genuinely represents our clients&apos; brands.
              </p>
              <p>
                Today we operate across large format printing, 3D printing, and
                custom merchandise — serving everyone from solo entrepreneurs to
                government agencies and multinational brands.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] rounded overflow-hidden border-l-4 border-primary">
              <Image
                src={STORY_IMAGE}
                alt="PrintHub production floor — printer in action"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHAT WE DO */}
      <section className="bg-[#111111] py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            WHAT WE DO
          </p>
          <h2 className="font-display text-3xl md:text-[48px] font-bold text-white leading-tight mb-14">
            Three Ways We
            <br />
            Can Help You.
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                num: "01",
                title: "Large Format",
                subtitle: "Printing",
                desc: "Banners, vehicle wraps, signage, canvas, wallpaper and floor graphics. Any size. Any substrate.",
                cta: "Explore service",
                href: "/services/large-format",
              },
              {
                num: "02",
                title: "3D Printing",
                subtitle: "",
                desc: "FDM and resin printing for prototypes, products, architecture, jewellery and engineering parts.",
                cta: "Explore service",
                href: "/services/3d-printing",
              },
              {
                num: "03",
                title: "3D Printed",
                subtitle: "Merchandise",
                desc: "Ready-made and custom printed products shipped across Kenya.",
                cta: "Browse shop",
                href: "/shop",
              },
            ].map((card) => (
              <ServiceCard key={card.num} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY CHOOSE US */}
      <section className="bg-[#0A0A0A] py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            WHY PRINTHUB
          </p>
          <h2 className="font-display text-3xl md:text-[48px] font-bold text-white leading-tight mb-14">
            What Makes Us
            <br />
            Different.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                num: "01",
                title: "Same-Day Quotes",
                body: "Submit your brief and get a confirmed price within 2 business hours.",
              },
              {
                num: "02",
                title: "Kenyan-Owned & Operated",
                body: "We understand the local market, the suppliers, and what actually works here.",
              },
              {
                num: "03",
                title: "Premium Materials Only",
                body: "We don't cut corners on substrate quality. Your brand deserves the best.",
              },
              {
                num: "04",
                title: "Nationwide Delivery",
                body: "We deliver to all 47 counties. Same-day available in Nairobi.",
              },
              {
                num: "05",
                title: "Transparent Pricing",
                body: "No hidden fees. KES pricing. M-Pesa accepted. You see the full cost before you commit.",
              },
              {
                num: "06",
                title: "Expert Team",
                body: "Every job is reviewed by an experienced print technician before it goes to press.",
              },
            ].map((item) => (
              <div
                key={item.num}
                className="group pl-4 border-l-2 border-transparent hover:border-primary transition-colors duration-300"
              >
                <span className="font-mono text-primary text-sm">{item.num}</span>
                <h3 className="font-display text-xl text-white mt-1">
                  {item.title}
                </h3>
                <p className="font-body text-[15px] text-white/60 mt-2">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — EZANA GROUP */}
      <section className="bg-[#111111] py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="container max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            PART OF SOMETHING BIGGER
          </p>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-white leading-tight mb-6">
            An Ezana Group
            <br />
            Company.
          </h2>
          <p className="font-body text-[17px] text-white/70 leading-relaxed mb-8">
            PrintHub is a proud member of the Ezana Group — a Kenyan business
            group building companies that create real value across East Africa.
          </p>
          <div className="h-16 bg-white/5 rounded-lg flex items-center justify-center mb-6">
            <span className="font-display font-bold text-white/60 text-lg">
              Ezana Group
            </span>
          </div>
          <a
            href="https://ezanagroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            ezanagroup.com →
          </a>
          <p className="font-body text-[15px] text-white/60 mt-6">
            The Ezana Group ethos: build businesses that last, create
            employment, and raise the standard of what&apos;s possible in Kenya.
          </p>
        </div>
      </section>

      {/* SECTION 6 — TEAM (placeholder) */}
      <section className="bg-[#0A0A0A] py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            THE TEAM
          </p>
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-white leading-tight mb-4">
            The People Behind
            <br />
            the Prints.
          </h2>
          <p className="font-body text-base text-white/60 max-w-xl mb-12">
            Our team of print technicians, designers, and customer service
            specialists are dedicated to making your project a success.
          </p>
          {/* TODO: Replace with real team photos — can be updated from Admin → Settings → Team Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { name: "Team Member", role: "Leadership", initials: "TM" },
              { name: "Team Member", role: "Production", initials: "TM" },
              { name: "Team Member", role: "Customer Success", initials: "TM" },
            ].map((member) => (
              <div
                key={member.role}
                className="group text-center"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-3xl font-display font-bold text-primary group-hover:border-primary/40 transition-colors">
                  {member.initials}
                </div>
                <p className="font-display text-base text-white mt-4">
                  {member.name}
                </p>
                <p className="font-body text-[13px] text-primary">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — LOCATION & CONTACT CTA */}
      <section className="bg-primary py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-[48px] font-bold text-black leading-tight mb-4">
            Come See Us in
            <br />
            Nairobi.
          </h2>
          <p className="font-body text-lg text-black/70 mb-12">
            We&apos;re based in Nairobi, Kenya. Walk-ins welcome during business
            hours.
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4 font-body text-black/90">
              <p className="flex items-center gap-2">
                <span aria-hidden>📍</span> {[business.city, business.country].filter(Boolean).join(", ") || "Nairobi, Kenya"}
              </p>
              {business.primaryPhone && (
                <p className="flex items-center gap-2">
                  <span aria-hidden>📞</span> {business.primaryPhone}
                </p>
              )}
              <p className="flex items-center gap-2">
                <span aria-hidden>✉</span> {business.primaryEmail}
              </p>
              <p className="flex items-center gap-2">
                <span aria-hidden>🕐</span> {business.businessHours}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="/get-a-quote"
                  className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-5 py-3 font-medium hover:bg-black/90 transition-colors"
                >
                  📋 Get a Quote
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-5 py-3 font-medium hover:bg-black/90 transition-colors"
                >
                  💬 WhatsApp Us
                </a>
              </div>
            </div>
            <div className="aspect-video bg-black/10 rounded-lg flex items-center justify-center">
              <span className="text-black/50 font-body text-sm">
                Map placeholder
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({
  num,
  title,
  subtitle,
  desc,
  cta,
  href,
}: {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-[#1A1A1A] border border-white/[0.07] rounded-lg p-6 md:p-8 transition-all duration-400 hover:border-primary/40 hover:-translate-y-1 relative overflow-hidden"
    >
      <span
        className="absolute top-4 right-4 font-display text-[80px] font-bold text-white/[0.08] leading-none"
        aria-hidden
      >
        {num}
      </span>
      <div className="relative">
        <div className="w-10 h-10 mb-4 flex items-center justify-center">
          <PrinterIcon className="w-8 h-8 text-white/80" />
        </div>
        <span className="font-mono text-primary text-sm">{num}</span>
        <h3 className="font-display text-xl md:text-2xl font-bold text-white mt-1">
          {title}
          {subtitle && (
            <>
              <br />
              {subtitle}
            </>
          )}
        </h3>
        <p className="font-body text-[15px] text-white/60 mt-3">{desc}</p>
        <span className="inline-block mt-4 text-primary font-medium text-sm group-hover:underline">
          {cta} →
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-400" />
    </Link>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}
