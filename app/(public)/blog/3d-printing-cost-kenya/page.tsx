import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Much Does 3D Printing Cost in Kenya? | PrintHub Africa",
  description:
    "How much does 3D printing cost in Kenya? Honest pricing breakdown for FDM and resin printing in Nairobi — by size, material, and complexity. PrintHub Africa.",
  keywords: [
    "how much does 3D printing cost in Kenya",
    "3D printing cost Kenya",
    "3D printing price Nairobi",
    "3D printing price Kenya shillings",
    "affordable 3D printing Kenya",
    "3D printing KES",
  ],
  alternates: { canonical: "/blog/3d-printing-cost-kenya" },
  openGraph: {
    title: "How Much Does 3D Printing Cost in Kenya? | PrintHub Africa",
    description:
      "Transparent pricing guide for 3D printing in Kenya. Discover what affects cost, typical price ranges in KES, and how to get the best value.",
    url: "/blog/3d-printing-cost-kenya",
    type: "article",
  },
};

const PRICE_EXAMPLES = [
  { item: "Small keyring / badge (PLA, ~15g)", range: "KES 800 – 1,200" },
  { item: "Phone stand / cable organiser (PLA, ~50g)", range: "KES 1,200 – 2,000" },
  { item: "Custom phone case (TPU, ~40g)", range: "KES 1,500 – 2,500" },
  { item: "Small figurine — resin detail (~30ml)", range: "KES 2,000 – 3,500" },
  { item: "Medium decorative model (PLA, ~150g)", range: "KES 2,500 – 4,500" },
  { item: "Architectural scale model (PLA, ~300g)", range: "KES 5,000 – 12,000" },
  { item: "Engineering bracket (PETG/ABS, ~100g)", range: "KES 2,000 – 5,000" },
  { item: "Large prop / sculpture (PLA, ~500g)", range: "KES 8,000 – 18,000" },
  { item: "Batch of 10 small identical parts", range: "Volume discount applies" },
];

const COST_FACTORS = [
  {
    title: "Material Weight (Grams)",
    description:
      "The single biggest cost driver. A heavier print uses more filament and takes more time. PLA filament costs roughly KES 50–80 per gram of material used. Resin is charged by volume (ml) and is typically more expensive per unit than FDM filament.",
  },
  {
    title: "Print Time (Hours)",
    description:
      "Machine time is a direct cost. A simple 5-hour print is far cheaper than a complex 40-hour job of the same weight. Fine layer heights (higher detail) take longer than coarser layers. Our quotes always include the estimated print time.",
  },
  {
    title: "Material Choice",
    description:
      "PLA and PLA+ are the most affordable. PETG and ABS are mid-range. TPU, Nylon, and specialty filaments (carbon fibre, silk) cost more. Resin is the most expensive per gram but produces the finest detail. See our full materials guide for comparisons.",
  },
  {
    title: "Post-Processing",
    description:
      "A raw print (straight off the machine) is the cheapest. Sanding, priming, painting, and resin coating all add to the cost — but dramatically improve appearance. Post-processing costs are quoted per job based on complexity.",
  },
  {
    title: "Quantity",
    description:
      "Printing multiple identical units reduces the per-unit cost. Setup and slicing time is shared across the batch. For orders of 10+ identical parts, contact us for a volume pricing quote.",
  },
  {
    title: "Complexity and Supports",
    description:
      "Highly complex geometries with many overhangs require support structures that must be printed and then removed. This adds material, time, and finishing labour — and increases cost.",
  },
];

