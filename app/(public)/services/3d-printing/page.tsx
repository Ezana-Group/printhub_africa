import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ServiceHero,
  SectionLabel,
  ProcessStep,
  FaqAccordion,
  ServiceCTA,
  SectionReveal,
  MaterialsSection,
} from "@/components/services";

// Theme-appropriate: 3D printing, FDM/resin, workshop (dark + orange brand)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1600&q=85&auto=format";
const WHAT_IS_IMAGE =
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=85&auto=format";
const FILE_REQ_IMAGE =
  "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=700&q=85&auto=format";
const CTA_BG_IMAGE =
  "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1600&q=75&auto=format";

const FDM_IMAGE = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80&auto=format";
const RESIN_IMAGE = "https://images.unsplash.com/photo-1559304787-952b5a5c7c8f?w=500&q=80&auto=format";

export type Material3D = {
  title: string;
  badge: string;
  badgeColor: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
  strengthSpecs: { label: string; value: number }[];
  bestFor: string;
  notSuitableFor?: string;
  postProcessing?: string;
  filterTags?: string[];
};

const MATERIALS_3D: Material3D[] = [
  {
    title: "PLA (Polylactic Acid)",
    badge: "Most popular",
    badgeColor: "#22c55e",
    imageSrc: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format",
    imageAlt: "PLA filament 3D printing",
    description:
      "The most popular 3D printing material. Biodegradable, easy to print, and available in a huge range of colours. Perfect for prototypes, display models, gifts, and non-functional parts.",
    strengthSpecs: [
      { label: "Strength", value: 3 },
      { label: "Flexibility", value: 2 },
      { label: "Heat Resistance", value: 2 },
      { label: "Detail", value: 4 },
      { label: "Ease of Print", value: 5 },
    ],
    bestFor: "Prototypes · Display models · Figurines · Educational models · Architectural models · Logo displays · Decorative items",
    notSuitableFor: "Outdoor use (UV degrades) · High-temperature environments · Load-bearing parts",
    filterTags: ["Most Popular", "Beginner-Friendly"],
  },
  {
    title: "PLA+ (Enhanced PLA)",
    badge: "Step up",
    badgeColor: "#0d9488",
    imageSrc: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format",
    imageAlt: "PLA+ filament",
    description:
      "A step up from standard PLA — tougher, less brittle, and with a slightly higher temperature resistance. Same ease of printing as PLA but with better impact resistance.",
    strengthSpecs: [
      { label: "Strength", value: 4 },
      { label: "Flexibility", value: 2 },
      { label: "Heat Resistance", value: 3 },
      { label: "Detail", value: 4 },
      { label: "Ease of Print", value: 5 },
    ],
    bestFor: "Consumer products · Snap-fit parts · Phone accessories · Light-duty brackets",
    filterTags: ["Beginner-Friendly"],
  },
  {
    title: "PETG (Polyethylene Terephthalate Glycol)",
    badge: "Versatile",
    badgeColor: "#2563eb",
    imageSrc: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80&auto=format",
    imageAlt: "PETG 3D printing",
    description:
      "The middle ground between PLA and ABS. Strong, slightly flexible, chemically resistant, and safer to print than ABS (no fumes). PETG is moisture-resistant — ideal for outdoor or humid environments.",
    strengthSpecs: [
      { label: "Strength", value: 4 },
      { label: "Flexibility", value: 3 },
      { label: "Heat Resistance", value: 3 },
      { label: "Detail", value: 3 },
      { label: "Ease of Print", value: 4 },
    ],
    bestFor: "Water bottles & containers · Mechanical parts · Outdoor components · Electronics enclosures · Food-contact parts (certified PETG)",
    notSuitableFor: "Ultra-fine detail · Parts requiring very high temperature resistance",
    filterTags: ["Engineering"],
  },
  {
    title: "ABS (Acrylonitrile Butadiene Styrene)",
    badge: "Engineering",
    badgeColor: "var(--brand-orange)",
    imageSrc: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&q=80&auto=format",
    imageAlt: "ABS engineering parts",
    description:
      "The engineering workhorse. Tough, heat-resistant, and machinable. ABS can be post-processed with acetone vapour for an ultra-smooth surface finish. Slightly more challenging to print — we've mastered it.",
    strengthSpecs: [
      { label: "Strength", value: 5 },
      { label: "Flexibility", value: 3 },
      { label: "Heat Resistance", value: 4 },
      { label: "Detail", value: 3 },
      { label: "Ease of Print", value: 3 },
    ],
    bestFor: "Engineering parts · Automotive components · Power tool housings · Consumer electronics · Heat-exposed parts · Functional prototypes",
    filterTags: ["Engineering"],
  },
  {
    title: "TPU (Thermoplastic Polyurethane)",
    badge: "Flexible",
    badgeColor: "#7c3aed",
    imageSrc: "https://images.unsplash.com/photo-1559304787-952b5a5c7c8f?w=400&q=80&auto=format",
    imageAlt: "TPU flexible 3D print",
    description:
      "The rubber of 3D printing. Flexible, shock-absorbing, and wear-resistant. TPU can be stretched, compressed, and bent repeatedly without breaking.",
    strengthSpecs: [
      { label: "Strength", value: 3 },
      { label: "Flexibility", value: 5 },
      { label: "Heat Resistance", value: 3 },
      { label: "Detail", value: 2 },
      { label: "Ease of Print", value: 3 },
    ],
    bestFor: "Phone cases · Watch straps · Shoe soles · Gaskets & seals · Grips & handles · Vibration dampeners · Sports equipment",
    filterTags: ["Flexible"],
  },
  {
    title: "Resin (Standard MSLA)",
    badge: "Detail",
    badgeColor: "#ca8a04",
    imageSrc: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80&auto=format",
    imageAlt: "Resin 3D printing",
    description:
      "For when detail is everything. Resin printing produces incredibly smooth surfaces with layer lines almost invisible to the naked eye. The go-to material for jewellery, medical, dental, and collectibles.",
    strengthSpecs: [
      { label: "Strength", value: 3 },
      { label: "Flexibility", value: 1 },
      { label: "Heat Resistance", value: 2 },
      { label: "Detail", value: 5 },
      { label: "Ease of Print", value: 3 },
    ],
    bestFor: "Jewellery & wax castings · Miniatures & figurines · Dental models · Architectural details · Product mockups · Art pieces · Display models",
    postProcessing: "All resin prints require IPA wash + UV cure. Support removal included. Optional: sanding, painting, plating",
    filterTags: [],
  },
  {
    title: "Nylon (PA12)",
    badge: "Industrial",
    badgeColor: "#6b7280",
    imageSrc: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format",
    imageAlt: "Nylon 3D printing",
    description:
      "Industrial-grade strength and flexibility combined. Nylon is tough, fatigue-resistant, and slightly flexible — ideal for functional parts that need to flex without breaking. Excellent chemical resistance.",
    strengthSpecs: [
      { label: "Strength", value: 5 },
      { label: "Flexibility", value: 4 },
      { label: "Heat Resistance", value: 4 },
      { label: "Detail", value: 3 },
      { label: "Ease of Print", value: 2 },
    ],
    bestFor: "Industrial components · Gears & bearings · Hinges & living hinges · Snap-fit assemblies · Automotive parts · Sports equipment",
    filterTags: ["Engineering"],
  },
];

