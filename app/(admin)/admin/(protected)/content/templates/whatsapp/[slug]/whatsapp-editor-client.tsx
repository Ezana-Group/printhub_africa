"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Save, Search, Info, ExternalLink, MessageSquare, Briefcase, UserCircle, Calculator, Check, Phone } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const SAMPLE_DATA: Record<string, string> = {
    quoteNumber: "Q-2024-0406",
    totalAmount: "KES 12,500.00",
    finalTotal: "KES 12,500.00",
    depositAmount: "KES 6,250.00",
    balanceAmount: "KES 6,250.00",
    quoteLink: "https://printhub.africa/q/abc123",
    orderNumber: "#ORD-9920",
    orderStatus: "Processing",
    deliveryDate: "April 15th, 2024",
    clientName: "John Doe",
    clientFirst: "John",
    clientCompany: "Alpha Designs Ltd",
    clientPhone: "+254 700 000 000",
    clientEmail: "john@alpha.co.ke",
    companyName: "PrintHub Africa",
    companyPhone: "+254 712 345 678",
    supportPhone: "+254 712 345 678",
    shippingStreet: "Waiyaki Way, Westlands",
    paymentStatus: "Partially Paid",
    orderDate: "April 6th, 2024",
    validUntil: "April 20th, 2024",
    lineItemsDetails: "- 3D Printed Key Holder (x5)\n- Vinyl Banner 1m² (x1)",
  };

  const PLACEHOLDERS = [
    {
      label: "Quotes & Numbers",
      icon: <Calculator className="h-3 w-3" />,
      variables: [
        { key: "quoteNumber", desc: "Quote ID e.g. Q-2024-001" },
        { key: "totalAmount", desc: "Total price with currency" },
        { key: "finalTotal", desc: "Final amount after tax" },
        { key: "depositAmount", desc: "Required deposit" },
        { key: "balanceAmount", desc: "Outstanding balance" },
        { key: "quoteLink", desc: "Direct quote link" },
        { key: "validUntil", desc: "Expiry date of quote" },
      ]
    },
    {
      label: "Orders & Logistics",
      icon: <ExternalLink className="h-3 w-3" />,
      variables: [
        { key: "orderNumber", desc: "Order ID e.g. #ORD-5520" },
        { key: "orderStatus", desc: "Processing, Shipped, etc." },
        { key: "deliveryDate", desc: "Est. delivery date" },
        { key: "shippingStreet", desc: "Customer street address" },
        { key: "orderDate", desc: "Date order was placed" },
        { key: "paymentStatus", desc: "Paid, Unpaid, Pending" },
        { key: "lineItemsDetails", desc: "List of items in order" },
      ]
    },
    {
      label: "Customer Info",
      icon: <UserCircle className="h-3 w-3" />,
      variables: [
        { key: "clientName", desc: "Customer full name" },
        { key: "clientFirst", desc: "First name only" },
        { key: "clientCompany", desc: "Business/Entity name" },
        { key: "clientPhone", desc: "Customer phone number" },
        { key: "clientEmail", desc: "Customer email address" },
      ]
    },
    {
      label: "Organization",
      icon: <Briefcase className="h-3 w-3" />,
      variables: [
        { key: "companyName", desc: "Your business name" },
        { key: "supportPhone", desc: "Customer support line" },
        { key: "companyPhone", desc: "Main office phone" },
      ]
    }
  ];

  const filteredPlaceholders = useMemo(() => {
    if (!searchTerm) return PLACEHOLDERS;
    return PLACEHOLDERS.map(cat => ({
      ...cat,
      variables: cat.variables.filter(v => 
        v.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.desc.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(cat => cat.variables.length > 0);
  }, [searchTerm]);

  const previewBody = useMemo(() => {
    return bodyText.replace(/{{(.*?)}}/g, (match, p1) => {
      const key = p1.trim();
      return SAMPLE_DATA[key] || match;
    }).replace(/\*([^\*]+)\*/g, '<b>$1</b>') // Basic bold support
      .replace(/_([^_]+)_/g, '<i>$1</i>');    // Basic italics support
  }, [bodyText]);

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
                 <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900">WhatsApp Engine Note</h3>
              <p className="text-sm text-indigo-700/80 mt-1 leading-relaxed">
                Approved templates are highly recommended for business notifications. Use <code className="text-indigo-800 font-bold">*text*</code> for bold and <code className="text-indigo-800 font-bold">_text_</code> for italics.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Side */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-[#f0f2f5] rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">ID: 4db55</span>
             </div>
             <div className="p-4 min-h-[160px] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-contain">
                <div className="max-w-[90%] bg-white rounded-t-sm rounded-br-sm rounded-bl-xl p-3 shadow-sm relative ml-1">
                   {/* WhatsApp Bubble Tail */}
                   <div className="absolute top-0 -left-[8px] w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
                   
                   <div 
                     className="text-[13px] text-slate-800 whitespace-pre-wrap break-words leading-relaxed"
                     dangerouslySetInnerHTML={{ __html: previewBody }}
                   />
                   
                   <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-slate-400 mt-1">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                      <div className="flex text-blue-400 mt-1">
                         <Check className="h-3 w-3 -mr-1" />
                         <Check className="h-3 w-3" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Placeholder Library */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-auto lg:h-[calc(100vh-140px)]">
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                  <Calculator className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-800 text-sm">Insert Placeholders</h2>
              </div>
              
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                 <Input 
                   placeholder="Search variables e.g. 'order'..." 
                   className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-xs"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {filteredPlaceholders.map((cat) => (
                <div key={cat.label} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-slate-400">{cat.icon}</span>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</h3>
                  </div>
                  <div className="grid gap-1.5">
                    {cat.variables.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => copyToClipboard(`{{${v.key}}}`)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all text-left relative overflow-hidden ${
                          copyStatus === `{{${v.key}}}` 
                          ? 'border-emerald-200 bg-emerald-50/30' 
                          : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="space-y-0.5">
                           <code className={`text-xs font-bold transition-colors ${
                             copyStatus === `{{${v.key}}}` ? 'text-emerald-700' : 'text-blue-600 group-hover:text-blue-700'
                           }`}>
                             {"{{"}{v.key}{"}}"}
                           </code>
                           <p className="text-[10px] text-slate-500 line-clamp-1">{v.desc}</p>
                        </div>
                        
                        <div className="shrink-0 ml-2">
                           {copyStatus === `{{${v.key}}}` ? (
                             <div className="bg-emerald-500 rounded-full p-0.5">
                                <Check className="h-3 w-3 text-white" />
                             </div>
                           ) : (
                             <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-slate-400 font-bold">+</span>
                             </div>
                           )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredPlaceholders.length === 0 && (
                <div className="py-10 text-center space-y-2">
                   <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Search className="h-5 w-5" />
                   </div>
                   <p className="text-xs text-slate-400">No variables found for "{searchTerm}"</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
               <p className="text-[10px] text-center text-slate-400 italic">
                 Hover over variables to add them to your clipboard.
               </p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
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