export default function ThreeDPrintingCostPage() {
  const publishDate = "2025-02-01";
  const modifiedDate = "2025-04-01";

  return (
    <main id="main-content" className="bg-white">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 px-6 py-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-slate-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/blog" className="hover:text-slate-800">Blog</Link></li>
          <li aria-hidden>/</li>
          <li className="text-slate-800" aria-current="page">3D Printing Cost in Kenya</li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-14">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
              Pricing Guide
            </span>
            <time dateTime={publishDate} className="text-xs text-slate-500">
              Published {new Date(publishDate).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">6 min read</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            How Much Does 3D Printing Cost in Kenya?
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Straight answer: small items start from <strong>KES 800</strong>, and most everyday
            prints fall between KES 1,500 and KES 8,000. But the price depends on several
            factors — here is a transparent breakdown of exactly how 3D printing is priced
            in Kenya, and how to get the most value.
          </p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">

          <h2>Typical 3D Printing Prices in Kenya (KES)</h2>
          <p>
            Below are indicative price ranges for common 3D printing requests at PrintHub Africa
            in Nairobi. Actual quotes depend on your specific model, material, and finish options.
          </p>
        </div>

        {/* Price table */}
        <div className="my-8 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-slate-600 font-semibold">Item / Description</th>
                <th className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">Price Range</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_EXAMPLES.map((row, i) => (
                <tr
                  key={row.item}
                  className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="px-4 py-3 text-slate-700">{row.item}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-slate-400 bg-slate-50">
            * Prices are indicative and may vary. Upload your file for an accurate quote.
          </p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none">

          <h2>What Determines the Cost of 3D Printing in Kenya?</h2>
          <p>
            Unlike a photocopy shop where price is simply per page, 3D printing cost has multiple
            variables. Here is what our team looks at when preparing your quote:
          </p>
        </div>

        <div className="my-8 space-y-6">
          {COST_FACTORS.map((factor) => (
            <div key={factor.title} className="flex gap-4 bg-slate-50 rounded-xl p-5">
              <span className="text-primary font-bold text-lg shrink-0">→</span>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg">{factor.title}</h3>
                <p className="mt-1 text-slate-600 text-base">{factor.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="prose prose-slate prose-lg max-w-none">

          <h2>FDM vs Resin: Which Is Cheaper?</h2>
          <p>
            <strong>FDM (filament) printing is almost always cheaper than resin printing</strong>
            {" "}for objects of similar size. Here&apos;s why:
          </p>
          <ul>
            <li>FDM filament (PLA) costs roughly KES 50–80 per gram of material used.</li>
            <li>Resin is charged by volume — typically more expensive per ml than filament per gram.</li>
            <li>Resin prints also require IPA washing and UV curing, adding post-processing time and cost.</li>
          </ul>
          <p>
            Choose resin when surface finish and fine detail are critical (jewellery, miniatures,
            dental models). Choose FDM when size, strength, or budget matters more.
          </p>

          <h2>How Does PrintHub Africa Calculate Your Quote?</h2>
          <p>
            At PrintHub Africa in Nairobi, your quote is calculated based on:
          </p>
          <ol>
            <li><strong>Material cost</strong> — weight or volume of filament/resin used</li>
            <li><strong>Machine time</strong> — hours of printer operation</li>
            <li><strong>Labour</strong> — file preparation, print monitoring, and support removal</li>
            <li><strong>Post-processing</strong> — if sanding, priming, or painting is requested</li>
            <li><strong>Delivery</strong> — Nairobi same-day or nationwide courier</li>
          </ol>
          <p>
            Our minimum order value is <strong>KES 800</strong>. There is no minimum quantity —
            we will print a single item. Upload your STL file at{" "}
            <Link href="/get-a-quote">printhub.africa/get-a-quote</Link> and receive a confirmed
            quote within 2 business hours.
          </p>

          <h2>How to Pay for 3D Printing in Kenya</h2>
          <p>
            PrintHub Africa accepts all major Kenyan payment methods:
          </p>
          <ul>
            <li><strong>M-Pesa</strong> — Send payment to our till or phone number included in your quote</li>
            <li><strong>Debit / credit card</strong> — Via our secure online payment gateway</li>
            <li><strong>Bank transfer</strong> — For larger orders and corporate clients</li>
          </ul>
          <p>
            We never begin printing until payment is confirmed — and we send you a production
            notification when your print starts and when it&apos;s ready.
          </p>

          <h2>Delivery Costs in Kenya</h2>
          <p>
            <strong>Collection from our Nairobi studio is free.</strong> For delivery:
          </p>
          <ul>
            <li><strong>Nairobi CBD and surrounding areas</strong> — same-day or next-day delivery</li>
            <li><strong>Other Nairobi areas</strong> — 1–2 business days</li>
            <li><strong>Nationwide (all 47 counties)</strong> — 2–5 business days via courier</li>
          </ul>
          <p>
            Delivery charges are calculated at checkout based on your location and package size.
          </p>

          <h2>Is 3D Printing Worth the Cost in Kenya?</h2>
          <p>
            For one-off custom items, prototypes, and parts that can&apos;t be found anywhere else —
            yes, absolutely. 3D printing removes the need for expensive tooling or minimum order
            quantities. You can order one piece, test it, and refine it before committing to
            larger production.
          </p>
          <p>
            For Kenyan businesses, 3D printing dramatically reduces product development time and
            cost. A prototype that would have cost KES 200,000+ in traditional manufacturing
            tooling can be produced for KES 5,000–15,000 — and iterated within days, not months.
          </p>
          <p>
            Ready to find out exactly what your project will cost?{" "}
            <Link href="/get-a-quote">Upload your file and get a free quote</Link> — or{" "}
            <Link href="/catalogue">browse our ready-to-print catalogue</Link> for items you can
            order today.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-slate-50 rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-extrabold text-slate-900">
            Get an Accurate Quote for Your Project
          </h2>
          <p className="mt-3 text-slate-600">
            Upload your 3D file and we&apos;ll send you a confirmed quote within 2 business hours.
            Pay via M-Pesa, card, or bank transfer.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/get-a-quote">Upload Your File & Get a Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/shop">Browse the Shop</Link>
            </Button>
          </div>
        </div>

        {/* Internal links */}
        <div className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="font-semibold text-slate-900 mb-4">Related Guides</h2>
          <ul className="space-y-2 text-sm">
            <li>→ <Link href="/blog/what-is-3d-printing-kenya" className="text-primary hover:underline">What Is 3D Printing? A Kenya Beginner&apos;s Guide</Link></li>
            <li>→ <Link href="/materials" className="text-primary hover:underline">3D Printing Materials Guide — PLA, PETG, Resin & More</Link></li>
            <li>→ <Link href="/services/3d-printing" className="text-primary hover:underline">Our 3D Printing Service in Nairobi</Link></li>
            <li>→ <Link href="/catalogue" className="text-primary hover:underline">Browse Ready-to-Print Products</Link></li>
          </ul>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "How Much Does 3D Printing Cost in Kenya?",
            description:
              "Transparent pricing guide for 3D printing in Kenya. Price ranges in KES, cost factors, and how to get the best value from 3D printing in Nairobi.",
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
              "@id": "https://printhub.africa/blog/3d-printing-cost-kenya",
            },
            keywords:
              "how much does 3D printing cost in Kenya, 3D printing price Nairobi, 3D printing KES",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How much does 3D printing cost in Kenya?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "3D printing in Kenya starts from KES 800 for small items. Most common prints cost between KES 1,500 and KES 8,000 depending on size, material, and complexity. Upload your STL file at printhub.africa/get-a-quote for an accurate quote within 2 hours.",
                },
              },
              {
                "@type": "Question",
                name: "Can I pay for 3D printing via M-Pesa in Kenya?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. PrintHub Africa accepts M-Pesa, credit/debit card, and bank transfer for all 3D printing orders in Kenya.",
                },
              },
              {
                "@type": "Question",
                name: "What is the minimum order for 3D printing in Kenya?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "PrintHub Africa has a minimum order value of KES 800. There is no minimum quantity — we will print a single item.",
                },
              },
              {
                "@type": "Question",
                name: "How long does 3D printing take in Nairobi?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Standard turnaround is 3–7 business days depending on size and complexity. Express options are available. Delivery to Nairobi is same-day or next-day; nationwide delivery takes 2–5 business days.",
                },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
