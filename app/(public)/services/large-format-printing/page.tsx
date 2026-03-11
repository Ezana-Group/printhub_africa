import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ServiceHero,
  SectionLabel,
  StatBar,
  FaqAccordion,
  ServiceCTA,
  SectionReveal,
} from "@/components/services";
import { LargeFormatServiceGrid } from "@/components/services/LargeFormatServiceGrid";
import { Button } from "@/components/ui/button";
import { getBusinessPublic } from "@/lib/business-public";

// Theme-appropriate: large format / print shop / signage (dark + orange brand)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85&auto=format";
const CAPABILITIES_IMAGE =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85&auto=format";
const APPLICATIONS_IMAGE_1 =
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85&auto=format";
const APPLICATIONS_IMAGE_2 =
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=85&auto=format";

const SERVICE_CARDS = [
  {
    icon: "📌",
    title: "Vinyl Banners & Flex Banners",
    description:
      "Indoor and outdoor banners for events, promotions, and storefronts. Available in standard and heavy-duty flex material.",
    specs: "Custom | Max width: 5m",
    detail:
      "We print on calendared vinyl (standard) or heavy-duty flex for long-term outdoor use. Single or double-sided, with hemming and eyelets or pole pockets. Ideal for shop fronts, events, and promotions across Kenya.",
  },
  {
    icon: "🏙️",
    title: "Billboard & Hoarding Printing",
    description:
      "High-impact billboard graphics for outdoor advertising. Printed on premium billboard vinyl with UV-resistant inks that last 3–5 years outdoors.",
    specs: "Custom (any billboard format)",
    detail:
      "Large-format billboard and hoarding prints for construction sites, highways, and high-traffic areas. UV-resistant inks and durable vinyl ensure your message stays sharp for years. We handle design, print, and installation coordination.",
  },
  {
    icon: "🚗",
    title: "Vehicle Wraps & Fleet Branding",
    description:
      "Full and partial vehicle wraps for cars, vans, trucks, matatus, and buses. Turn your fleet into a moving billboard across Kenya.",
    specs: "Materials: Cast vinyl, air-release adhesive",
    detail:
      "Full wraps, partial wraps, or simple decals — we use cast vinyl with air-release adhesive for a bubble-free finish that conforms to curves. Perfect for matatus, delivery fleets, and corporate vehicles. Design and install support available.",
  },
  {
    icon: "📸",
    title: "Event Backdrops & Photo Walls",
    description:
      "Branded event backdrops, step-and-repeat walls, and photo booth backgrounds. Perfect for press events, product launches, and weddings.",
    specs: "Fabric or vinyl | Grommets or pole pocket",
    detail:
      "Step-and-repeat walls, branded backdrops, and photo booth setups for conferences, launches, and weddings. We offer fabric (with pole pockets) or vinyl (with grommets). Fast turnaround for last-minute events.",
  },
  {
    icon: "🖼️",
    title: "Canvas Prints & Wall Art",
    description:
      "Gallery-quality canvas prints for homes, hotels, offices, and hospitality spaces. Available with or without stretcher frame.",
    specs: "380gsm poly-cotton canvas",
    detail:
      "Archival-quality prints on 380gsm poly-cotton canvas. Choose flat (for framing) or gallery-wrapped on a wooden stretcher frame. Ideal for art reproduction, hotel décor, and corporate walls.",
  },
  {
    icon: "📜",
    title: "Roll-Up & Pull-Up Banners",
    description:
      "Portable, retractable rollup banners ideal for exhibitions, trade shows, reception areas, and retail displays.",
    specs: "Standard: 85cm × 200cm or custom",
    detail:
      "Retractable roll-up and pull-up banners with carry case. Standard size 85cm × 200cm or custom to fit your stand. One-person setup, professional look. Popular for trade shows and reception areas.",
  },
  {
    icon: "🌐",
    title: "Mesh Banners",
    description:
      "Wind-resistant perforated mesh for scaffolding, construction hoardings, and outdoor fences. Allows airflow — perfect for windy Nairobi conditions.",
    specs: "Max width: 5m",
    detail:
      "Perforated mesh reduces wind load by up to 50%, so it’s safe for scaffolding and tall hoardings. Lets light and air through while keeping your branding visible. Ideal for construction sites and outdoor events.",
  },
  {
    icon: "🪟",
    title: "Window & Glass Graphics",
    description:
      "Frosted vinyl, one-way vision, full-colour window graphics and manifestations for retail, office, and hospitality.",
    specs: "Removable or permanent",
    detail:
      "Frosted vinyl for privacy, one-way vision for shop fronts, or full-colour graphics for promotions. Removable for short-term campaigns or permanent for long-term branding. We can match your design or provide templates.",
  },
  {
    icon: "👣",
    title: "Floor Graphics",
    description:
      "Anti-slip floor vinyl for retail stores, exhibitions, hospitals, and events. Highly durable with a textured laminate finish.",
    specs: "Slip-resistance compliant",
    detail:
      "Textured, anti-slip laminate makes our floor graphics safe for high-traffic areas. Use for wayfinding, promotions, or branding in retail, exhibitions, and events. Compliant with slip-resistance standards.",
  },
  {
    icon: "🏛️",
    title: "Wallpapers & Wall Murals",
    description:
      "Custom printed wallpapers and full-wall murals for offices, restaurants, hotels, and residential spaces.",
    specs: "Non-woven — easy to install and remove",
    detail:
      "Non-woven wallpaper is easy to hang and remove without damaging walls. Full-wall murals or repeating patterns for offices, restaurants, hotels, and homes. Design from your artwork or we can help with layout.",
  },
  {
    icon: "🪧",
    title: "Foam Board & Corflute Signs",
    description:
      "Rigid display boards for indoor signage, estate agent boards, exhibitions, and retail POS.",
    specs: "3mm/5mm foam board, 4mm/6mm corflute",
    detail:
      "Foam board (3mm or 5mm) for indoor signs and POS. Corflute (4mm or 6mm) for outdoor estate boards, A-boards, and exhibition signs. Lightweight, rigid, and weather-resistant where needed.",
  },
  {
    icon: "🎪",
    title: "Fabric & Textile Printing",
    description:
      "Dye-sublimation printing on fabric for exhibition stands, table throws, flags, and branded apparel.",
    specs: "Vibrant colours, lightweight, washable",
    detail:
      "Dye-sublimation embeds colour in the fabric for vibrant, washable prints. Perfect for exhibition stands, table throws, flags, and soft signage. Lightweight and easy to transport and reuse.",
  },
];

