import Link from "next/link";
import { CustomerPrintCalculator } from "@/components/calculators/CustomerPrintCalculator";

export default function Quote3DPrintPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div className="mb-8">
        <Link
          href="/services/3d-printing"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to 3D Printing
        </Link>
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
        Get a 3D Print Quote
      </h1>
      <p className="text-slate-600 mb-8">
        Enter your print details below for an instant estimate. Our team will
        confirm your final price within 2 business days.
      </p>
      <CustomerPrintCalculator />
    </div>
  );
}
