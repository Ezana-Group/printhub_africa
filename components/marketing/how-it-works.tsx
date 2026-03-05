import Link from "next/link";
import { FileUp, Calculator, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: FileUp,
    title: "Choose or upload",
    description: "Pick a service or upload your own design",
  },
  {
    icon: Calculator,
    title: "Get a quote",
    description: "Instant estimate or custom quote from our team",
  },
  {
    icon: CreditCard,
    title: "Pay securely",
    description: "M-Pesa, card, or bank transfer",
  },
  {
    icon: Truck,
    title: "We print & deliver",
    description: "Nationwide delivery across Kenya",
  },
];

export function HowItWorks() {
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
          {STEPS.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 shadow-inner">
                <step.icon className="h-7 w-7" />
              </div>
              <p className="font-display font-semibold text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-600 mt-1">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[55%] w-[90%] h-px bg-slate-200" />
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