const LARGE_FORMAT_MATERIALS = [
  {
    title: "Outdoor Vinyl (Calendared)",
    imageSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format",
    imageAlt: "Outdoor vinyl banner material",
    description:
      "Best for outdoor banners, building signage, short-to-medium term applications. UV and water resistant. Cost-effective for large runs.",
    specs: [
      { label: "Durability", value: "2–3 years outdoor" },
      { label: "Thickness", value: "80–100 microns" },
      { label: "Finish", value: "Gloss or matte" },
    ],
  },
  {
    title: "Cast Vinyl (Premium Outdoor)",
    imageSrc: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80&auto=format",
    imageAlt: "Cast vinyl for vehicle wraps",
    description:
      "Best for vehicle wraps, curved surfaces, long-term outdoor signage. Conforms to complex curves without lifting or wrinkling.",
    specs: [
      { label: "Durability", value: "5–7 years outdoor" },
      { label: "Thickness", value: "60–80 microns" },
      { label: "Finish", value: "Gloss, matte, satin, brushed metal" },
    ],
  },
  {
    title: "Backlit Film",
    imageSrc: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80&auto=format",
    imageAlt: "Backlit film for lightboxes",
    description:
      "Best for lightboxes, illuminated signage, airport displays, retail. Produces vivid, saturated colours when backlit.",
    specs: [
      { label: "Durability", value: "3–5 years indoor, 1–2 years outdoor" },
      { label: "Thickness", value: "175 microns" },
      { label: "Finish", value: "Translucent" },
    ],
  },
  {
    title: "Canvas",
    imageSrc: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80&auto=format",
    imageAlt: "Gallery-quality canvas print",
    description:
      "Best for art reproduction, wall décor, hotel/restaurant branding, gifts. Available with gallery wrap stretcher frame or flat for framing.",
    specs: [
      { label: "Durability", value: "75+ years indoor (unvarnished)" },
      { label: "Weight", value: "380 gsm poly-cotton blend" },
      { label: "Finish", value: "Matte (archival quality)" },
    ],
  },
  {
    title: "Mesh Banner",
    imageSrc: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80&auto=format",
    imageAlt: "Mesh banner for construction",
    description:
      "Best for construction hoardings, scaffolding, outdoor fencing, sports events. Ideal for high-wind locations. Reduces structural load by 50%.",
    specs: [
      { label: "Durability", value: "3–5 years outdoor" },
      { label: "Density", value: "280 gsm woven polyester mesh" },
      { label: "Perforation", value: "50% open area" },
    ],
  },
  {
    title: "Fabric / Dye-Sub Textile",
    imageSrc: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80&auto=format",
    imageAlt: "Dye-sublimation fabric printing",
    description:
      "Best for exhibition stands, event backdrops, hospitality, table throws, flags. Lightweight, washable, reusable. Colours embedded in fibres.",
    specs: [
      { label: "Durability", value: "Washable, reusable" },
      { label: "Weight", value: "110–200 gsm polyester" },
    ],
  },
];

