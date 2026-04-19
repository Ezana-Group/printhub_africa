import { Shield, Clock, Package, Truck, Users, CreditCard } from "lucide-react";

const REASONS = (city: string) => [
  { icon: Shield, title: "Kenyan-owned", description: city ? `Proudly based in ${city}` : "Proudly Kenyan" },
  { icon: Clock, title: "Fast turnaround", description: "48hr on many orders" },
  { icon: Package, title: "Premium materials", description: "Quality substrates & filaments" },
  { icon: Truck, title: "Nationwide delivery", description: "We deliver across Kenya" },
  { icon: Users, title: "Expert team", description: "Design & print specialists" },
  { icon: CreditCard, title: "Secure payments", description: "M-Pesa, card, bank transfer" },
];

export function WhyPrintHub({ city, businessName }: { city?: string | null; businessName?: string } = {}) {
  const name = businessName || "PrintHub";
  const reasons = REASONS(city ?? "Eldoret");
  return (
    <section className="py-20 md:py-28 bg-slate-50/80">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          Why {name}
        </h2>
        <p className="text-slate-600 text-center max-w-xl mx-auto mb-16">
          Trusted by businesses and creatives across Kenya.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {reasons.map((r) => (
            <div key={r.title} className="text-center p-6 rounded-2xl bg-white shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-slate-900 mt-4">{r.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