const APPLICATIONS_3D = [
  {
    number: "01",
    title: "Prototyping & Product Development",
    imageSrc: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=600&q=80&auto=format",
    imageAlt: "3D printed product prototype",
    copy: "Before you spend millions on tooling or manufacturing, 3D print your prototype. Test form, fit, and function in days — not weeks. Iterate fast, fail cheap, succeed with confidence. Perfect for: startups, inventors, product designers, engineers.",
    imageLeft: true,
  },
  {
    number: "02",
    title: "Architecture & Real Estate",
    imageSrc: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&auto=format",
    imageAlt: "3D printed architectural model",
    copy: "Architectural scale models, building presentations, and interior design mockups that make your project real before ground is broken. Impress clients, win pitches, and communicate your vision precisely.",
    imageLeft: false,
  },
  {
    number: "03",
    title: "Jewellery & Fashion",
    imageSrc: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80&auto=format",
    imageAlt: "3D printed jewellery and accessories",
    copy: "Custom rings, pendants, bracelets, and fashion accessories in resin or wax-castable material for lost-wax casting in gold or silver. Work with our team to go from sketch to castable model.",
    imageLeft: true,
  },
  {
    number: "04",
    title: "Education & Research",
    imageSrc: "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=600&q=80&auto=format",
    imageAlt: "3D printed educational models",
    copy: "Universities, schools, and research institutions across Kenya use PrintHub for anatomical models, scientific apparatus, historical artefact reproductions, and teaching aids. Special institutional pricing available.",
    imageLeft: false,
  },
  {
    number: "05",
    title: "Medical & Healthcare",
    imageSrc: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80&auto=format",
    imageAlt: "3D printed medical model",
    copy: "Patient-specific anatomical models for surgical planning, medical device prototypes, prosthetic components, and orthotic devices. We work with hospitals and clinics across Nairobi and beyond. Note: Medical devices must be verified by qualified medical professionals.",
    imageLeft: true,
  },
  {
    number: "06",
    title: "Consumer Products & Gifts",
    imageSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format",
    imageAlt: "Custom 3D printed consumer products and gifts",
    copy: "Custom gifts, personalised homeware, phone cases, cable organisers, plant pots, trophy toppers, keyring charms, and branded giveaways. One unit minimum — we can print a single custom piece just for you.",
    imageLeft: false,
  },
  {
    number: "07",
    title: "Industrial & Engineering",
    imageSrc: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&q=80&auto=format",
    imageAlt: "3D printed industrial engineering parts",
    copy: "Jigs and fixtures, tooling aids, replacement parts, manifolds, brackets, and custom machinery components. Functional prints in ABS, PETG, and Nylon built to your engineering tolerances.",
    imageLeft: true,
  },
  {
    number: "08",
    title: "Art, Sculpture & Culture",
    imageSrc: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80&auto=format",
    imageAlt: "3D printed art and sculpture",
    copy: "Artists, sculptors, and cultural institutions trust PrintHub to produce exhibition pieces, heritage reproductions, interactive installations, and large-scale sculptures. We've reproduced artefacts for Kenya's top museums.",
    imageLeft: false,
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    icon: "📁",
    title: "Prepare Your File",
    content:
      "Create or export your 3D model as STL, OBJ, FBX, 3MF, or STEP. Don't have a file? We offer 3D design services from sketches, photos, dimensions, or a verbal brief. Tip: Check your model is \"watertight\" (no holes in the mesh) before uploading.",
  },
  {
    number: "02",
    icon: "☁️",
    title: "Upload & Get an Estimate",
    content:
      "Upload your file at printhub.africa/upload. Select your material, quantity, and any finishing options. You'll see an instant price estimate. Our team then reviews your file in our slicer software and sends you a confirmed quote within 2 business hours.",
  },
  {
    number: "03",
    icon: "✅",
    title: "Approve & Pay",
    content:
      "Review your confirmed quote — including exact weight, print time, and final price. If you're happy, accept the quote and pay securely via M-Pesa, card, or bank transfer. We never begin printing until payment is confirmed.",
  },
  {
    number: "04",
    icon: "🖨️",
    title: "We Print",
    content:
      "Your job enters our production queue. Standard turnaround: 3–7 business days (depending on size and complexity). Express options available — discuss at quote stage. We send you a notification when printing starts and when it's complete.",
  },
  {
    number: "05",
    icon: "🚚",
    title: "Collect or Delivery",
    content:
      "Collect from our Nairobi facility (address sent with order confirmation) or choose delivery anywhere in Kenya. Nairobi deliveries: same day or next day. Nationwide: 2–5 days via courier. All prints are individually packaged to prevent damage in transit.",
  },
];

