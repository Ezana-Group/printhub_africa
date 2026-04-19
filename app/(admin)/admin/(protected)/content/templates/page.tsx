export const dynamic = "force-dynamic";

import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmailTemplatesTab } from "./_components/EmailTemplatesTab";
import { WhatsAppTemplatesTab } from "./_components/WhatsAppTemplatesTab";
import { PdfTemplatesTab } from "./_components/PdfTemplatesTab";
import Link from "next/link";
import { Mail, MessageCircle, Search, FileText, Plus } from "lucide-react";

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  await requireAdminSettings();
  const { q = "", tab = "email" } = await searchParams;

  const [emailTemplates, whatsappTemplates, pdfTemplates] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.whatsAppTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.pdfTemplate.findMany({ orderBy: { slug: "asc" } }),
  ]);

  const activeType = tab === "whatsapp" ? "whatsapp" : tab === "pdf" ? "pdf" : "email";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Templates" },
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Templates</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Manage automated communication templates for Email, WhatsApp, and PDF documents.{" "}
            Use placeholders like{" "}
            <code className="text-orange-600 bg-orange-50 px-1 rounded">{`{{businessName}}`}</code>{" "}
            and <code className="text-orange-600 bg-orange-50 px-1 rounded">{`{{orderNumber}}`}</code> for dynamic data.
          </p>
        </div>
        <Link 
          href={`/admin/content/templates/new?type=${activeType}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D85A30] text-white rounded-lg hover:bg-[#D85A30]/90 transition-colors font-medium shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200">
          <TabsList className="border-none">
            <TabsTrigger value="email" className="flex items-center gap-2 px-5">
              <Mail className="h-4 w-4" />
              Email
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold">
                {emailTemplates.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2 px-5">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold">
                {whatsappTemplates.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2 px-5">
              <FileText className="h-4 w-4" />
              PDF
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold">
                {pdfTemplates.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <form method="GET" className="relative pb-2 sm:pb-0 w-full sm:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            />
            <input type="hidden" name="tab" value={tab} />
          </form>
        </div>

        <TabsContent value="email">
          <EmailTemplatesTab templates={emailTemplates as any} query={q.toLowerCase()} />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppTemplatesTab templates={whatsappTemplates as any} query={q.toLowerCase()} />
        </TabsContent>

        <TabsContent value="pdf">
          <PdfTemplatesTab templates={pdfTemplates as any} query={q.toLowerCase()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
