import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "3D Printing Materials Kenya | PLA, PETG, Resin | PrintHub",
  description:
    "PLA filament Kenya, PETG Kenya, resin 3D printing Kenya. Compare materials, understand use cases, and choose the right filament for your project. PrintHub Africa, Nairobi.",
  keywords: [
    "PLA filament Kenya",
    "PETG Kenya",
    "resin 3D printing Kenya",
    "3D printing materials Kenya",
    "ABS printing Nairobi",
    "TPU flexible filament Kenya",
    "Nylon 3D printing Kenya",
  ],
  alternates: { canonical: "/materials" },
  openGraph: {
    title: "3D Printing Materials Kenya | PLA, PETG, Resin | PrintHub Africa",
    description:
      "Compare PLA, PETG, ABS, TPU, resin, and Nylon. Find the right 3D printing material for your project in Kenya.",
    url: "/materials",
  },
};

const MATERIALS = [
  {
    id: "pla",
    name: "PLA (Polylactic Acid)",
    badge: "Most Popular",
    badgeColor: "bg-green-100 text-green-800",
    tagline: "The go-to material for most prints",
    description:
      "PLA is the most widely used 3D printing filament in Kenya and worldwide. It is plant-based, biodegradable, easy to print, and available in a huge range of colours. PLA produces sharp detail and a smooth surface finish — making it ideal for display models, prototypes, and decorative items.",
    pros: [
      "Easiest material to print — minimal warping",
      "Excellent detail and surface quality",
      "Wide colour range including matte, silk, and metallic",
      "Biodegradable and plant-based",
      "Lowest cost of all materials",
    ],
    cons: [
      "Not suitable for outdoor use (UV degrades it)",
      "Low heat resistance (~60°C) — not for car dashboards or hot environments",
      "Brittle under sudden impact",
    ],
    bestFor:
      "Prototypes · Display models · Figurines · Gifts · Educational models · Architectural models · Logo displays · Decorative homeware",
    notFor: "Outdoor parts · High-temperature environments · Load-bearing structural parts",
    priceRange: "Most affordable",
    keywords: "PLA filament Kenya, PLA 3D printing Nairobi",
  },
  {
    id: "pla-plus",
    name: "PLA+ (Enhanced PLA)",
    badge: "Step Up",
    badgeColor: "bg-teal-100 text-teal-800",
    tagline: "Tougher PLA with better impact resistance",
    description:
      "PLA+ is a modified version of standard PLA with improved toughness, reduced brittleness, and slightly higher heat resistance. It prints just as easily as PLA but handles bumps, drops, and minor stress better. A popular choice for consumer products and snap-fit parts.",
    pros: [
      "Less brittle than standard PLA",
      "Better impact resistance",
      "Same ease of printing as PLA",
      "Slightly higher heat tolerance",
    ],
    cons: [
      "Slightly more expensive than standard PLA",
      "Still not suited for high-heat or outdoor UV environments",
    ],
    bestFor:
      "Consumer products · Snap-fit assemblies · Phone accessories · Light-duty brackets · Cases and enclosures",
    notFor: "Outdoor UV exposure · Structural engineering parts",
    priceRange: "Affordable",
    keywords: "PLA+ Kenya, enhanced PLA Nairobi",
  },
  {
    id: "petg",
    name: "PETG (Polyethylene Terephthalate Glycol)",
    badge: "Versatile",
    badgeColor: "bg-blue-100 text-blue-800",
    tagline: "Strong, chemical-resistant, and moisture-proof",
    description:
      "PETG hits the sweet spot between ease of printing and functional performance. It is moisture-resistant, slightly flexible, and chemically resistant — making it ideal for outdoor components, containers, and parts in humid Kenyan conditions. PETG is also transparent in its natural form, allowing for semi-clear prints.",
    pros: [
      "Moisture and chemical resistant — ideal for Kenya's humidity",
      "Slightly flexible — won't shatter under impact",
      "Higher heat resistance than PLA (~80°C)",
      "Food-contact safe when using certified PETG",
      "Can be transparent/translucent",
    ],
    cons: [
      "More stringing than PLA during printing",
      "Surface finish slightly less sharp than PLA",
      "Not suitable for ultra-fine detail",
    ],
    bestFor:
      "Water bottles and containers · Outdoor components · Electronics enclosures · Mechanical parts · Food-contact items (certified grade)",
    notFor: "Ultra-fine detail models · Very high-temperature applications",
    priceRange: "Mid-range",
    keywords: "PETG Kenya, PETG filament Nairobi",
  },
  {
    id: "abs",
    name: "ABS (Acrylonitrile Butadiene Styrene)",
    badge: "Engineering",
    badgeColor: "bg-orange-100 text-orange-800",
    tagline: "The engineering workhorse — tough and heat-resistant",
    description:
      "ABS is the classic engineering plastic used in car parts, power tools, and consumer electronics. It is strong, heat-resistant (up to ~100°C), and can be post-processed with acetone vapour for an ultra-smooth surface finish. ABS is more demanding to print than PLA, but PrintHub's commercial machines handle it reliably.",
    pros: [
      "High impact resistance and toughness",
      "Heat resistant up to ~100°C",
      "Can be acetone-smoothed to a near-injection-moulded finish",
      "Machinable — can be drilled, tapped, and sanded",
    ],
    cons: [
      "Produces fumes during printing (handled safely at PrintHub)",
      "Prone to warping without enclosure — home printers struggle",
      "Not biodegradable",
    ],
    bestFor:
      "Engineering parts · Automotive components · Power tool housings · Consumer electronics enclosures · Heat-exposed functional parts",
    notFor: "Outdoor UV exposure long-term · Beginner home printing",
    priceRange: "Mid-range",
    keywords: "ABS printing Kenya, ABS filament Nairobi",
  },
  {
    id: "tpu",
    name: "TPU (Thermoplastic Polyurethane)",
    badge: "Flexible",
    badgeColor: "bg-purple-100 text-purple-800",
    tagline: "The rubber of 3D printing",
    description:
      "TPU is the flexible filament of choice. It can be stretched, compressed, and bent repeatedly without breaking — like rubber or silicone but 3D printable. TPU is wear-resistant and shock-absorbing, making it ideal for phone cases, grips, gaskets, and anything that needs to flex.",
    pros: [
      "Highly flexible and elastic",
      "Excellent shock absorption",
      "Wear-resistant surface",
      "Good chemical resistance",
    ],
    cons: [
      "Slower to print than rigid materials",
      "Lower detail resolution",
      "Not suitable for rigid structural parts",
    ],
    bestFor:
      "Phone cases · Watch straps · Shoe soles · Gaskets and seals · Grips and handles · Vibration dampeners · Sports equipment",
    notFor: "Rigid structural parts · High-detail fine models",
    priceRange: "Mid-range",
    keywords: "TPU filament Kenya, flexible 3D printing Nairobi",
  },
  {
    id: "resin",
    name: "Resin (Standard MSLA)",
    badge: "Ultra Detail",
    badgeColor: "bg-yellow-100 text-yellow-800",
    tagline: "For when detail is everything",
    description:
      "Resin 3D printing uses UV light to cure liquid photopolymer resin layer by layer, producing surfaces so smooth the layer lines are nearly invisible to the naked eye. If you need miniatures, jewellery, dental models, or product mockups with near-injection-moulded quality, resin is unmatched in Kenya.",
    pros: [
      "Incredibly fine detail — layer height from 0.025mm",
      "Ultra-smooth surface finish out of the machine",
      "Excellent for miniatures, jewellery, and dental models",
      "Great for product display mockups",
    ],
    cons: [
      "More brittle than FDM materials",
      "Requires post-processing (IPA wash + UV cure)",
      "Higher cost per gram than FDM filaments",
      "Limited build volume",
    ],
    bestFor:
      "Jewellery and wax castings · Miniatures and figurines · Dental models · Architectural details · Product mockups · Art pieces",
    notFor: "Large functional parts · Flexible or impact-resistant parts",
    priceRange: "Premium",
    keywords: "resin 3D printing Kenya, resin printing Nairobi",
  },
  {
    id: "nylon",
    name: "Nylon (PA12)",
    badge: "Industrial",
    badgeColor: "bg-slate-100 text-slate-700",
    tagline: "Industrial-grade strength and flexibility combined",
    description:
      "Nylon is the material of choice for industrial and engineering applications where you need both strength and some flexibility. It is fatigue-resistant, excellent at absorbing repeated stress, and highly resistant to chemicals and abrasion. Used across manufacturing, automotive, and industrial applications in Kenya.",
    pros: [
      "High tensile strength and fatigue resistance",
      "Slightly flexible — won't suddenly snap under load",
      "Excellent chemical and abrasion resistance",
      "Suitable for functional mechanical parts",
    ],
    cons: [
      "Most difficult to print — requires dry filament storage",
      "Absorbs moisture (hygroscopic) — affects print quality",
      "Higher cost",
    ],
    bestFor:
      "Industrial components · Gears and bearings · Hinges and living hinges · Snap-fit assemblies · Automotive parts · Sports equipment",
    notFor: "Decorative or display models · Beginners",
    priceRange: "Premium",
    keywords: "Nylon 3D printing Kenya, PA12 printing Nairobi",
  },
];