const FINISH_CARDS = [
  {
    icon: "🖨️",
    title: "Raw Print",
    description:
      "Straight off the printer. Visible layer lines on FDM prints. Resin prints are washed and UV-cured. No additional post-processing.",
    bestFor: "Prototypes, internal checks, functional parts where appearance is not critical.",
    surcharge: "None (included in base price)",
  },
  {
    icon: "📋",
    title: "Sanded Smooth",
    description:
      "Progressive hand-sanding from 120 to 400 grit to reduce or eliminate layer lines. Creates a much smoother surface ready for painting or display.",
    bestFor: "Display models, consumer products, pre-paint preparation",
    surcharge: "Quoted per job",
  },
  {
    icon: "💨",
    title: "Primed & Ready",
    description:
      "Sanded and coated with a grey filler primer. Fills micro-imperfections and creates an even base. Perfect if you plan to paint the model yourself.",
    bestFor: "Models being hand-painted by artist, prop makers, hobbyists",
    surcharge: "Quoted per job",
  },
  {
    icon: "🎨",
    title: "Single Colour Painted",
    description:
      "Sanded, primed, and spray-painted in your specified colour. We match standard RAL colours. Metallic and special effects available.",
    bestFor: "Display models, branded giveaways, product showcases, gifts",
    surcharge: "Quoted per job",
  },
  {
    icon: "🖌️",
    title: "Multi-Colour Painted",
    description:
      "Detailed hand-painting with up to multiple colours, shading, and effects. Our painters bring figurines, architectural models, and art pieces to life.",
    bestFor: "Figurines, tabletop gaming miniatures, collectibles, art pieces",
    surcharge: "Priced per job",
  },
  {
    icon: "✨",
    title: "Resin Coating",
    description:
      "A UV-curable resin coating applied over FDM prints to produce a glass-smooth, shiny finish — similar to a resin print without resin's brittleness.",
    bestFor: "Consumer products, display items, anything needing a sleek finish",
    surcharge: "Quoted per job",
  },
];

