import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "What Is 3D Printing? Kenya Guide | PrintHub Africa",
  description:
    "Beginner's guide to 3D printing in Kenya. Learn how it works, what you can make, how much it costs, and where to get things 3D printed in Nairobi. PrintHub Africa.",
  keywords: [
    "what is 3D printing",
    "3D printing Kenya",
    "3D printing Nairobi",
    "how does 3D printing work Kenya",
    "3D printing beginner guide",
    "additive manufacturing Kenya",
  ],
  alternates: { canonical: "/blog/what-is-3d-printing-kenya" },
  openGraph: {
    title: "What Is 3D Printing? A Kenya Beginner's Guide | PrintHub Africa",
    description:
      "Everything you need to know about 3D printing — explained simply, with Kenyan context. From how it works to where to get things printed in Nairobi.",
    url: "/blog/what-is-3d-printing-kenya",
    type: "article",
  },
};

export default function WhatIs3DPrintingPage() {
  const publishDate = "2025-01-15";
  const modifiedDate = "2025-04-01";

  return (
    <main id="main-content" className="bg-white">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 px-6 py-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-slate-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/blog" className="hover:text-slate-800">Blog</Link></li>
          <li aria-hidden>/</li>
          <li className="text-slate-800" aria-current="page">What Is 3D Printing?</li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-14">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full">
              Beginner Guide
            </span>
            <time dateTime={publishDate} className="text-xs text-slate-500">
              Published {new Date(publishDate).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">8 min read</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            What Is 3D Printing? A Complete Beginner&apos;s Guide for Kenya
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            3D printing is turning ideas into real, physical objects using a machine — right here
            in Nairobi. Whether you need a prototype, a spare part, a custom gift, or a decorative
            piece, 3D printing makes it possible. Here is everything you need to know.
          </p>
        </header>

        {/* Body */}
        <div className="prose prose-slate prose-lg max-w-none">

          <h2>How Does 3D Printing Work?</h2>
          <p>
            3D printing — also called <strong>additive manufacturing</strong> — builds a physical
            object layer by layer from a digital 3D model file. Think of it like printing a document,
            but instead of ink on paper, a machine deposits material (plastic, resin, or other
            materials) layer by layer until your object is complete.
          </p>
          <p>
            The process starts with a 3D digital file — usually in STL or OBJ format — created
            using software like TinkerCAD, Fusion 360, or Blender. That file is then loaded into
            a 3D printer, which reads the design and builds it from the bottom up, one thin layer
            at a time.
          </p>
          <p>
            Unlike traditional manufacturing (which cuts or moulds material), 3D printing only
            uses material where it is needed. This makes it perfect for complex shapes, one-off
            custom items, and rapid prototyping — with very little waste.
          </p>

          <h2>The Two Main Types of 3D Printing in Kenya</h2>

          <h3>FDM (Fused Deposition Modelling)</h3>
          <p>
            FDM is the most common type of 3D printing in Kenya. The machine melts a plastic
            filament and extrudes it through a nozzle, building the object layer by layer.
            FDM printers are fast, affordable, and capable of printing in a wide range of
            materials — from standard PLA to engineering-grade PETG, ABS, and Nylon.
          </p>
          <p>
            FDM is ideal for prototypes, functional parts, household items, and anything where
            size or cost matters more than ultra-fine detail.
          </p>

          <h3>Resin (MSLA/SLA)</h3>
          <p>
            Resin printing uses UV light to cure liquid photopolymer resin into a solid object.
            Layer by layer, a UV light source hardens the resin to produce incredibly smooth,
            detailed surfaces — with layer heights as fine as 0.025mm. The result looks and
            feels almost like injection-moulded plastic.
          </p>
          <p>
            Resin is ideal for jewellery, miniatures, dental models, and anything where
            surface quality and fine detail matter more than size or cost.
          </p>

          <h2>What Can You 3D Print in Nairobi?</h2>
          <p>
            The short answer: almost anything that fits in the printer&apos;s build volume. In Kenya,
            the most common uses we see at PrintHub Africa are:
          </p>
          <ul>
            <li><strong>Business prototypes</strong> — Product designers and startups use 3D printing to test form and function before committing to expensive tooling or manufacturing.</li>
            <li><strong>Architectural models</strong> — Architects and real estate developers print scale models of buildings to present to clients.</li>
            <li><strong>Spare parts</strong> — Can&apos;t find a replacement part for your machine, car, or appliance? If you have the dimensions or original part, we can scan and replicate it.</li>
            <li><strong>Custom gifts</strong> — Personalised keyrings, trophies, phone stands, plant pots, and homeware items with names, logos, or custom shapes.</li>
            <li><strong>Educational models</strong> — Universities and schools across Nairobi use 3D-printed models for anatomy, engineering, geography, and science lessons.</li>
            <li><strong>Jewellery</strong> — Custom rings, pendants, and accessories in resin or wax-castable material for lost-wax gold or silver casting.</li>
            <li><strong>Engineering components</strong> — Jigs, fixtures, brackets, manifolds, and functional parts for manufacturing operations.</li>
          </ul>

          <h2>What Materials Are Used for 3D Printing?</h2>
          <p>
            The most common 3D printing materials available in Kenya include:
          </p>
          <ul>
            <li><strong>PLA</strong> — The most popular. Easy to print, biodegradable, and available in dozens of colours. Best for display models and prototypes.</li>
            <li><strong>PETG</strong> — Strong, moisture-resistant, and slightly flexible. Ideal for functional parts and outdoor use in Kenya&apos;s climate.</li>
            <li><strong>ABS</strong> — Tough and heat-resistant. Used for engineering parts, automotive components, and anything exposed to heat.</li>
            <li><strong>TPU</strong> — The flexible rubber of 3D printing. Used for phone cases, grips, and gaskets.</li>
            <li><strong>Resin</strong> — For ultra-fine detail. Jewellery, miniatures, and dental models.</li>
            <li><strong>Nylon</strong> — Industrial-grade strength and flexibility for demanding mechanical applications.</li>
          </ul>
          <p>
            Not sure which material suits your project?{" "}
            <Link href="/materials">Read our full Kenya materials guide</Link> or{" "}
            <Link href="/get-a-quote">upload your file and ask us</Link> — we reply within 2 hours.
          </p>

          <h2>How Much Does 3D Printing Cost in Kenya?</h2>
          <p>
            3D printing costs in Kenya depend on the size of your object, the material chosen,
            print time, and any post-processing (sanding, painting) required. At PrintHub Africa,
            prices start from around <strong>KES 800</strong> for small items.
          </p>
          <p>
            The best way to get an accurate price is to upload your STL file to our quote system
            — we will send you a confirmed quote within 2 business hours. For a deeper breakdown,
            read our{" "}
            <Link href="/blog/3d-printing-cost-kenya">complete guide to 3D printing costs in Kenya</Link>.
          </p>

          <h2>How Do I Get Something 3D Printed in Nairobi?</h2>
          <p>
            Getting something 3D printed at PrintHub Africa is straightforward:
          </p>
          <ol>
            <li><strong>Prepare your file</strong> — Create or download a 3D model in STL, OBJ, or 3MF format. Don&apos;t have one? We offer design services from sketches, photos, or dimensions.</li>
            <li><strong>Upload and request a quote</strong> — Visit <Link href="/get-a-quote">printhub.africa/get-a-quote</Link>, upload your file, and choose your material. Our team sends a confirmed quote within 2 business hours.</li>
            <li><strong>Approve and pay</strong> — Pay securely via M-Pesa, card, or bank transfer. We never start printing until payment is confirmed.</li>
            <li><strong>Collect or receive delivery</strong> — Collect from our Nairobi studio or have your print delivered anywhere in Kenya within 2–5 business days.</li>
          </ol>

          <h2>Is 3D Printing Expensive in Kenya?</h2>
          <p>
            3D printing has become increasingly affordable in Kenya. For small items, prints
            start from KES 800. Compared to traditional manufacturing (which requires moulds,
            tooling, and minimum order quantities), 3D printing has no minimum order — we will
            print a single piece.
          </p>
          <p>
            For businesses, 3D printing dramatically reduces product development costs by enabling
            rapid prototyping. Instead of spending months and millions on tooling, you can test
            a physical prototype within days.
          </p>

          <h2>Why Use PrintHub Africa for 3D Printing in Kenya?</h2>
          <p>
            PrintHub Africa is Nairobi&apos;s professional 3D printing service, offering:
          </p>
          <ul>
            <li>FDM and resin printing across 7+ materials</li>
            <li>Quotes within 2 business hours of file upload</li>
            <li>M-Pesa, card, and bank transfer payments</li>
            <li>Delivery anywhere in Kenya&apos;s 47 counties</li>
            <li>Post-processing options including sanding, priming, and painting</li>
            <li>Confidential file handling with private encrypted storage</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-slate-50 rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-extrabold text-slate-900">
            Ready to Get Something 3D Printed?
          </h2>
          <p className="mt-3 text-slate-600">
            Upload your file and get a quote within 2 business hours. Pay via M-Pesa.
            Delivered across Kenya.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/get-a-quote">Upload Your File</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/shop">Browse Ready-to-Print Products</Link>
            </Button>
          </div>
        </div>

        {/* Internal links */}
        <div className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="font-semibold text-slate-900 mb-4">Related Articles</h2>
          <ul className="space-y-2 text-sm">
            <li>→ <Link href="/blog/3d-printing-cost-kenya" className="text-primary hover:underline">How Much Does 3D Printing Cost in Kenya?</Link></li>
            <li>→ <Link href="/materials" className="text-primary hover:underline">Complete Guide to 3D Printing Materials in Kenya</Link></li>
            <li>→ <Link href="/services/3d-printing" className="text-primary hover:underline">Our 3D Printing Service in Nairobi</Link></li>
            <li>→ <Link href="/services/3d-scanning" className="text-primary hover:underline">3D Scanning Services in Kenya</Link></li>
          </ul>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "What Is 3D Printing? A Complete Beginner's Guide for Kenya",
            description:
              "Beginner's guide to 3D printing in Kenya. Learn how it works, what you can make, and where to get things 3D printed in Nairobi.",
            datePublished: publishDate,
            dateModified: modifiedDate,
            author: {
              "@type": "Organization",
              name: "PrintHub Africa",
              url: "https://printhub.africa",
            },
            publisher: {
              "@type": "Organization",
              name: "PrintHub Africa",
              url: "https://printhub.africa",
              logo: {
                "@type": "ImageObject",
                url: "https://printhub.africa/logo.png",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://printhub.africa/blog/what-is-3d-printing-kenya",
            },
            keywords: "what is 3D printing, 3D printing Kenya, 3D printing Nairobi",
          }),
        }}
      />
    </main>
  );
}
