import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueContent } from "./catalogue-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Print-on-Demand Catalogue | PrintHub Kenya",
  description:
    "Browse 3D models — choose your material, colour, and quantity. We print fresh for every order. Delivered anywhere in Kenya.",
  openGraph: {
    title: "Print-on-Demand Catalogue | PrintHub Kenya",
    url: "/catalogue",
  },
};

export default function CataloguePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] bg-[#0A0A0A]">
          <div className="container max-w-7xl mx-auto px-4 py-16">
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="mt-4 h-12 w-72 bg-white/20" />
          </div>
          <div className="bg-white py-8">
            <div className="container max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}
