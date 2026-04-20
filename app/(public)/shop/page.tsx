import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopContent } from "./shop-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "3D Printed Products Shop Kenya | PrintHub",
  description:
    "Shop ready-made 3D printed products in Kenya. Order online from PrintHub with secure checkout and nationwide delivery.",
  keywords: [
    "3D printed products Kenya",
    "buy 3D prints Kenya",
    "3D printing shop Nairobi",
    "custom 3D products Kenya",
  ],
  openGraph: {
    title: "3D Printed Products Shop Kenya | PrintHub",
    description:
      "Browse and buy quality 3D printed products online in Kenya. Nationwide delivery available.",
    url: "/shop",
  },
  alternates: {
    canonical: "/shop",
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