const FAQ_3D = [
  {
    question: "How do I know what material to choose?",
    answer:
      "If you're unsure, just tell us what the object will be used for — and we'll recommend the right material. In brief: PLA for display/prototypes, PETG for functional/outdoor, ABS for heat-resistant engineering parts, TPU for flexible parts, Resin for extreme detail, Nylon for industrial strength.",
  },
  {
    question: "What is the largest object you can print?",
    answer:
      "On FDM, our largest build volume is 300mm × 300mm × 400mm per printer. For larger objects, we split and print in sections, then bond the parts seamlessly. We've produced sculptures over 1 metre tall using this method.",
  },
  {
    question: "How accurate are your prints?",
    answer:
      "FDM prints are accurate to ±0.2mm in XY and ±0.1mm in Z. Resin prints are accurate to ±0.05mm. For tighter engineering tolerances, discuss your requirements at the quote stage and we will advise.",
  },
  {
    question: "Can I print multiple colours in one print?",
    answer:
      "Yes, with limitations. We can print colour changes at specific layer heights on FDM (manual filament swap) — suitable for text, logos, or gradient effects. For complex multi-colour models, we recommend painting post-print. True multi-material printing is available on our multi-material FDM system — ask at quote stage.",
  },
  {
    question: "Do you keep my design file confidential?",
    answer:
      "Absolutely. All uploaded files are stored in private, encrypted cloud storage. They are only accessed by our production team for your job. We do not share, sell, or use your designs for any other purpose. For particularly sensitive IP, we can sign an NDA — contact us.",
  },
  {
    question: "My model failed on my home printer — can you do it?",
    answer:
      "Often yes. Commercial 3D printers have more stable environments, better calibration, and more reliable filament than typical desktop machines. Common failures (warping, stringing, poor adhesion) are usually resolved by our setup. Share your file and we'll advise before quoting.",
  },
  {
    question: "How long does 3D printing take?",
    answer:
      "Print time depends entirely on the size, complexity, layer height, and material. A small object (50g PLA, 0.2mm layers) might take 3–5 hours. A large complex model (500g, 0.15mm layers) could take 30+ hours. Our team tells you the exact print time in your confirmed quote. Add 1–2 business days for post-processing if required.",
  },
  {
    question: "Can I collect my print instead of delivery?",
    answer:
      "Yes — collection from our Nairobi facility is free. You'll receive the address and collection time in your order confirmation. We'll notify you by SMS and email when your print is ready.",
  },
  {
    question: "What happens if my print fails?",
    answer:
      "If a print fails due to a printer error or our process, we reprint it at no charge. If a print fails because of issues in your file (e.g. a non-watertight mesh that we flagged before printing), we discuss options. We include a 5% failed-print buffer in all our pricing — you're never charged extra for reprints caused by our equipment.",
  },
  {
    question: "Do you offer 3D scanning?",
    answer:
      "3D scanning (to create a digital model of a physical object) is offered as a separate service on request. Contact us for a quote. Common use cases: replicating spare parts, digitising art pieces, heritage documentation, and reverse engineering.",
  },
  {
    question: "Can you print in food-safe materials?",
    answer:
      "We can print with food-safe certified PETG filament. However, FDM-printed objects have micro-gaps between layers that can harbour bacteria. For food contact, we recommend resin-coating or treating the surface. We do not recommend FDM prints for extended direct food contact.",
  },
  {
    question: "What is the minimum order for 3D printing?",
    answer:
      "Minimum order value is KES 800. There is no minimum quantity — we will print a single unit. You can even mix different models in one order.",
  },
];

