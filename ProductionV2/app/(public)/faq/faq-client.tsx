"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  CreditCard,
  FileUp,
  Printer,
  Truck,
  RotateCcw,
  Box,
  Maximize,
  Building2,
  MessageCircle,
  Mail,
  Phone,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  CreditCard,
  FileUp,
  Printer,
  Truck,
  RotateCcw,
  Box,
  Maximize,
  Building2,
};

type FaqCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    isPopular: boolean;
  }>;
};

const DEFAULT_WHATSAPP = "254700000000";

export function FaqPageClient({
  categories: initialCategories,
  supportEmail = "support@printhub.africa",
  primaryPhone = null,
  whatsapp = null,
}: {
  categories: FaqCategory[];
  supportEmail?: string;
  primaryPhone?: string | null;
  whatsapp?: string | null;
}) {
  const waDigits = (whatsapp ?? primaryPhone ?? DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP;
  const telDigits = (primaryPhone ?? whatsapp ?? DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP;
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return initialCategories;
    const q = search.toLowerCase().trim();
    return initialCategories
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (f) =>
            f.question.toLowerCase().includes(q) ||
            f.answer.toLowerCase().replace(/<[^>]+>/g, " ").includes(q)
        ),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [initialCategories, search]);

  const popular = initialCategories.flatMap((c) =>
    c.faqs.filter((f) => f.isPopular)
  );

  return (
    <>
      <div className="mt-6">
        <Input
          type="search"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {popular.length > 0 && !search && (
        <section className="mt-10">
          <h2 className="font-semibold text-lg text-slate-900">
            Popular Questions
          </h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {popular.map((faq) => (
              <a
                key={faq.id}
                href={`#faq-${faq.id}`}
                className="block p-4 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-colors"
              >
                <p className="font-medium text-slate-900">{faq.question}</p>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {faq.answer.replace(/<[^>]+>/g, "").slice(0, 100)}…
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 space-y-10">
        {filtered.map((cat) => {
          const Icon = cat.icon ? ICON_MAP[cat.icon] : null;
          return (
            <section key={cat.id} id={cat.slug}>
              <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 text-primary" />}
                {cat.name}
              </h2>
              <div className="mt-3 space-y-2">
                {cat.faqs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      id={`faq-${faq.id}`}
                      className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="w-full text-left px-4 py-3 font-medium text-slate-900 hover:bg-slate-50 flex justify-between items-center"
                      >
                        {faq.question}
                        <span
                          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 pt-0">
                          <div
                            className="prose prose-slate prose-sm max-w-none prose-a:text-primary"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-14 pt-10 border-t border-slate-200">
        <p className="font-medium text-slate-900">Still have questions?</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Us
          </a>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Email Support
          </a>
          <a
            href={`tel:+${telDigits}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <Phone className="h-4 w-4" />
            Call Us
          </a>
        </div>
      </section>
    </>
  );
}
