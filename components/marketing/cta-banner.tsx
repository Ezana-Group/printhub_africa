import Link from "next/link";
import { Button } from "@/components/ui/button";

const DEFAULT_WHATSAPP = "254700000000";

export function CTABanner({ whatsapp }: { whatsapp?: string | null } = {}) {
  const digits = (whatsapp ?? DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP;
  const waHref = `https://wa.me/${digits}`;
  return (
    <section className="py-20 md:py-24 bg-slate-900 text-white">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold">
          Ready to Bring Your Ideas to Life?
        </h2>
        <p className="mt-4 text-slate-300 max-w-xl mx-auto">
          Start your order today or chat with us on WhatsApp for a quick quote.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 shadow-xl shadow-primary/30"
          >
            <Link href="/get-a-quote">Start Your Order</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl px-8 h-12 border-2 border-white/60 bg-transparent text-white hover:bg-white/10 hover:border-white/80"
          >
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Talk to Us on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
