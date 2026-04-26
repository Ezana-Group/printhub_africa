import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "3D Scanning Kenya | PrintHub Africa",
  description:
    "Professional 3D scanning services in Nairobi, Kenya. Reverse-engineer parts, digitise artefacts, and create accurate digital models. Get a quote within 2 hours.",
  keywords: [
    "3D scanning Kenya",
    "3D scanning Nairobi",
    "reverse engineering Kenya",
    "3D digitising Kenya",
    "photogrammetry Kenya",
  ],
  alternates: { canonical: "/services/3d-scanning" },
  openGraph: {
    title: "3D Scanning Kenya | PrintHub Africa",
    description:
      "Turn any physical object into a precise digital 3D model. Reverse engineering, heritage documentation, and product replication in Nairobi, Kenya.",
    url: "/services/3d-scanning",
  },
};

const USE_CASES = [
  {
    title: "Reverse Engineering",
    description:
      "Need to replicate a discontinued part or improve an existing product? We scan the physical object to produce an accurate CAD model you can modify, manufacture, or 3D print.",
  },
  {
    title: "Heritage & Museum Documentation",
    description:
      "We partner with Kenyan cultural institutions and museums to create precise 3D digital records of artefacts, sculptures, and historical objects — preserving them for future generations.",
  },
  {
    title: "Quality Control & Inspection",
    description:
      "Compare your manufactured parts against the original design. Our scans generate deviation maps that highlight dimensional errors to within 0.05 mm.",
  },
  {
    title: "Product Replication",
    description:
      "Have a product you want to reproduce or scale up? We scan it, clean the mesh, and provide print-ready or machining-ready files — eliminating the need for manual measurement.",
  },
  {
    title: "Medical & Prosthetics",
    description:
      "Anatomical scanning for custom orthotics, prosthetic sockets, and surgical planning models. We work with clinics and hospitals across Nairobi.",
  },
  {
    title: "Art & Sculpture",
    description:
      "Digitise sculptures, carvings, or artwork for reproduction, scaling, or digital archiving. We've worked with artists and galleries across Kenya.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Send Us Your Object",
    description:
      "Bring your object to our Nairobi studio or arrange courier pickup. We assess size, geometry, and surface finish requirements at no charge.",
  },
  {
    step: "02",
    title: "We Scan",
    description:
      "Using structured-light or photogrammetry scanning (depending on size and detail requirements), we capture millions of data points to create a dense point cloud.",
  },
  {
    step: "03",
    title: "Mesh Processing",
    description:
      "Raw scan data is processed, cleaned, and converted into a usable mesh file. We remove artefacts, fill holes, and optimise polygon density for your intended use.",
  },
  {
    step: "04",
    title: "File Delivery",
    description:
      "You receive your digital file in STL, OBJ, STEP, or your preferred format — ready for 3D printing, CNC machining, or archiving. Turnaround: 1–3 business days.",
  },
];

export default function ThreeDScanningPage() {
  return (
    <main id="main-content">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 px-6 py-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-slate-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/services" className="hover:text-slate-800">Services</Link></li>
          <li aria-hidden>/</li>
          <li className="text-slate-800" aria-current="page">3D Scanning</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-3">
            3D Scanning — Nairobi, Kenya
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Turn the Physical
            <br />
            into Digital.
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            PrintHub Africa offers professional 3D scanning services in Nairobi for reverse
            engineering, heritage documentation, quality inspection, and product replication.
            Delivered as STL, OBJ, or CAD-ready files.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/get-a-quote">Request a Scanning Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl text-white border-white/30 hover:bg-white/10">
              <Link href="/services/3d-printing">Also Need 3D Printing?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is 3D Scanning */}
      <section className="bg-white py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900">
            What Is 3D Scanning?
          </h2>
          <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
            <p>
              3D scanning is the process of capturing the shape of a physical object and converting
              it into a precise digital 3D model. Using structured light or photogrammetry technology,
              our scanners capture millions of measurement points — called a point cloud — which is
              then processed into a usable mesh or CAD file.
            </p>
            <p>
              Unlike manual measurement or hand-drawing, 3D scanning captures complex curves,
              organic surfaces, and intricate geometries with accuracy to <strong>±0.05 mm</strong>.
              It&apos;s faster, more accurate, and produces immediately usable digital assets.
            </p>
            <p>
              In Kenya, 3D scanning is used across manufacturing, healthcare, heritage preservation,
              education, and design. PrintHub Africa makes this technology accessible to businesses
              and individuals in Nairobi and nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-slate-50 py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 text-center">
            What Can We Scan?
          </h2>
          <p className="mt-4 text-slate-600 text-center max-w-2xl mx-auto">
            Almost any physical object can be digitised. Here are the most common applications
            our Nairobi clients bring to us.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map((uc) => (
              <div key={uc.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-slate-900">{uc.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-white py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900">
            How It Works
          </h2>
          <div className="mt-12 space-y-10">
            {PROCESS.map((p) => (
              <div key={p.step} className="flex gap-6">
                <span className="font-mono text-3xl font-bold text-orange-500 shrink-0 w-12">{p.step}</span>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-slate-600">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing note */}
      <section className="bg-slate-900 py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-extrabold text-white">
            Pricing
          </h2>
          <p className="mt-4 text-white/70">
            3D scanning is priced per job based on object size, scan complexity, and required
            output format. Small objects (under 200mm) start from <strong className="text-white">KES 3,500</strong>.
            Industrial and large-format scanning is quoted individually. Payment via M-Pesa,
            card, or bank transfer.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/get-a-quote">Get a Scanning Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl text-white border-white/30 hover:bg-white/10">
              <Link href="/catalogue">Browse Our Catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "3D Scanning",
            description:
              "Professional 3D scanning services in Nairobi, Kenya for reverse engineering, heritage documentation, quality inspection, and product replication.",
            provider: {
              "@type": "Organization",
              name: "PrintHub Africa",
              url: "https://printhub.africa",
            },
            areaServed: "Kenya",
            serviceType: "3D Scanning",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://printhub.africa/" },
              { "@type": "ListItem", position: 2, name: "Services", item: "https://printhub.africa/services" },
              { "@type": "ListItem", position: 3, name: "3D Scanning", item: "https://printhub.africa/services/3d-scanning" },
            ],
          }),
        }}
      />
    </main>
  );
}
