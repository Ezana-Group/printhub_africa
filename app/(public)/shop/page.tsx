import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopContent } from "./shop-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Shop | PrintHub Kenya",
  description:
    "Browse our print products and services. Order online, delivered across Kenya.",
  openGraph: {
    title: "Shop | PrintHub Kenya",
    url: "/shop",
  },
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
