import { prisma } from "@/lib/prisma";
import { FaqPageClient } from "./faq-client";

export const metadata = {
  title: "FAQ | PrintHub",
  description:
    "Frequently asked questions about ordering, payments, delivery, and more. PrintHub — printhub.africa",
};

export default async function FaqPage() {
  const categories = await prisma.faqCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      faqs: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-900">
        Frequently Asked Questions
      </h1>
      <p className="text-slate-600 mt-1">
        Can&apos;t find your answer? WhatsApp us — we reply within the hour.
      </p>
      <FaqPageClient categories={categories} />
    </div>
  );
}
