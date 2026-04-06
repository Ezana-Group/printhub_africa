"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

export default function WhatsAppTemplateEditPage({ 
  template 
}: { 
  template: { slug: string, name: string, description: string | null, bodyText: string, category: string | null } 
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [bodyText, setBodyText] = useState(template.bodyText);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(text);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/content/templates/whatsapp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: template.slug, name, description, bodyText }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("saved");
      router.refresh();
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  };

  const VariableCard = ({ label, variables }: { label: string, variables: { key: string, desc: string }[] }) => (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</h3>
      <div className="grid gap-1.5">
        {variables.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => copyToClipboard(`{{${v.key}}}`)}
            className="group flex flex-col items-start p-2 rounded-lg border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left relative overflow-hidden"
          >
            <div className="flex w-full justify-between items-center">
              <code className="text-xs font-bold text-blue-600 group-hover:text-blue-700">{"{{"}{v.key}{"}}"}</code>
              {copyStatus === `{{${v.key}}}` ? (
                <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded animate-in fade-in zoom-in duration-200">COPIED</span>
              ) : (
                <span className="text-[9px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">CLICK TO COPY</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{v.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/templates" },
          { label: "Templates", href: "/admin/content/templates" },
          { label: `Edit ${template.name}` },
        ]}
      />

      <div className="flex items-center justify-between">
        <Link href="/admin/content/templates?tab=whatsapp" className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Templates
        </Link>
        <div className="flex items-center gap-3">
          {message === "saved" && <span className="text-sm text-green-600 font-medium">Changes saved!</span>}
          {message === "error" && <span className="text-sm text-red-600 font-medium">Error saving.</span>}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Side */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h1 className="text-xl font-bold text-slate-900">Edit WhatsApp Template</h1>
              <p className="text-sm text-slate-500 mt-1">Slug: <code className="text-slate-700 font-mono">{template.slug}</code></p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={template.category || "UTILITY"} disabled className="bg-slate-50 italic" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="bodyText">Message Body</Label>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">TEXT ONLY</span>
                </div>
                <Textarea
                  id="bodyText"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your WhatsApp message text here..."
                />
                <p className="text-xs text-slate-400 mt-2">
                  Tips: Use <code className="text-slate-600">*text*</code> for bold, <code className="text-slate-600">_text_</code> for italics.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-6 flex gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                 <MessageCircle className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900">WhatsApp Engine Note</h3>
              <p className="text-sm text-indigo-700/80 mt-1">
                Approved templates are highly recommended for business notifications. For session-based AI replies, formatting is free-form.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Side */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
          <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-1">
            <div className="bg-white rounded-[14px] border border-slate-200 p-5 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                </div>
                <h2 className="font-bold text-slate-800 text-sm">Available Placeholders</h2>
              </div>

              <VariableCard 
                label="Quotes & Numbers" 
                variables={[
                  { key: "quoteNumber", desc: "e.g. Q-2024-001" },
                  { key: "totalAmount", desc: "Grand total with currency" },
                  { key: "depositAmount", desc: "Deposit required" },
                  { key: "balanceAmount", desc: "Remaining balance" },
                  { key: "quoteLink", desc: "Direct payment/view URL" },
                ]} 
              />

              <VariableCard 
                label="Orders & Logistics" 
                variables={[
                  { key: "orderNumber", desc: "e.g. #ORD-5520" },
                  { key: "orderStatus", desc: "Current status (Pending, etc)" },
                  { key: "deliveryDate", desc: "Estimated completion date" },
                ]} 
              />

              <VariableCard 
                label="Customer Info" 
                variables={[
                  { key: "clientName", desc: "Full customer name" },
                  { key: "clientFirst", desc: "Customer first name only" },
                  { key: "clientCompany", desc: "Customer business name" },
                ]} 
              />

              <VariableCard 
                label="Organization" 
                variables={[
                  { key: "companyName", desc: "PrintHub Africa" },
                  { key: "supportPhone", desc: "Official support line" },
                ]} 
              />

              <div className="pt-4 border-t border-slate-100">
                 <p className="text-[10px] text-center text-slate-400 italic">
                   Click any variable to copy it to your clipboard.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline small icon component helper
function MessageCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