export default function MaterialsPage() {
  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 px-6 py-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-slate-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="text-slate-800" aria-current="page">Materials</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 py-20 px-6 md:px-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-3">
          3D Printing Materials — Kenya
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white leading-tight">
          Choose the Right
          <br />
          Material.
        </h1>
        <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
          Not all 3D printing materials are equal. The right choice depends on your application,
          environment, budget, and required finish. Here is everything you need to know about
          every material we offer at PrintHub Africa in Nairobi.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/get-a-quote">Get a Quote</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl text-white border-white/30 hover:bg-white/10">
            <Link href="/shop">Browse Products</Link>
          </Button>
        </div>
      </section>

      {/* Quick comparison table */}
      <section className="bg-white py-16 px-6 md:px-12 overflow-x-auto">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
            At a Glance
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-slate-500 uppercase tracking-wide text-xs">
                <th className="py-3 pr-4">Material</th>
                <th className="py-3 pr-4">Strength</th>
                <th className="py-3 pr-4">Flexibility</th>
                <th className="py-3 pr-4">Heat Resistance</th>
                <th className="py-3 pr-4">Detail</th>
                <th className="py-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "PLA", strength: "★★★", flex: "★★", heat: "★★", detail: "★★★★", price: "KES" },
                { name: "PLA+", strength: "★★★★", flex: "★★", heat: "★★★", detail: "★★★★", price: "KES" },
                { name: "PETG", strength: "★★★★", flex: "★★★", heat: "★★★", detail: "★★★", price: "KES KES" },
                { name: "ABS", strength: "★★★★★", flex: "★★★", heat: "★★★★", detail: "★★★", price: "KES KES" },
                { name: "TPU", strength: "★★★", flex: "★★★★★", heat: "★★★", detail: "★★", price: "KES KES" },
                { name: "Resin", strength: "★★★", flex: "★", heat: "★★", detail: "★★★★★", price: "KES KES KES" },
                { name: "Nylon", strength: "★★★★★", flex: "★★★★", heat: "★★★★", detail: "★★★", price: "KES KES KES" },
              ].map((row) => (
                <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pr-4 font-semibold text-slate-900">{row.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.strength}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.flex}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.heat}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.detail}</td>
                  <td className="py-3 text-slate-600">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Individual material cards */}
      <section className="bg-slate-50 py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {MATERIALS.map((mat) => (
            <div key={mat.id} id={mat.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mat.badgeColor}`}>
                  {mat.badge}
                </span>
                <span className="text-xs text-slate-500 font-mono">{mat.priceRange}</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">{mat.name}</h2>
              <p className="text-slate-500 italic mt-1">{mat.tagline}</p>
              <p className="mt-4 text-slate-600 leading-relaxed">{mat.description}</p>
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Advantages</h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {mat.pros.map((p) => (
                      <li key={p} className="flex gap-2"><span className="text-green-600 shrink-0">✓</span>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Limitations</h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {mat.cons.map((c) => (
                      <li key={c} className="flex gap-2"><span className="text-slate-400 shrink-0">–</span>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold text-green-800 mb-1">Best for</p>
                  <p className="text-green-700">{mat.bestFor}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-semibold text-red-800 mb-1">Not ideal for</p>
                  <p className="text-red-700">{mat.notFor}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16 px-6 md:px-12 text-center">
        <h2 className="font-display text-3xl font-extrabold text-white">
          Not Sure Which Material to Choose?
        </h2>
        <p className="mt-4 text-white/70 max-w-xl mx-auto">
          Tell us what your object needs to do — and we will recommend the right material for
          your budget and application. Our team replies within 2 business hours.
          Pay easily via M-Pesa, card, or bank transfer.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/get-a-quote">Upload Your File & Get a Quote</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl text-white border-white/30 hover:bg-white/10">
            <Link href="/catalogue">Browse Ready-to-Print Catalogue</Link>
          </Button>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "3D Printing Materials Available in Kenya",
            description:
              "Complete guide to 3D printing materials offered by PrintHub Africa in Nairobi, Kenya — PLA, PETG, ABS, TPU, Resin, and Nylon.",
            numberOfItems: MATERIALS.length,
            itemListElement: MATERIALS.map((mat, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: mat.name,
              description: mat.description,
              url: `https://printhub.africa/materials#${mat.id}`,
            })),
          }),
        }}
      />
    </main>
  );
}
