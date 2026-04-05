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

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
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
              className="min-h-[200px] font-mono text-sm leading-relaxed"
              placeholder="Enter your WhatsApp message text here..."
            />
            <p className="text-xs text-slate-400 mt-2">
              Use <code className="text-slate-600">{"{{variable}}"}</code> notation for dynamic content. 
              WhatsApp templates must be pre-approved in the Meta Business Suite if using the Cloud API for business-initiated messages.
            </p>
          </div>
        </div>
      </div>
      
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-6 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
             <MessageCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-900">WhatsApp Cloud API Note</h3>
          <p className="text-sm text-blue-700/80 mt-1">
            Ensure the slug matches exactly with your template name in the Facebook Developers Portal. 
            For session-based replies (customer initiated), you can use any formatting.
          </p>
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
