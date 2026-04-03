export const dynamic = "force-dynamic";

import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmailTemplatesTab } from "./_components/EmailTemplatesTab";
import { WhatsAppTemplatesTab } from "./_components/WhatsAppTemplatesTab";
import { NewTemplateDialog } from "./_components/new-template-dialog";
import { Mail, MessageCircle, Search, FileText } from "lucide-react";
import Link from "next/link";

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  await requireAdminSettings();
  const { q = "", tab = "email" } = await searchParams;

  const [emailTemplates, whatsappTemplates] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.whatsAppTemplate.findMany({ orderBy: { slug: "asc" } }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
            Manage automated communication templates for Email and WhatsApp. 
            Use placeholders like <code className="text-orange-600 bg-orange-50 px-1 rounded">{"{{businessName}}"}</code> for dynamic data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/components/pdf/InvoicePDF.tsx" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4 text-orange-500" />
            Invoice PDF (Dev)
          </Link>
          <NewTemplateDialog type={tab === "whatsapp" ? "whatsapp" : "email"} />
        </div>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200">
          <TabsList className="border-none">
            <TabsTrigger value="email" className="flex items-center gap-2 px-6">
              <Mail className="h-4 w-4" />
              Email Templates
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold">
                {emailTemplates.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2 px-6">
              <MessageCircle className="h-4 w-4" />
              WhatsApp Templates
               <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold">
                {whatsappTemplates.length}
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
      </Tabs>

      <div className="rounded-xl bg-orange-50 border border-orange-100 p-6 flex items-start gap-4 mt-8">
        <div className="p-2 rounded-lg bg-white shadow-sm">
          <FileText className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-orange-900">PDF Document Template</h3>
          <p className="text-sm text-orange-700/80 mt-1 max-w-2xl">
            The PDF invoice and quote generation uses the <code>@react-pdf/renderer</code> component 
            located at <code>/components/pdf/InvoicePDF.tsx</code>. This template is hardcoded for 
            high-fidelity rendering and legal compliance.
          </p>
          <div className="mt-4 flex gap-3">
             <Link 
              href="/admin/finance/invoices" 
              className="text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4"
            >
              View Generated Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