const APPLICATIONS = [
  {
    number: "01",
    title: "RETAIL & HOSPITALITY",
    copy: "Window graphics, wall murals, floor graphics, menu boards, and POS displays that turn a shopfront into an experience.",
  },
  {
    number: "02",
    title: "EVENTS & EXHIBITIONS",
    copy: "Backdrops, stage banners, pull-up stands, table throws, directional signage, and branded environments. We've printed for concerts, conferences, and Nairobi Fashion Week.",
  },
  {
    number: "03",
    title: "REAL ESTATE & CONSTRUCTION",
    copy: "Site hoardings, estate agent boards, development banners, and property marketing material at any scale.",
  },
  {
    number: "04",
    title: "CORPORATE BRANDING",
    copy: "Office wall murals, reception signage, branded meeting rooms, vehicle fleet wraps, and wayfinding systems.",
  },
  {
    number: "05",
    title: "ADVERTISING AGENCIES & DESIGNERS",
    copy: "We're the print partner behind some of Nairobi's leading agencies. We take your artwork and bring it to life — exactly as designed.",
  },
  {
    number: "06",
    title: "GOVERNMENT & INSTITUTIONS",
    copy: "Compliance signage, campaign material, informational banners, and public-space graphics for counties, NGOs, and parastatals.",
  },
  {
    number: "07",
    title: "HOSPITALITY & TOURISM",
    copy: "Hotel wall art, restaurant décor, pool and spa signage, safari camp branding, and destination marketing.",
  },
  {
    number: "08",
    title: "SMEs & STARTUPS",
    copy: "You don't need a big budget to make a big impression. We work with businesses of all sizes — minimum order from KES 500.",
  },
];

