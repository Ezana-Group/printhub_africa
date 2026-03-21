import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { FaqPageClient } from "./faq-client";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
export const revalidate = 3600; // 1 hour — FAQ changes rarely

export const metadata = {
  title: "FAQ | PrintHub",
  description:
    "Frequently asked questions about ordering, payments, delivery, and more. PrintHub — printhub.africa",
};

export default async function FaqPage() {
  try {

  const [categories, business] = await Promise.all([
    prisma.faqCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        faqs: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    getBusinessPublic(),
  ]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-900">
        Frequently Asked Questions
      </h1>
      <p className="text-slate-600 mt-1">
        Can&apos;t find your answer? WhatsApp us — we reply within the hour.
      </p>
      <FaqPageClient
        categories={categories}
        supportEmail={business.supportEmail}
        primaryPhone={business.primaryPhone}
        whatsapp={business.whatsapp}
      />
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Service Temporarily Unavailable</h2>
          <p className="text-slate-600 mb-6">We are experiencing issues connecting to our services. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
