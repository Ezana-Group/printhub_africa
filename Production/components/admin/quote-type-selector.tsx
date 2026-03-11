"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SalesPrintCalculator } from "@/components/admin/SalesPrintCalculator";
import { SalesLFCalculator } from "@/components/admin/SalesLFCalculator";
import { Layout, Box } from "lucide-react";
import { getQuoteDraft, type QuoteDraft } from "@/lib/quote-draft";

type QuoteType = "3d" | "large_format";

export function QuoteTypeSelector() {
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const [type, setType] = useState<QuoteType>("3d");
  const [initialDraft, setInitialDraft] = useState<QuoteDraft | null>(null);

  useEffect(() => {
    const draft = getQuoteDraft();
    if (draft) {
      setInitialDraft(draft);
      setType(draft.type === "3d" ? "3d" : "large_format");
    } else if (typeFromUrl === "3d" || typeFromUrl === "large_format") {
      setType(typeFromUrl);
    }
  }, [typeFromUrl]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setType("3d")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm font-medium ${
            type === "3d"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Box className="h-4 w-4" />
          3D Print
        </button>
        <button
          type="button"
          onClick={() => setType("large_format")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm font-medium ${
            type === "large_format"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Layout className="h-4 w-4" />
          Large format
        </button>
      </div>
      {type === "3d" && (
        <SalesPrintCalculator
          initialDraft={initialDraft?.type === "3d" ? initialDraft : undefined}
        />
      )}
      {type === "large_format" && (
        <SalesLFCalculator
          initialDraft={initialDraft?.type === "large_format" ? initialDraft : undefined}
        />
      )}
    </div>
  );
}
