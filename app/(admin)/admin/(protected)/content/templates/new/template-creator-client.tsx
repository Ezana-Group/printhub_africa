"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  MessageCircle, 
  FileText, 
  ArrowLeft, 
  Save, 
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EmailEditor, type EmailEditorHandle } from "./_components/EmailEditor";
import { WhatsAppEditor, type WhatsAppEditorHandle } from "./_components/WhatsAppEditor";
import { PdfEditor, type PdfEditorHandle } from "./_components/PdfEditor";
import { PlaceholderPanel } from "./_components/PlaceholderPanel";

type TemplateType = "email" | "whatsapp" | "pdf";

export default function TemplateCreatorClient({ initialType = "email" }: { initialType?: TemplateType }) {
  const router = useRouter();
  const [type, setType] = useState<TemplateType>(initialType);
  const [loading, setLoading] = useState(false);
  
  // Refs for insertion
  const emailEditorRef = useRef<EmailEditorHandle>(null);
  const whatsAppEditorRef = useRef<WhatsAppEditorHandle>(null);
  const pdfEditorRef = useRef<PdfEditorHandle>(null);

  // Shared fields
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // Type-specific fields
  const [activeField, setActiveField] = useState<string | null>(null);
  const [emailData, setEmailData] = useState({
    subject: "",
    bodyHtml: "<p>Hello {{firstName}},</p><p>This is your new template content.</p>",
  });

  const [whatsAppData, setWhatsAppData] = useState({
    category: "UTILITY",
    bodyText: "Hello {{firstName}}, this is a new message from PrintHub.",
  });

  const [pdfData, setPdfData] = useState({
    pageSize: "A4",
    orientation: "PORTRAIT",
    bodyHtml: "<div class='pdf-body'><h1>{{businessName}}</h1><p>Body content...</p></div>",
  });

  const handlePlaceholderClick = (tag: string) => {
    if (type === "email") {
      if (activeField === "email-subject") {
        emailEditorRef.current?.insertSubject(tag);
      } else {
        // Default to body
        emailEditorRef.current?.insertBody(tag);
      }
    } else if (type === "whatsapp") {
      whatsAppEditorRef.current?.insertText(tag);
    } else if (type === "pdf") {
      pdfEditorRef.current?.insertText(tag);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Template name and slug are required");
      return;
    }

    setLoading(true);
    try {
      let body: any = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
      };

      let endpoint = "";
      
      if (type === "email") {
        endpoint = "/api/admin/content/templates/email";
        body = { ...body, subject: emailData.subject, bodyHtml: emailData.bodyHtml };
      } else if (type === "whatsapp") {
        endpoint = "/api/admin/content/templates/whatsapp";
        body = { ...body, category: whatsAppData.category, bodyText: whatsAppData.bodyText };
      } else if (type === "pdf") {
        endpoint = "/api/admin/content/templates/pdf";
        body = { ...body, bodyHtml: pdfData.bodyHtml };
        // Note: pageSize and orientation might need to be stored in DB if supported
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create template");
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} template created successfully!`);
      
      // Redirect based on type
      if (type === "email") router.push(`/admin/content/email-templates/${formData.slug}`);
      else if (type === "whatsapp") router.push(`/admin/content/templates/whatsapp/${formData.slug}`);
      else if (type === "pdf") router.push(`/admin/content/pdf-templates/${formData.slug}`);
      
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/content/templates" 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Create New Template</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Content editor</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Drafting</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/content/templates">
            <Button variant="ghost" className="gap-2 text-slate-500">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="gap-2 bg-[#D85A30] hover:bg-[#D85A30]/90 text-white font-medium px-6 shadow-sm active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save template
          </Button>
        </div>
      </header>

      {/* Type Switcher / Sub-header */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 min-w-max">
          {(["email", "whatsapp", "pdf"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                type === t 
                  ? "bg-orange-50 text-orange-700 border border-orange-200/50 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95"
              }`}
            >
              {t === "email" && <Mail className="h-4 w-4" />}
              {t === "whatsapp" && <MessageCircle className="h-4 w-4" />}
              {t === "pdf" && <FileText className="h-4 w-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 container max-w-[1600px] mx-auto overflow-hidden">
        {/* Left Panel: Editor Form */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 h-full">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-sm font-semibold text-slate-700">Template name</Label>
              <Input 
                id="template-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Order Confirmation"
                className="h-11 border-slate-200 focus:border-[#D85A30] focus:ring-[#D85A30]/10 rounded-lg transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-slug" className="text-sm font-semibold text-slate-700">Slug (Unique ID)</Label>
              <Input 
                id="template-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="order-confirmation"
                className="h-11 border-slate-200 focus:border-[#D85A30] focus:ring-[#D85A30]/10 rounded-lg transition-all font-mono text-xs bg-slate-50/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description" className="text-sm font-semibold text-slate-700">Description (Internal only - Optional)</Label>
            <Input 
              id="template-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Internal notes about when this template is used..."
              className="h-11 border-slate-200 focus:border-[#D85A30] focus:ring-[#D85A30]/10 rounded-lg transition-all"
            />
          </div>

          <div className="h-px bg-slate-200 my-8" />

          {/* Type-Specific Content Section */}
          <div className="pb-12">
            {type === "email" && (
              <EmailEditor 
                ref={emailEditorRef}
                data={emailData} 
                onChange={setEmailData} 
                onFocusSubject={() => setActiveField("email-subject")}
                onFocusBody={() => setActiveField("email-body")}
              />
            )}
            {type === "whatsapp" && (
              <WhatsAppEditor 
                ref={whatsAppEditorRef}
                data={whatsAppData} 
                onChange={setWhatsAppData} 
                onFocus={() => setActiveField("whatsapp-body")}
              />
            )}
            {type === "pdf" && (
              <PdfEditor 
                ref={pdfEditorRef}
                data={pdfData} 
                onChange={setPdfData} 
                onFocus={() => setActiveField("pdf-body")}
              />
            )}
          </div>
        </div>

        {/* Right Panel: Placeholder Panel / Preview */}
        <PlaceholderPanel 
          type={type} 
          currentEmailData={emailData}
          currentWhatsAppData={whatsAppData}
          currentPdfData={pdfData}
          onInsertEmailBody={(tag) => emailEditorRef.current?.insertBody(tag)}
          onInsertEmailSubject={(tag) => emailEditorRef.current?.insertSubject(tag)}
          onInsertWhatsApp={(tag) => whatsAppEditorRef.current?.insertText(tag)}
          onInsertPdf={(tag) => pdfEditorRef.current?.insertText(tag)}
          onInsertGeneric={handlePlaceholderClick}
        />
      </main>
    </div>
  );
}
