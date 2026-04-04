"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FileUploader, type UploadedFileResult } from "@/components/upload/FileUploader";

export default function CorporateBrandAssetsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandData, setBrandData] = useState({
    logoImageUrl: "",
    brandGuidelineUrl: "",
    brandNotes: "",
    status: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (authStatus === "authenticated") {
      fetch("/api/account/corporate/brand-assets")
        .then(res => {
          if (res.status === 403) {
            router.push("/account");
            return null;
          }
          if (!res.ok) throw new Error("Failed to load");
          return res.json();
        })
        .then(data => {
            if (data) setBrandData({
                logoImageUrl: data.logoImageUrl || "",
                brandGuidelineUrl: data.brandGuidelineUrl || "",
                brandNotes: data.brandNotes || "",
                status: data.status || "",
            });
        })
        .catch(err => setMessage({ type: "error", text: err.message }))
        .finally(() => setLoading(false));
    }
  }, [authStatus, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch("/api/account/corporate/brand-assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      });
      
      if (!res.ok) throw new Error("Update failed");
      
      setMessage({ type: "success", text: "Brand identity assets saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const onLogoUpload = (files: UploadedFileResult[]) => {
    if (files.length > 0 && files[0].publicUrl) {
        setBrandData(prev => ({ ...prev, logoImageUrl: files[0].publicUrl! }));
    }
  };

  const onGuidelineUpload = (files: UploadedFileResult[]) => {
    if (files.length > 0 && files[0].publicUrl) {
        setBrandData(prev => ({ ...prev, brandGuidelineUrl: files[0].publicUrl! }));
    }
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = brandData.status === "APPROVED";

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 md:px-6">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/account/settings/corporate" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Account
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="space-y-2">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary">
                Corporate Asset Management
            </div>
            <h1 className="font-display text-4xl font-extrabold text-slate-900 leading-tight">
                Brand <span className="text-primary italic">Identity</span> Portal
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
                Store your official branding assets here. Our designers will automatically use these for your custom print projects and quotations.
            </p>
        </div>
      </div>

      {!isApproved && (
         <div className="mb-10 p-5 rounded-2xl border border-amber-200 bg-amber-50/50 flex gap-4 text-sm text-amber-900 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 text-amber-600" />
            <div>
               <p className="font-bold text-base mb-1">Application Pending Approval</p>
               <p className="opacity-90 leading-relaxed text-slate-600">You can upload assets now, but they will only be applied to production workflows once your corporate account status is <span className="font-bold text-amber-700 underline underline-offset-4">APPROVED</span>.</p>
            </div>
         </div>
      )}

      {message && (
        <div className={`mb-10 p-5 rounded-2xl border flex gap-4 items-center text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
             message.type === "success" ? "bg-green-100" : "bg-red-100"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          </div>
          <span className="font-medium text-base">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Logo Section */}
          <Section 
            title="Company Logo" 
            description="Your primary logo for display and print applications. SVG or high-res PNG preferred."
            icon={<ImageIcon className="w-6 h-6 text-primary" />}
          >
             <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-56 h-56 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group relative">
                    {brandData.logoImageUrl ? (
                        <div className="relative w-full h-full p-6">
                            <img src={brandData.logoImageUrl} alt="Company Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Active Logo</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-6">
                            <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] uppercase font-bold text-slate-300 tracking-tighter">No Logo Uploaded</p>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 w-full pt-2">
                    <FileUploader 
                        context="corporate-brand"
                        accept={["image/png", "image/jpeg", "image/svg+xml"]}
                        maxSizeMB={10}
                        onUploadComplete={onLogoUpload}
                        label="Upload New Logo"
                        description="Drag and drop or click to replace current logo."
                    />
                </div>
             </div>
          </Section>

          {/* Guidelines Section */}
          <Section 
            title="Brand Guidelines" 
            description="Upload your corporate identity manual or color palette documentation."
            icon={<FileText className="w-6 h-6 text-primary" />}
          >
             <div className="space-y-6">
                 {brandData.brandGuidelineUrl && (
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900 text-white shadow-lg overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">Current Guidelines Document</p>
                            <a href={brandData.brandGuidelineUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary/80 transition-colors font-mono">View File →</a>
                        </div>
                    </div>
                 )}

                 <FileUploader 
                    context="corporate-guidelines"
                    accept={["application/pdf"]}
                    maxSizeMB={50}
                    onUploadComplete={onGuidelineUpload}
                    label={brandData.brandGuidelineUrl ? "Replace Guidelines" : "Upload Guidelines"}
                    description="Upload a PDF of your brand manual."
                 />
             </div>
          </Section>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className="rounded-[40px] border-none bg-slate-50 shadow-2xl overflow-hidden self-start sticky top-24">
            <CardHeader className="pt-10 pb-6 px-10">
              <CardTitle className="text-2xl font-bold text-slate-900 italic">Designer <span className="text-primary">Brief</span></CardTitle>
              <CardDescription className="text-slate-500 font-medium leading-relaxed">
                Provide specific color codes (Pantone/CMYK) or font requirements for our production team.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10 space-y-8">
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-bold uppercase tracking-widest text-slate-400">Branding Notes</Label>
                <textarea 
                    id="notes"
                    className="w-full min-h-[250px] rounded-[30px] border-none bg-white p-6 text-sm text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none shadow-inner leading-relaxed"
                    placeholder="E.g., Primary Red: Pantone 186 C. Spacing: 20px clear space around logo. Font: Inter Bold."
                    value={brandData.brandNotes || ""}
                    onChange={(e) => setBrandData(prev => ({ ...prev, brandNotes: e.target.value }))}
                />
              </div>

              <div className="space-y-4">
                <Button 
                    onClick={() => handleSave()}
                    className="w-full rounded-[25px] h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all group overflow-hidden relative"
                    disabled={saving}
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {saving ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <Save className="w-5 h-5 relative z-10" />}
                    <span className="relative z-10">{saving ? "Securing Assets..." : "Publish Identity"}</span>
                </Button>
                
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider px-2 leading-relaxed opacity-60">
                    Changes take effect immediately across all live production workflows for this account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, icon, children }: { title: string, description: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
                    <p className="text-sm text-slate-400 font-medium">{description}</p>
                </div>
            </div>
            <div className="pl-0 md:pl-15">
                {children}
            </div>
        </div>
    );
}
