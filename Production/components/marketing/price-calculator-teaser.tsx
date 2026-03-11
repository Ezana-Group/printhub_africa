import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PriceCalculatorTeaser() {
  return (
    <section className="py-20 md:py-28 bg-slate-50/80">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <Card className="max-w-xl mx-auto border-0 rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <h2 className="font-display text-2xl font-bold text-slate-900">Instant Price Estimate</h2>
            <p className="text-sm text-slate-600 mt-1">
              Large format printing — get a rough quote in seconds
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-5">
            <p className="text-slate-600 text-sm">
              Enter width and height (cm), choose material, and see an estimated price in KES.
            </p>
            <Button asChild className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/services/large-format#calculator">Open full quote calculator</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