const TURNAROUND_CARDS = [
  {
    icon: "🕐",
    title: "STANDARD",
    turnaround: "3–5 Business Days",
    modifier: "No surcharge",
    bestFor: "Planned campaigns, advance orders",
    details: [
      "Order confirmed by 5pm",
      "Production begins next morning",
      "Quality check before dispatch",
      "Notification when ready for collection or dispatch",
    ],
  },
  {
    icon: "⚡",
    title: "EXPRESS",
    turnaround: "24–48 Hours",
    modifier: "+30% surcharge",
    bestFor: "Urgent events, last-minute campaigns",
    details: [
      "Order & approve artwork by 10am",
      "Production begins same day",
      "Available Mon–Fri (not public holidays)",
      "Subject to machine capacity — confirm with team",
    ],
  },
  {
    icon: "🔥",
    title: "SAME DAY",
    subtitle: "Limited",
    turnaround: "By 5pm same day",
    modifier: "+60% surcharge",
    bestFor: "Emergencies only",
    details: [
      "Order & final artwork by 8am sharp",
      "Very limited slots — call to confirm availability",
      "Nairobi collection/delivery only",
      "+254 XXX XXX XXX (call, don't WhatsApp for this)",
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: "What is the largest size you can print?",
    answer:
      "Our wide-format printers have a maximum single-pass width of 3.2 metres. For lengths, we can print to any length on a roll — there's no limit. For widths exceeding 3.2m (e.g. large building wraps), we print in panels and provide joining guides. Our team has executed prints up to 50 metres wide using this panelling method.",
  },
  {
    question: "Can you match a specific Pantone colour?",
    answer:
      "We print in CMYK, which covers around 70% of the Pantone colour gamut. We can match most Pantone colours closely — provide your Pantone reference number in your brief and we will do a colour proof before printing your full job. For exact Pantone matching, ask about spot colour printing.",
  },
  {
    question: "Do you offer design services?",
    answer:
      "Yes. Our in-house design team can create artwork from scratch or adapt your existing branding. Design fees start from KES 500 for minor adjustments and KES 1,500+ for custom designs. Turnaround for design work is 1–2 business days. Share your brief via the quote form and we will include design in your quote.",
  },
  {
    question: "What if I'm not happy with the print quality?",
    answer:
      "We stand behind every print we produce. If a job has a defect caused by our printing process, we will reprint it at no charge. We send a digital proof for approval before printing — once approved, the job is printed exactly as shown. Note: We cannot accept returns for custom prints where the customer provided and approved the artwork.",
  },
  {
    question: "Can I get a physical sample or proof before my full order?",
    answer:
      "Yes, for orders over KES 10,000 we can produce a printed test strip or A3 colour proof on the same material as your job. This is charged at KES 500 and deducted from your final order if you proceed. For small orders, we provide a digital soft-proof (PDF) for free.",
  },
  {
    question: "Do you install the prints?",
    answer:
      "We offer installation services for Nairobi-based jobs. Vehicle wrap installation is included in the wrap price. For banners, signage, and wall graphics, installation is quoted separately based on size and location. Contact us to discuss your installation needs.",
  },
  {
    question: "How do I send my files?",
    answer:
      "Upload directly on our website at printhub.africa/upload. For files over 500MB, we share a WeTransfer or Google Drive link on request. WhatsApp (for smaller files) is also accepted for urgent jobs.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "M-Pesa (Lipa Na M-Pesa — our preferred method), Visa/Mastercard, bank transfer, and Pesapal. Corporate accounts can apply for NET-30 terms. Full payment is required before production begins for new customers. Repeat corporate clients may be invoiced post-delivery.",
  },
  {
    question: "Can you print on materials I supply?",
    answer:
      "In some cases yes — contact us to discuss. We generally print on our own certified substrates to guarantee ink adhesion and quality. Customer-supplied materials must be pre-approved by our team before acceptance.",
  },
  {
    question: "Do your inks fade in the Kenyan sun?",
    answer:
      "We use eco-solvent and UV-curable inks specifically rated for tropical outdoor conditions. Outdoor prints on quality vinyl with lamination are rated for 3–5 years in direct sunlight. For maximum longevity, we recommend UV-laminated finishes on all outdoor prints.",
  },
  {
    question: "What's your minimum order?",
    answer:
      "Our minimum order value is KES 500. There is no minimum size — we can print from A4 upwards. However, the minimum chargeable area is 0.5 sqm even if your actual print is smaller.",
  },
  {
    question: "Do you offer bulk discounts?",
    answer:
      "Yes. Volume discounts apply from 2 pieces upward: 2–4 units: 5% off | 5–9 units: 10% off | 10–19 units: 15% off | 20–49 units: 20% off | 50+ units: up to 25% off. Discounts apply to the base print cost. Contact us for a tailored quote on large runs.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessPublic();
  const city = business.city || "Kenya";
  const name = business.businessName;
  return {
    title: `Large Format Printing ${city} | Banners, Wraps & Signage | ${name}`,
    description: `Professional large format printing in ${city}. Banners, vehicle wraps, billboards, canvas prints & more. Fast turnaround. Nationwide delivery across Kenya. ${name}.`,
    openGraph: {
      title: `Large Format Printing ${city} | ${name}`,
      description: `Banners, vehicle wraps, billboards, canvas. Fast turnaround. Nationwide delivery. ${name}.`,
      url: "/services/large-format-printing",
    },
    alternates: { canonical: "/services/large-format-printing" },
  };
}

export default async function LargeFormatPrintingPage() {
  const business = await getBusinessPublic();
  const baseUrl = business.website.startsWith("http") ? business.website : `https://${business.website}`;
  return (
    <main id="main-content" className="bg-[var(--brand-black)]">
      <nav aria-label="Breadcrumb" className="border-b border-white/10 bg-[var(--surface-dark)] px-6 py-3 md:px-12">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-white/60 font-body">
          <li><Link href="/" className="hover:text-[var(--brand-orange)]">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/services" className="hover:text-[var(--brand-orange)]">Services</Link></li>
          <li aria-hidden>/</li>
          <li className="text-white" aria-current="page">Large Format Printing</li>
        </ol>
      </nav>
      <ServiceHero
        label={`LARGE FORMAT PRINTING — ${[business.city, business.country].filter(Boolean).join(", ").toUpperCase() || "KENYA"}`}
        title={
          <>
            Big Ideas.
            <br />
            Bigger Prints.
          </>
        }
        subtitle={`From a single rollup banner to a full building wrap — ${business.businessName} delivers large format prints that command attention. Professional quality, fast turnaround, delivered across Kenya.`}
        imageSrc={HERO_IMAGE}
        imageAlt={`Creative design and large format print output at ${business.businessName} ${business.city || ""}`.trim()}
        ctaPrimary="Get a Free Quote →"
        ctaPrimaryHref="/get-a-quote"
        ctaSecondary="See Our Work ↓"
        ctaSecondaryHref="#what-we-print"
        trustBadge="✓ Same-day quotes  ·  ✓ 48hr turnaround available  ·  ✓ Nationwide delivery"
      />

      {/* Section 2 — What We Print */}
      <SectionReveal id="what-we-print" className="bg-[var(--surface-dark)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>01 — WHAT WE PRINT</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--brand-white)] leading-tight">
            Every Surface.
            <br />
            Every Size.
            <br />
            Every Brief.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            Whether you&apos;re launching a product, branding a vehicle, dressing an event, or putting your business on the map — we print it. Our wide-format printers handle everything from A1 posters to 50-metre building wraps, on whatever surface your project demands.
          </p>
          <div className="mt-16">
            <LargeFormatServiceGrid cards={SERVICE_CARDS} />
          </div>
        </div>
      </SectionReveal>

      {/* Section 3 — Quality & Capabilities */}
      <SectionReveal className="bg-[var(--surface-dark)] py-16 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <StatBar
            stats={[
              { value: 1200, label: "DPI", sublabel: "Print resolution" },
              { value: 3.2, decimals: 1, suffix: "m", label: "Max Width", sublabel: "Single-pass width" },
              { value: 48, label: "Hours", sublabel: "Express turnaround available" },
              { value: 47, label: "Counties", sublabel: "Delivered nationwide" },
            ]}
          />
          <div className="grid md:grid-cols-2 gap-16 items-center pt-12">
            <div>
              <SectionLabel>02 — OUR CAPABILITIES</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
                Precision at
                <br />
                Every Scale.
              </h2>
              <p className="mt-6 text-white/70 leading-relaxed">
                Our {business.city || "Kenya"} print facility runs Roland and Mimaki wide-format printers — the same equipment used by top print houses across Africa. We print at up to 1,200 DPI resolution, ensuring photographic-quality output even on the largest formats.
              </p>
              <p className="mt-4 text-white/70 leading-relaxed">
                Every job is colour-calibrated using ICC profiles, so what you see on screen is what you get in print. We use eco-solvent and UV-curable inks that are weather-resistant, fade-resistant, and safe for indoor environments.
              </p>
              <ul className="mt-8 space-y-2 font-mono text-sm text-white/60 border-l-2 border-[var(--brand-orange)] pl-4">
                <li>→ Max single-pass width: 3.2 metres</li>
                <li>→ Max print length: unlimited (roll)</li>
                <li>→ Resolution: up to 1,200 × 1,200 DPI</li>
                <li>→ Colour system: CMYK + spot colour matching</li>
                <li>→ Ink type: Eco-solvent (outdoor) / Latex (indoor-safe)</li>
                <li>→ Colour profile: ICC-calibrated per substrate</li>
                <li>→ File formats: PDF, AI, PSD, EPS, PNG (300dpi+), SVG</li>
              </ul>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={CAPABILITIES_IMAGE}
                alt={`${business.businessName} wide-format printer producing a high-resolution banner in ${business.city || "Kenya"}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Section 4 — Materials */}
      <SectionReveal className="bg-[var(--brand-white)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <SectionLabel className="text-[var(--brand-orange)]">03 — MATERIALS & SUBSTRATES</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-black)] leading-tight">
            The Right Material
            <br />
            for Every Job.
          </h2>
          <p className="mt-6 max-w-2xl text-[var(--text-secondary)]">
            Not all prints are created equal. Choosing the right substrate makes the difference between a print that fades in three months and one that lasts three years. Our team will always recommend the best material for your specific application, environment, and budget.
          </p>
          <div className="mt-16 space-y-8">
            {LARGE_FORMAT_MATERIALS.map((mat) => (
              <div
                key={mat.title}
                className="flex flex-col md:flex-row rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <div className="relative h-48 md:w-64 shrink-0 bg-slate-100">
                  <Image
                    src={mat.imageSrc}
                    alt={mat.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 256px"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 flex-1">
                  <h3 className="font-display text-xl font-bold text-[var(--brand-black)]">
                    {mat.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {mat.description}
                  </p>
                  <ul className="mt-4 space-y-1 font-mono text-xs text-[var(--text-secondary)]">
                    {mat.specs.map((row, i) => (
                      <li key={i}>
                        <span className="text-slate-400">{row.label}:</span> {row.value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Section 5 — Applications */}
      <SectionReveal className="bg-[var(--surface-dark)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image
                src={APPLICATIONS_IMAGE_1}
                alt="Canvas and wall art large format printing for retail and hospitality"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-[70%] aspect-[4/3] rounded-2xl overflow-hidden border-4 border-[var(--surface-dark)] shadow-2xl">
              <Image
                src={APPLICATIONS_IMAGE_2}
                alt="Corporate and event branding — who we print for"
                fill
                sizes="(max-width: 768px) 80vw, 35vw"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <SectionLabel>04 — WHO WE PRINT FOR</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
              Built for Business.
              <br />
              Designed for Impact.
            </h2>
            <ul className="mt-12 space-y-8">
              {APPLICATIONS.map((app) => (
                <li key={app.number}>
                  <span className="font-mono text-sm text-[var(--brand-orange)]">{app.number}</span>
                  <h3 className="font-display text-lg font-bold text-[var(--brand-white)] mt-1">
                    {app.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">{app.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionReveal>

      {/* Section 6 — File Preparation */}
      <SectionReveal className="bg-[var(--brand-white)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <SectionLabel className="text-[var(--brand-orange)]">05 — FILE PREPARATION</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-black)] leading-tight">
              Set Up Your Files.
              <br />
              Print-Ready, Every Time.
            </h2>
            <p className="mt-6 text-[var(--text-secondary)]">
              Sending us the right file means faster turnaround and the sharpest possible result. Follow these guidelines and your job goes straight to print — no back-and-forth.
            </p>
            <div className="mt-10 space-y-8">
              <div>
                <h4 className="font-display font-bold text-[var(--brand-black)]">Step 1: Resolution</h4>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Set your artwork to 100–150 DPI at actual print size. For files designed at actual size: minimum 100 DPI. For billboard/large hoardings: 25–72 DPI is acceptable at actual size.
                </p>
              </div>
              <div>
                <h4 className="font-display font-bold text-[var(--brand-black)]">Step 2: Colour Mode</h4>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Work in CMYK colour mode, not RGB. If you have Pantone/spot colours, note them in your brief.
                </p>
              </div>
              <div>
                <h4 className="font-display font-bold text-[var(--brand-black)]">Step 3: Bleed & Safe Zone</h4>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Add 5mm bleed on all edges (10mm for large banners). Keep all critical content 10mm inside the trim edge.
                </p>
              </div>
              <div>
                <h4 className="font-display font-bold text-[var(--brand-black)]">Step 4: File Formats</h4>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  ✓ PDF, AI, PSD, EPS, PNG (300dpi at size). ✗ JPG only if high quality. Word/PowerPoint not accepted.
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left p-4 font-display font-semibold text-[var(--brand-black)]">
                      Quick specs
                    </th>
                    <th className="text-left p-4 font-display font-semibold text-[var(--brand-black)]" />
                  </tr>
                </thead>
                <tbody className="text-[var(--text-secondary)]">
                  {[
                    ["Colour mode", "CMYK (preferred) or RGB"],
                    ["Resolution", "100–150 DPI at actual print size"],
                    ["Bleed", "5mm (small) / 10mm (large format)"],
                    ["Safe zone", "10mm inside trim on all sides"],
                    ["Max file size", "500MB per file"],
                    ["Preferred formats", "PDF, AI, PSD, EPS, PNG"],
                    ["Colour matching", "Pantone (note in brief)"],
                    ["Font handling", "Outline all fonts before sending"],
                  ].map(([k, v], i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="p-4 font-mono text-xs">{k}</td>
                      <td className="p-4">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-xl font-mono text-xs" size="sm">
                <Link href="/templates/rollup-banner.ai" download target="_blank" rel="noopener">
                  ↓ Rollup Banner Template (AI)
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-mono text-xs" size="sm">
                <Link href="/templates/aframe.ai" download target="_blank" rel="noopener">
                  ↓ A-Frame Template (AI)
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-mono text-xs" size="sm">
                <Link href="/templates/backdrop.ai" download target="_blank" rel="noopener">
                  ↓ Backdrop Template (AI)
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-mono text-xs" size="sm">
                <Link href="/templates/vehicle-wrap-guide.pdf" download target="_blank" rel="noopener">
                  ↓ Vehicle Wrap Guide (PDF)
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Section 7 — Turnaround & Delivery */}
      <SectionReveal className="bg-[var(--surface-dark)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>06 — TURNAROUND & DELIVERY</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
            Fast When You Need It.
            <br />
            Reliable Always.
          </h2>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {TURNAROUND_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-[var(--surface-card)] p-8"
              >
                <span className="text-3xl" aria-hidden>{card.icon}</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <h3 className="font-display text-xl font-bold text-[var(--brand-white)]">
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <span className="text-xs font-mono text-amber-400">⚠ Limited</span>
                  )}
                </div>
                <p className="mt-2 font-mono text-[var(--brand-orange)]">{card.turnaround}</p>
                <p className="mt-1 text-sm text-white/60">Price: {card.modifier}</p>
                <p className="mt-2 text-sm text-white/80">Best for: {card.bestFor}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/60">
                  {card.details.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-20 max-w-3xl">
            <h3 className="font-display text-2xl font-bold text-[var(--brand-white)]">
              We Deliver Across Kenya.
            </h3>
            <p className="mt-4 text-white/70 leading-relaxed">
              PrintHub delivers to all 47 counties via our courier partners. Nairobi deliveries are handled by our own drivers. Bulky or fragile prints are packaged in protective cardboard.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/70 font-mono">
              <li>→ Nairobi CBD / Westlands / Industrial Area — Same day or next day from KES 200</li>
              <li>→ Greater Nairobi — 1–2 days from KES 400</li>
              <li>→ Major towns (Mombasa, Kisumu, Nakuru, Eldoret) — 2–3 days from KES 600</li>
              <li>→ All other counties — 3–5 days (rates at checkout)</li>
              <li>→ Collection from our Nairobi facility — FREE</li>
            </ul>
            <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
              Large format prints (banners over 1m, vehicle wraps, etc.) require special packaging. Our team will contact you to arrange appropriate delivery for oversized items.
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Section 8 — FAQ */}
      <SectionReveal className="bg-[var(--brand-white)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <SectionLabel className="text-[var(--brand-orange)]">07 — FREQUENTLY ASKED QUESTIONS</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-black)] leading-tight">
            Everything You Need
            <br />
            to Know.
          </h2>
          <div className="mt-12">
            <FaqAccordion items={FAQ_ITEMS} theme="light" />
          </div>
        </div>
      </SectionReveal>

      {/* Section 9 — CTA */}
      <ServiceCTA
        variant="orange"
        headline={
          <>
            <span className="text-[var(--brand-black)]">Your Banner.</span>
            <br />
            <span className="text-[var(--brand-black)]">Your Brand.</span>
            <br />
            <span className="text-[var(--brand-black)]">Let&apos;s Print.</span>
          </>
        }
        subheadline={`From concept to delivery, ${business.businessName} handles your large format printing from our ${business.city} facility. Fast, precise, and built to last.`}
        ctaPrimary="Get a Free Quote →"
        ctaPrimaryHref="/get-a-quote"
        ctaSecondary="Upload Your Artwork"
        ctaSecondaryHref="/get-a-quote"
        quote={`Best print quality in ${business.city}. Delivered on time, every time.`}
        quoteAuthor={`Amani K., Marketing Manager, ${business.city}`}
        footerNote={`${business.tradingName} · ${business.website} · ${business.city}, ${business.country}`}
      />

      <div className="bg-[var(--surface-dark)] border-t border-white/10 py-6 px-6 text-center">
        <p className="text-sm text-white/60">
          Looking for 3D printing?{" "}
          <Link href="/services/3d-printing" className="text-[var(--brand-orange)] hover:underline">
            Explore our 3D printing service
          </Link>
        </p>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Large Format Printing",
            description:
              `Professional large format printing in ${business.city || "Kenya"}. Banners, vehicle wraps, billboards, canvas prints, signage. Fast turnaround. Nationwide delivery across Kenya.`,
            provider: {
              "@type": "Organization",
              name: business.businessName,
              url: baseUrl,
            },
            areaServed: "Kenya",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </main>
  );
}
