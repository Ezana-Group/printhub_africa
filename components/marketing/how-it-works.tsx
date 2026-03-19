import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const DEFAULT_STEPS = [
  {
    number: "01",
    title: "Choose or upload",
    description: "Pick a service or upload your own design",
    image: "/images/how-it-works/step1-design.webp",
    alt: "Designer working on creative project",
  },
  {
    number: "02",
    title: "Get a quote",
    description: "Instant estimate or custom quote from our team",
    image: "/images/how-it-works/step2-quote.webp",
    alt: "Getting an online quote",
  },
  {
    number: "03",
    title: "Pay securely",
    description: "M-Pesa, card, or bank transfer",
    image: "/images/how-it-works/step3-payment.webp",
    alt: "Secure mobile payment",
  },
  {
    number: "04",
    title: "We print & deliver",
    description: "Nationwide delivery across Kenya",
    image: "/images/how-it-works/step4-delivery.webp",
    alt: "Package delivered to customer",
  },
];

export function HowItWorks({
  stepImages = [],
}: {
  /** Override images for steps 1–4. Missing entries use defaults. */
  stepImages?: (string | undefined)[];
} = {}) {
  const steps = DEFAULT_STEPS.map((step, i) => ({
    ...step,
    image: (stepImages[i]?.trim() || step.image),
  }));
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          How It Works
        </h2>
        <p className="text-slate-600 text-center max-w-xl mx-auto mb-16">
          Four simple steps from idea to delivery.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4">
                {step.image.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                <div className="absolute top-3 left-3 bg-primary text-white text-sm font-mono font-bold px-2 py-1 rounded">
                  {step.number}
                </div>
              </div>
              <p className="font-display font-semibold text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-600 mt-1">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-24 left-[55%] w-[90%] h-px bg-slate-200" />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild size="lg" className="rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link href="/get-a-quote">Get started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
