export const dynamic = 'force-dynamic'
import Link from "next/link";
import { QuoteTypeSelector } from "@/components/admin/quote-type-selector";

export default function AdminQuoteNewPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href="/admin/quotes"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Quotes & Uploads
        </Link>
      </div>
      <h1 className="font-display text-2xl font-bold">New quote</h1>
      <p className="text-muted-foreground text-sm">
        Build a client quote with multiple line items. Choose 3D or Large format, adjust margins and
        discount, then generate a PDF or send to the client.
      </p>
      <QuoteTypeSelector />
    </div>
  );
}