export const metadata: Metadata = {
  title: "3D Printing Nairobi | FDM & Resin Printing | PrintHub Kenya",
  description:
    "3D printing services in Nairobi, Kenya. FDM and resin printing for prototypes, consumer products, engineering parts & more. Upload your STL file and get a quote in 2 hours. PrintHub.",
  openGraph: {
    title: "3D Printing Nairobi | PrintHub Kenya",
    description:
      "FDM and resin 3D printing. Upload your STL and get a quote in 2 hours. Delivered across Kenya.",
    url: "/services/3d-printing",
  },
  alternates: { canonical: "/services/3d-printing" },
};

export default function ThreeDPrintingPage() {
  return (
    <main id="main-content" className="bg-[var(--brand-black)]">
      <nav aria-label="Breadcrumb" className="border-b border-white/10 bg-[var(--surface-dark)] px-6 py-3 md:px-12">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-white/60 font-body">
          <li><Link href="/" className="hover:text-[var(--brand-orange)]">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/services" className="hover:text-[var(--brand-orange)]">Services</Link></li>
          <li aria-hidden>/</li>
          <li className="text-white" aria-current="page">3D Printing</li>
        </ol>
      </nav>
      <ServiceHero
        label="3D PRINTING — NAIROBI, KENYA"
        title={
          <>
            Print the
            <br />
            Impossible.
          </>
        }
        subtitle="From architectural prototypes to custom consumer products — PrintHub's 3D printing service turns your digital files into physical reality. FDM and resin printing available. Delivered across Kenya."
        imageSrc={HERO_IMAGE}
        imageAlt="3D printer in action at PrintHub Nairobi"
        ctaPrimary="Upload Your Model →"
        ctaPrimaryHref="/get-a-quote"
        ctaSecondary="Explore Materials ↓"
        ctaSecondaryHref="#materials"
        floatingBadge="🏭 FDM · Resin · Multi-material"
      />

      {/* Section 1 — What is 3D Printing */}
      <SectionReveal className="bg-[var(--brand-white)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel className="text-[var(--brand-orange)]">01 — WHAT IS 3D PRINTING</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-black)] leading-tight">
              Layer by Layer.
              <br />
              Idea to Object.
            </h2>
            <p className="mt-6 text-[var(--text-secondary)] leading-relaxed">
              3D printing — also called additive manufacturing — builds physical objects layer by layer from a digital 3D model file. Unlike traditional manufacturing that cuts material away, 3D printing adds material only where needed, making it ideal for complex geometries, custom one-offs, and rapid prototyping.
            </p>
            <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
              At PrintHub, we operate FDM (Fused Deposition Modelling) and MSLA resin printers — covering everything from functional engineering parts to ultra-detailed artistic models. You bring the idea. We bring it to life.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="font-display font-bold text-[var(--brand-black)]">FDM Printing</h4>
                <p className="mt-2 text-sm text-slate-600">
                  Melts and extrudes thermoplastic filament layer by layer. Best for: prototypes, functional parts, large models, affordable production runs. Layer resolution: 0.1mm – 0.3mm. Materials: PLA, PETG, ABS, TPU, ASA, Nylon, Carbon Fibre PLA.
                </p>
                <div className="mt-4 relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                  <Image src={FDM_IMAGE} alt="FDM 3D printer printing a prototype part" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="font-display font-bold text-[var(--brand-black)]">Resin (MSLA/SLA)</h4>
                <p className="mt-2 text-sm text-slate-600">
                  UV light cures liquid resin into solid form layer by layer. Best for: jewellery, miniatures, dental models, intricate detail. Layer resolution: 0.025mm – 0.1mm. Extremely smooth — near-injection-moulded quality.
                </p>
                <div className="mt-4 relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                  <Image src={RESIN_IMAGE} alt="MSLA resin 3D printer producing a detailed miniature" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
              </div>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
            <Image
              src={WHAT_IS_IMAGE}
              alt="FDM 3D printer producing a part at PrintHub Nairobi"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </SectionReveal>

      {/* Section 2 — Materials */}
      <SectionReveal id="materials" className="bg-[#0D0D0D] py-24 px-6 md:px-12 lg:px-16">
        <MaterialsSection materials={MATERIALS_3D} />
      </SectionReveal>

      {/* Section 3 — Applications */}
      <SectionReveal className="bg-[var(--surface-dark)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>03 — APPLICATIONS</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
            What Can You
            <br />
            3D Print?
          </h2>
          <p className="mt-6 max-w-2xl text-white/70">
            The answer is: almost anything that fits in the build volume. Here are the most common applications our Nairobi clients bring to us. If your application isn&apos;t listed — ask us.
          </p>
          <div className="mt-16 space-y-24">
            {APPLICATIONS_3D.map((app) => (
              <div key={app.number} className="grid md:grid-cols-2 gap-10 items-center">
                <div className={app.imageLeft ? "md:order-1" : "md:order-2"}>
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <Image
                      src={app.imageSrc}
                      alt={app.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className={app.imageLeft ? "md:order-2" : "md:order-1"}>
                  <span className="font-mono text-sm text-[var(--brand-orange)]">{app.number}</span>
                  <h3 className="font-display text-2xl font-bold text-[var(--brand-white)] mt-1">
                    {app.title}
                  </h3>
                  <p className="mt-4 text-white/70 leading-relaxed">{app.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Section 4 — Process */}
      <SectionReveal className="bg-[var(--brand-white)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <SectionLabel className="text-[var(--brand-orange)]">04 — THE PROCESS</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-black)] leading-tight">
            From File to
            <br />
            Finished Print.
          </h2>
          <div className="mt-16 space-y-12">
            {PROCESS_STEPS.map((step, i) => (
              <ProcessStep
                key={step.number}
                number={step.number}
                icon={step.icon}
                title={step.title}
                index={i}
                variant="light"
              >
                {step.content}
              </ProcessStep>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Section 5 — File Requirements */}
      <SectionReveal className="bg-[var(--surface-dark)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <SectionLabel>05 — FILE REQUIREMENTS</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
              Getting Your
              <br />
              File Ready.
            </h2>
            <div className="mt-8 space-y-6 text-white/80 text-sm">
              <div>
                <h4 className="font-mono text-[var(--brand-orange)] uppercase tracking-wider mb-2">Supported formats</h4>
                <p>→ STL · OBJ · FBX · 3MF · STEP / STP (CAD)</p>
              </div>
              <div>
                <h4 className="font-mono text-[var(--brand-orange)] uppercase tracking-wider mb-2">File quality checklist</h4>
                <ul className="space-y-1 list-disc pl-4">
                  <li>Watertight mesh (no holes, no open edges)</li>
                  <li>Correct scale (check units: mm vs cm vs inches)</li>
                  <li>Walls at least 1.2mm thick for FDM (0.5mm for resin)</li>
                  <li>Overhangs under 45° (or include support request in brief)</li>
                  <li>No inverted normals · Single shell</li>
                </ul>
              </div>
              <p className="font-mono text-white/60">Max file size: 500MB · Up to 10 files per order</p>
              <div>
                <h4 className="font-mono text-[var(--brand-orange)] uppercase tracking-wider mb-2">Don&apos;t have a 3D file?</h4>
                <p>We accept 2D drawings, photos of an object, written dimensions, or an existing product to replicate. Free tools: TinkerCAD, Fusion 360, Blender, SketchUp Free.</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src={FILE_REQ_IMAGE}
              alt="3D model being sliced in slicer software for PrintHub 3D printing Nairobi"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </SectionReveal>

      {/* Section 6 — Finishes */}
      <SectionReveal className="bg-[var(--brand-white)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <SectionLabel className="text-[var(--brand-orange)]">06 — FINISHING OPTIONS</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-black)] leading-tight">
            The Final
            <br />
            Touch.
          </h2>
          <p className="mt-6 max-w-2xl text-[var(--text-secondary)]">
            A 3D print straight off the machine is just the beginning. Post-processing transforms a raw print into a finished product. Here&apos;s what we offer — just note it in your brief or quote request.
          </p>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FINISH_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="text-2xl" aria-hidden>{card.icon}</span>
                <h3 className="font-display text-lg font-bold text-[var(--brand-black)] mt-3">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                <p className="mt-2 text-xs text-slate-500">Best for: {card.bestFor}</p>
                <p className="mt-2 font-mono text-xs text-[var(--brand-orange)]">{card.surcharge}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Section 7 — FAQ */}
      <SectionReveal className="bg-[var(--surface-dark)] py-24 px-6 md:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>07 — FREQUENTLY ASKED QUESTIONS</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--brand-white)] leading-tight">
            Your Questions,
            <br />
            Answered.
          </h2>
          <div className="mt-12">
            <FaqAccordion items={FAQ_3D} theme="dark" />
          </div>
        </div>
      </SectionReveal>

      {/* Section 8 — CTA */}
      <ServiceCTA
        variant="dark"
        backgroundImage={CTA_BG_IMAGE}
        headline={
          <>
            <span className="text-[var(--brand-white)]">Your Model.</span>
            <br />
            <span className="text-[var(--brand-white)]">Our Machines.</span>
            <br />
            <span className="text-[var(--brand-white)]">Real Results.</span>
          </>
        }
        subheadline="Upload your STL file and get a quote within 2 business hours. FDM and resin printing. Delivered across Kenya from Nairobi."
        ctaPrimary="Upload Your 3D File →"
        ctaPrimaryHref="/get-a-quote"
        ctaSecondary="Browse Our Materials"
        ctaSecondaryHref="#materials"
        stats="[7] Materials Available  ·  [0.025mm] Finest Layer Height  ·  [2hrs] Quote Turnaround  ·  [47] Counties Delivered"
        quote="From prototype to product — PrintHub made it happen in 48 hours."
        quoteAuthor="David M., Product Designer, Nairobi"
        footerNote="An Ezana Group Company · printhub.africa · Nairobi, Kenya"
      />

      <div className="bg-[var(--surface-dark)] border-t border-white/10 py-6 px-6 text-center">
        <p className="text-sm text-white/60">
          Need banners or large format?{" "}
          <Link href="/services/large-format-printing" className="text-[var(--brand-orange)] hover:underline">
            Explore our large format printing service
          </Link>
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "3D Printing",
            description:
              "3D printing services in Nairobi, Kenya. FDM and resin printing for prototypes, consumer products, engineering parts. Upload your STL and get a quote in 2 hours.",
            provider: {
              "@type": "Organization",
              name: "PrintHub",
              url: "https://printhub.africa",
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
            mainEntity: FAQ_3D.map((item) => ({
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
