"use client";

import { ProductExportTable } from "../social-export/product-export-table";
import { SyncFeedsButton } from "../social-export/sync-feeds-button";
import { Sparkles } from "lucide-react";

interface MarketingContentClientProps {
  products: any[];
  categories: any[];
}

export function MarketingContentClient({
  products,
  categories
}: MarketingContentClientProps) {
  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wide uppercase">
            <Sparkles className="h-4 w-4" />
            Marketing Operations
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-4 border-primary/20 pb-1 inline-block">
            Product Social Distribution
          </h1>
          <p className="text-slate-500 max-w-2xl">
            Manage product visibility in external platforms and shopping feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SyncFeedsButton />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-1 px-1">
           <h2 className="text-xl font-bold text-slate-900">Product Social Distribution</h2>
           <p className="text-sm text-slate-500">Enable or disable product visibility in automated social feeds and shopping sites.</p>
        </div>
        <ProductExportTable initialProducts={products} categories={categories} />
      </div>
    </div>
  );
}
