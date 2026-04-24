import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AboutHero } from "./about-hero";
import { getBusinessPublic } from "@/lib/business-public";
import { getCachedPublicTeamMembers } from "@/lib/cache/unstable-cache";
import { getSiteImageSlots } from "@/lib/site-images";
import { prisma } from "@/lib/prisma";
import { getServiceFlags } from "@/lib/service-flags";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
export const revalidate = 3600; // 1 hour — about page changes rarely

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessPublic();
  const location = [business.city, business.country].filter(Boolean).join(", ") || "Kenya";
  const title = `About ${business.businessName} | Professional Printing in ${location}`;
  const description = `${business.businessName} is ${business.city ? `${business.city}'s` : "a"} professional 3D printing studio. Fast turnaround, premium materials, nationwide delivery.`;
  return {
    title,
    description,
    keywords: [
      "about PrintHub",
      "3D printing company Kenya",
      "3D printing Nairobi",
      "rapid prototyping team Kenya",
    ],
    openGraph: {
      title: `About ${business.businessName}`,
      description: description,
      images: ["/images/og/default-og.webp"],
    },
  };
}

export default async function AboutPage() {
  const [business, teamMembers, siteImages, { largeFormatEnabled }] = await Promise.all([
    getBusinessPublic(),
    getCachedPublicTeamMembers(),
    getSiteImageSlots(prisma),
    getServiceFlags(),
  ]);
  const whatsappDigits = (business.whatsapp ?? "").replace(/\D/g, "") || "254700000000";
  const whatsappHref = `https://wa.me/${whatsappDigits}`;
  const heroBgImage = siteImages.about_hero_background;
  return (
    <div className="bg-[#0A0A0A] text-white">
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-[100dvh] md:min-h-screen flex flex-col justify-center px-4 md:px-6 lg:px-8 pt-24 pb-16 md:pt-28 overflow-hidden">
        {/* Faded background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBgImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[#0A0A0A]/90" aria-hidden />
        </div>
        <div className="container relative z-10 max-w-6xl mx-auto w-full">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-6"
            style={{ letterSpacing: "0.2em" }}
          >
            EST. 2023 — {[business.city, business.country].filter(Boolean).join(", ").toUpperCase() || "KENYA"}
          </p>
          <h1 className="font-display font-extrabold text-[40px] md:text-[72px] leading-[1.1] text-white max-w-4xl">
            We Make Things
            <br />
            That Get Noticed.
          </h1>
          <p className="font-body text-base md:text-xl text-white/60 max-w-[560px] mt-6 leading-relaxed">
            {business.businessName} is {business.city ? `${business.city}'s` : "your"} professional 3D printing
            studio. From prototypes to architectural models, we bring ideas to
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
                We started with a single 3D printer in {business.city || "Kenya"} and a
                commitment to fast turnaround, honest pricing, and work that
                genuinely represents our clients&apos; brands.
              </p>
              <p>
                Today we operate across 3D printing and custom merchandise — serving everyone from solo entrepreneurs to
                government agencies and multinational brands.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] rounded overflow-hidden border-l-4 border-primary">
              <Image
                src={siteImages.about_story_image}
                alt="PrintHub production floor — Eldoret"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          </div>
        </div>
      </section>

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
                title: "3D Printing",
                subtitle: "",
                desc: "FDM and resin printing for prototypes, products, architecture, jewellery and engineering parts.",
                cta: "Explore service",
                href: "/services/3d-printing",
                image: siteImages.about_card_02,
              },
              {
                num: "02",
                title: "3D Printed",
                subtitle: "Merchandise",
                desc: "Ready-made and custom printed products shipped across Kenya.",
                cta: "Browse shop",
                href: "/shop",
                image: siteImages.about_card_03,
              },
              ...(largeFormatEnabled
                ? [{
                    num: "03",
                    title: "Large Format",
                    subtitle: "Printing",
                    desc: "Banners, vehicle wraps, signage, canvas, wallpaper and floor graphics. Any size. Any substrate.",
                    cta: "Explore service",
                    href: "/services/large-format-printing",
                    image: siteImages.about_card_01,
                  }]
                : []),
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
                body: `We deliver to all 47 counties. Same-day available in ${business.city || "major centres"}.`,
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

      {/* SECTION 4.5 — BUSINESS TRANSPARENCY */}
      <section className="bg-[#0F0F0F] py-16 md:py-20 px-4 md:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
              TRANSPARENCY & TRUST
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-6">
              Your Business, Our Commitment
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#1A1A1A] rounded-lg p-6 border border-slate-800">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">🏢</span>
                Business Information
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p><strong>Legal Name:</strong> {business.businessName}</p>
                <p><strong>Trading As:</strong> {business.tradingName}</p>
                <p><strong>Registration:</strong> {business.registrationInfo ?? "Registered Business in Kenya"}</p>
                <p><strong>Parent Company:</strong> {business.parentCompany ?? "Ezana Group"}</p>
                <p><strong>Founded:</strong> {business.foundingDate ? new Date(business.foundingDate).getFullYear() : 2023}</p>
                <p><strong>Headquarters:</strong> {business.city}, {business.country}</p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-6 border border-slate-800">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">📞</span>
                Contact & Support
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p><strong>Phone:</strong> {business.primaryPhone || "Available in business hours"}</p>
                <p><strong>Email:</strong> {business.primaryEmail}</p>
                <p><strong>WhatsApp:</strong> {business.whatsapp || "Available for urgent orders"}</p>
                <p><strong>Support Hours:</strong> {business.hoursWeekdays || business.businessHours || "Mon-Fri 8am-6pm EAT"}</p>
                <p><strong>Response Time:</strong> {business.supportResponseTime ?? "Within 2 hours during business hours"}</p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-6 border border-slate-800">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">🔒</span>
                Security & Compliance
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p><strong>SSL Encryption:</strong> 256-bit SSL certificate</p>
                <p><strong>Payment Security:</strong> PCI DSS compliant</p>
                <p><strong>Data Protection:</strong> GDPR compliant</p>
                <p><strong>Privacy Policy:</strong> Transparent data handling</p>
                <p><strong>Secure Payments:</strong> M-Pesa, cards, bank transfer</p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-6 border border-slate-800">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">⭐</span>
                Quality Assurance
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p><strong>Quality Rating:</strong> {business.qualityRating ?? "4.8/5 from 500+ customers"}</p>
                <p><strong>Quality Checks:</strong> {business.qualityChecks ?? "Every order inspected"}</p>
                <p><strong>Materials:</strong> {business.materialsInfo ?? "Premium, certified suppliers"}</p>
                <p><strong>Warranty:</strong> {business.warrantyInfo ?? "30-day satisfaction guarantee"}</p>
                <p><strong>Return Policy:</strong> {business.returnPolicyInfo ?? "Hassle-free returns"}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm mb-4">
              We believe in complete transparency. If you have any questions about our business practices, 
              pricing, or operations, please don&apos;t hesitate to contact us.
            </p>
            <a 
              href={`mailto:${business.primaryEmail}`}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 5 — TEAM (from admin-controlled staff) */}
      {teamMembers.length > 0 && (
        <section id="team" className="bg-[#0A0A0A] py-20 md:py-28 px-4 md:px-6 lg:px-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => {
                const displayName = member.publicName ?? member.name ?? "Team Member";
                const initials = displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "TM";
                return (
                  <div key={member.id} className="group text-center flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-4 relative bg-[#1A1A1A] border border-white/10 group-hover:border-primary/40 transition-colors">
                      {member.profilePhotoUrl ? (
                        <Image
                          src={member.profilePhotoUrl}
                          alt={displayName}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                          sizes="128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-display font-bold text-primary">
                            {initials}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="font-display text-base text-white">{displayName}</p>
                    <p className="font-body text-[13px] text-primary mt-1">
                      {member.publicRole ?? "PrintHub Team"}
                    </p>
                    {member.publicBio && (
                      <p className="font-body text-xs text-white/50 mt-2 leading-relaxed max-w-xs">
                        {member.publicBio}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6 — LOCATION (map + CTA; contact details are in footer) */}
      {business.googleMapsUrl && (
        <section className="relative bg-primary py-20 md:py-28 px-4 md:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={siteImages.about_location_background} alt="" fill className="object-cover opacity-20" sizes="100vw" />
          </div>
          <div className="container max-w-6xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-[48px] font-bold text-black leading-tight mb-4">
                  Come See Us in {business.city || "Kenya"}.
                </h2>
                <p className="font-body text-lg text-black/70 mb-6">
                  We&apos;re based in {[business.city, business.country].filter(Boolean).join(", ") || "Kenya"}. Walk-ins welcome during business hours.
                </p>
                {[business.address1, business.address2, business.city].filter(Boolean).length > 0 && (
                  <p className="text-black/80 text-base mb-8 font-medium">
                    {[business.address1, business.address2, business.city].filter(Boolean).join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/get-a-quote"
                    className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-5 py-3 font-medium hover:bg-black/90 transition-colors"
                  >
                    Get a Quote
                  </Link>
                  {business.whatsapp && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-5 py-3 font-medium hover:bg-black/90 transition-colors"
                    >
                      WhatsApp Us
                    </a>
                  )}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-video bg-black/10">
                <iframe
                  src={business.googleMapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 280 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location map"
                  className="w-full h-64 lg:h-80"
                />
              </div>
            </div>
          </div>
        </section>
      )}
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
  image,
}: {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  cta: string;
  href: string;
  image?: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-[#1A1A1A] border border-white/[0.07] rounded-lg overflow-hidden transition-all duration-400 hover:border-primary/40 hover:-translate-y-1 relative"
    >
      {image && (
        <div className="relative h-36 w-full overflow-hidden">
          <Image src={image} alt="" fill className="object-cover opacity-80 group-hover:opacity-90 transition-opacity" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
        </div>
      )}
      <div className="relative p-6 md:p-8">
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
      </div>
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
