"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileUp,
  Layout,
  Box,
  MessageSquare,
  Calculator,
  CheckCircle,
  Lightbulb,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerPrintCalculator } from "@/components/calculators/CustomerPrintCalculator";
import { CustomerLFCalculator } from "@/components/calculators/CustomerLFCalculator";
import { FileUploader, type UploadedFileResult } from "@/components/upload/FileUploader";

type ServiceType = "design_and_print" | "large_format" | "3d_print";

const IDEA_DESCRIPTION_MAX = 1000;

const PROJECT_TYPES = [
  { id: "logo", label: "Logo & Brand Identity", emoji: "🎨", description: "Logos, brand kits, visual identity" },
  { id: "banner", label: "Banner / Signage / Display", emoji: "🪧", description: "Outdoor, indoor, events, retail" },
  { id: "marketing", label: "Marketing Materials", emoji: "📄", description: "Flyers, brochures, business cards" },
  { id: "packaging", label: "Packaging & Labels", emoji: "📦", description: "Product packaging, stickers, tags" },
  { id: "merchandise", label: "Custom Merchandise", emoji: "👕", description: "T-shirts, mugs, branded items" },
  { id: "3d_product", label: "3D Printed Product", emoji: "🖨", description: "Prototypes, parts, custom objects" },
  { id: "other", label: "Other", emoji: "✏️", description: "Something else? Tell us below" },
];

const USE_CASE_OPTIONS = [
  "Indoor display",
  "Outdoor signage",
  "Event",
  "Product",
  "Online",
  "Other",
];

const BUDGET_OPTIONS = [
  "Under 5,000",
  "5,000–15,000",
  "15,000–50,000",
  "50,000–100,000",
  "100,000+",
  "Not sure yet",
];

type ThreeDOptions = {
  materials: { id: string; slug: string; name: string; pricePerGram: number }[];
  turnaround: { code: string; name: string; surchargePercent: number }[];
  supportRemoval: { code: string; name: string; pricePerUnit: number }[];
  finishing: { code: string; name: string; pricePerUnit: number }[];
};

export default function GetAQuotePage() {
  const [serviceType, setServiceType] = useState<ServiceType>("design_and_print");
  const [referenceUploadedFiles, setReferenceUploadedFiles] = useState<UploadedFileResult[]>([]);
  const [designUploadedFiles, setDesignUploadedFiles] = useState<UploadedFileResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [, setThreeDOptions] = useState<ThreeDOptions | null>(null);
  const [estimate3dLow, setEstimate3dLow] = useState<number | null>(null);
  const [estimate3dHigh, setEstimate3dHigh] = useState<number | null>(null);
  const [estimateLfLow, setEstimateLfLow] = useState<number | null>(null);
  const [estimateLfHigh, setEstimateLfHigh] = useState<number | null>(null);

  // I Have an Idea form state
  const [projectType, setProjectType] = useState("");
  const [projectTypeOther, setProjectTypeOther] = useState("");
  const [projectName, setProjectName] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [preferredColours, setPreferredColours] = useState("");
  const [hasBrandLogo, setHasBrandLogo] = useState<boolean | null>(null);
  const [logoFile, setLogoFile] = useState<UploadedFileResult | null>(null);
  const [useCase, setUseCase] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState<number | "">(1);
  const [budgetRange, setBudgetRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [preferredResponse, setPreferredResponse] = useState<"email" | "whatsapp" | "phone">("email");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [materialSlug3d, setMaterialSlug3d] = useState("");
  const initialMaterialSlugSet = useRef(false);
  const [quantity3d] = useState(1);
  const [weightG] = useState<number | "">(50);
  const [printTimeHrs] = useState<number | "">(2);
  const [infillPercent] = useState(20);
  const [layerHeightMm] = useState(0.2);
  const [supportCode] = useState("NONE");
  const [supportRemovalCode] = useState("SUP_RM_NONE");
  const [finishingCode3d] = useState("FINISH_RAW");
  const [turnaroundCode3d] = useState("STD_3D");
  const [postProcessing3d] = useState(false);
  const [selectedMaterialName3d, setSelectedMaterialName3d] = useState<string | null>(null);
  const [selectedColor3d, setSelectedColor3d] = useState<string | null>(null);

  const fetchThreeDOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/calculator/3d-print");
      if (!res.ok) return;
      const data = await res.json();
      setThreeDOptions(data);
      if (data.materials?.length && !initialMaterialSlugSet.current) {
        const first = data.materials[0];
        const code = first.slug ?? first.code ?? first.id;
        setMaterialSlug3d(code);
        setSelectedMaterialName3d(first.name ?? null);
        initialMaterialSlugSet.current = true;
      }
    } catch {
      setThreeDOptions(null);
    }
  }, []);

  useEffect(() => {
    if (serviceType !== "3d_print") {
      setOptionsLoading(false);
      return;
    }
    setOptionsLoading(true);
    fetchThreeDOptions().finally(() => setOptionsLoading(false));
  }, [serviceType, fetchThreeDOptions]);

  async function handleIdeaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    if (!contactName.trim() || !contactEmail.trim()) {
      setStatus("error");
      setErrorMsg("Name and email are required.");
      return;
    }
    if (!ideaDescription.trim() || ideaDescription.length < 20) {
      setStatus("error");
      setErrorMsg("Please describe your idea in at least 20 characters.");
      return;
    }
    setStatus("loading");
    try {
      const uploadIds = [
        ...referenceUploadedFiles.map((f) => f.uploadId),
        ...(logoFile ? [logoFile.uploadId] : []),
      ];

      const projectTypeFinal = projectType === "other" ? projectTypeOther : projectType;
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "design_and_print",
          customerName: contactName.trim(),
          customerEmail: contactEmail.trim(),
          customerPhone: contactPhone.trim() || undefined,
          preferredContact: preferredResponse,
          projectName: projectName.trim() || undefined,
          description: ideaDescription.trim(),
          referenceFiles: [],
          uploadIds: uploadIds.length > 0 ? uploadIds : undefined,
          specifications: {
            projectType: projectTypeFinal || undefined,
            preferredColours: preferredColours.trim() || undefined,
            hasBrandLogo: hasBrandLogo ?? undefined,
            useCase: useCase || undefined,
            quantityNeeded: quantityNeeded === "" ? undefined : Number(quantityNeeded),
            budgetRange: budgetRange || undefined,
            deadline: deadline || undefined,
          },
          budgetRange: budgetRange || undefined,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          referralSource: typeof window !== "undefined" ? window.location.search.slice(1) || undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed to submit. Try again.");
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const instructions = formData.get("instructions") as string;
    try {
      const uploadIds = designUploadedFiles.map((f) => f.uploadId);
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: serviceType === "large_format" ? "large_format" : "3d_print",
          customerName: (formData.get("name") as string)?.trim() || "Customer",
          customerEmail: (formData.get("email") as string)?.trim() || "",
          customerPhone: (formData.get("phone") as string)?.trim() || undefined,
          projectName: (formData.get("projectName") as string)?.trim() || undefined,
          description: instructions || undefined,
          referenceFiles: [],
          uploadIds: uploadIds.length > 0 ? uploadIds : undefined,
          specifications: {
            ...(serviceType === "large_format"
              ? {
                  largeFormat: true,
                  estimateLow: estimateLfLow ?? undefined,
                  estimateHigh: estimateLfHigh ?? undefined,
                }
              : {
                  materialSlug: materialSlug3d,
                  materialName: selectedMaterialName3d ?? undefined,
                  color: selectedColor3d ?? undefined,
                  quantity: quantity3d,
                  weightG: typeof weightG === "number" ? weightG : Number(weightG) || 0,
                  printTimeHrs: typeof printTimeHrs === "number" ? printTimeHrs : Number(printTimeHrs) || 0,
                  infillPercent,
                  layerHeightMm,
                  supportCode,
                  supportRemovalCode,
                  finishingCode: finishingCode3d,
                  turnaroundCode: turnaroundCode3d,
                  postProcessing: postProcessing3d,
                  estimateLow: estimate3dLow ?? undefined,
                  estimateHigh: estimate3dHigh ?? undefined,
                }),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        const msg = data.error ?? "Failed to submit.";
        const details = data.details;
        setErrorMsg(details ? `${msg} (${details})` : msg);
        return;
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const steps = [
    { num: 1, label: "Choose service", icon: Layout },
    { num: 2, label: "Options, upload & estimate", icon: Calculator },
    { num: 3, label: "Get your quote", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <header className="text-center mb-10 md:mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Get a Quote
          </h1>
          <p className="mt-3 text-slate-600 text-lg max-w-xl mx-auto">
            No design files yet? Start with &quot;I Have an Idea&quot;. Already have artwork? Choose Large Format or 3D Print for a custom quote within 2 business days.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 md:gap-6">
            {steps.map(({ num, label }) => (
              <div key={num} className="flex items-center gap-2 text-slate-600">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {num}
                </span>
                <span className="text-sm font-medium hidden sm:inline">{label}</span>
                {num < 3 && <span className="text-slate-300 hidden md:inline">→</span>}
              </div>
            ))}
          </div>
        </header>

        <div className="space-y-8">
          {/* Step 1 — Service type: single row of 3 cards */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Step 1 — Service type
            </h2>
            {/* AUDIT FIX: Card order [Large Format] [3D Print] [I Have an Idea]; no blue — orange only */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  setServiceType("large_format");
                  setFiles([]);
                  setStatus("idle");
                  setErrorMsg("");
                }}
                className={`group flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                  serviceType === "large_format" ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 bg-card hover:border-primary/50"
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${serviceType === "large_format" ? "bg-primary text-white" : "bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                  <Layout className="h-6 w-6" />
                </span>
                <div>
                  <span className="font-display font-semibold text-slate-900">Large format print</span>
                  <p className="mt-1 text-sm text-slate-600">Banners, posters, signage — AI, PDF, PSD, EPS, PNG, JPG, SVG</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setServiceType("3d_print");
                  setFiles([]);
                  setStatus("idle");
                  setErrorMsg("");
                }}
                className={`group flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                  serviceType === "3d_print" ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 bg-card hover:border-primary/50"
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${serviceType === "3d_print" ? "bg-primary text-white" : "bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                  <Box className="h-6 w-6" />
                </span>
                <div>
                  <span className="font-display font-semibold text-slate-900">3D print</span>
                  <p className="mt-1 text-sm text-slate-600">Prototypes &amp; parts — STL, OBJ, FBX, 3MF, STEP</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setServiceType("design_and_print");
                  setStatus("idle");
                  setErrorMsg("");
                }}
                className={`group flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                  serviceType === "design_and_print" ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 bg-card hover:border-primary/50"
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${serviceType === "design_and_print" ? "bg-primary text-white" : "bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                  <Lightbulb className="h-6 w-6" />
                </span>
                <div>
                  <span className="font-display font-semibold text-slate-900">I Have an Idea</span>
                  <p className="mt-1 text-sm text-slate-600">No design yet? We design &amp; print for you.</p>
                </div>
              </button>
            </div>
          </section>

          {serviceType === "design_and_print" && (
            <>
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 2a — Project type
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {PROJECT_TYPES.map((pt) => {
                    const selected = projectType === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setProjectType(pt.id)}
                        className={cn(
                          "relative rounded-2xl border-2 p-5 text-left transition-all min-h-[120px]",
                          "hover:border-orange-500 hover:bg-[#FFF5F2]",
                          selected
                            ? "border-orange-500 bg-[#FFF5F2] shadow-sm"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        {selected && (
                          <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </span>
                        )}
                        <span className="text-2xl block mb-2" aria-hidden>{pt.emoji}</span>
                        <span className="font-display font-bold text-slate-900 block text-sm">{pt.label}</span>
                        <span className="text-xs text-slate-500 mt-0.5 block leading-snug">{pt.description}</span>
                      </button>
                    );
                  })}
                </div>
                {projectType === "other" && (
                  <Input
                    className="mt-4 max-w-md rounded-lg border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Describe other project type"
                    value={projectTypeOther}
                    onChange={(e) => setProjectTypeOther(e.target.value)}
                  />
                )}
              </section>

              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 2b — Tell us about your idea
                </h2>
                <form id="idea-form" onSubmit={handleIdeaSubmit}>
                  <div className="rounded-2xl bg-white shadow-sm border border-slate-200 border-l-4 border-l-orange-500 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                      {/* Left column */}
                      <div className="p-6 space-y-5">
                        <div>
                          <Label htmlFor="projectName" className="text-slate-700">Project name</Label>
                          <Input
                            id="projectName"
                            name="projectName"
                            className="mt-1.5 rounded-lg border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. Launch banner"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ideaDescription" className="text-slate-700">Describe your idea in detail *</Label>
                          <p className="text-xs text-slate-500 mt-0.5">The more detail you give us, the more accurate your quote will be.</p>
                          <Textarea
                            id="ideaDescription"
                            name="ideaDescription"
                            required
                            minLength={20}
                            maxLength={IDEA_DESCRIPTION_MAX}
                            rows={6}
                            className="mt-1.5 rounded-lg border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                            value={ideaDescription}
                            onChange={(e) => setIdeaDescription(e.target.value.slice(0, IDEA_DESCRIPTION_MAX))}
                            placeholder="Tell us what you want to achieve, who it's for, what style/feel you're going for..."
                          />
                          <p className="text-xs text-slate-400 text-right mt-0.5">
                            {ideaDescription.length} / {IDEA_DESCRIPTION_MAX}
                          </p>
                        </div>
                        <div>
                          <Label className="text-slate-700">Reference images or inspiration</Label>
                          <FileUploader
                            context="CUSTOMER_QUOTE"
                            accept={["image/jpeg", "image/png", "image/webp", "application/pdf"]}
                            maxSizeMB={20}
                            maxFiles={5}
                            label="Reference images or inspiration"
                            hint="Upload photos, sketches, or anything that shows what you have in mind"
                            onUploadComplete={setReferenceUploadedFiles}
                          />
                        </div>
                      </div>
                      {/* Right column */}
                      <div className="p-6 space-y-5 border-t md:border-t-0 md:border-l border-slate-100">
                        <div>
                          <Label htmlFor="preferredColours" className="text-slate-700">Preferred colours</Label>
                          <Input
                            id="preferredColours"
                            name="preferredColours"
                            className="mt-1.5 rounded-lg border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={preferredColours}
                            onChange={(e) => setPreferredColours(e.target.value)}
                            placeholder="e.g. our brand is blue and gold"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700">Do you have a brand/logo already?</Label>
                          <div className="mt-2 flex gap-2 mb-4">
                            <button
                              type="button"
                              onClick={() => setHasBrandLogo(true)}
                              className={cn(
                                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                                hasBrandLogo === true
                                  ? "bg-[#FF4D00] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHasBrandLogo(false);
                                setLogoFile(null);
                              }}
                              className={cn(
                                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                                hasBrandLogo === false
                                  ? "bg-[#FF4D00] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              No
                            </button>
                          </div>

                          {hasBrandLogo === true && (
                            <FileUploader
                              key="logo-upload"
                              context="CUSTOMER_QUOTE"
                              accept={["image/jpeg", "image/png", "image/svg+xml", "image/webp"]}
                              maxSizeMB={10}
                              maxFiles={1}
                              label="Upload your logo"
                              hint="PNG or SVG with transparent background preferred"
                              onUploadComplete={(files) => setLogoFile(files[0] ?? null)}
                              onRemove={() => setLogoFile(null)}
                            />
                          )}

                          {hasBrandLogo === false && (
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                              No problem — our design team can help create a logo or work with your
                              brand guidelines. Tell us more in the description.
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="useCase" className="text-slate-700">What will this be used for?</Label>
                          <select
                            id="useCase"
                            name="useCase"
                            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={useCase}
                            onChange={(e) => setUseCase(e.target.value)}
                          >
                            <option value="">Select...</option>
                            {USE_CASE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="quantityNeeded" className="text-slate-700">Quantity needed</Label>
                          <div className="mt-1.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuantityNeeded((q) => (q === "" ? 1 : Math.max(1, q - 1)))}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50"
                              aria-label="Decrease"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <Input
                              id="quantityNeeded"
                              name="quantityNeeded"
                              type="number"
                              min={1}
                              className="w-20 rounded-lg border-gray-200 text-center focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={quantityNeeded === "" ? "" : quantityNeeded}
                              onChange={(e) => setQuantityNeeded(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value, 10) || 1))}
                            />
                            <button
                              type="button"
                              onClick={() => setQuantityNeeded((q) => (q === "" ? 1 : q + 1))}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50"
                              aria-label="Increase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="budgetRange" className="text-slate-700">Budget range (KES)</Label>
                          <select
                            id="budgetRange"
                            name="budgetRange"
                            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={budgetRange}
                            onChange={(e) => setBudgetRange(e.target.value)}
                          >
                            <option value="">Select...</option>
                            {BUDGET_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="deadline" className="text-slate-700">Deadline</Label>
                          <Input
                            id="deadline"
                            name="deadline"
                            type="date"
                            className="mt-1.5 rounded-lg border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700">Preferred response</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {([
                              { value: "email" as const, label: "Email", icon: Mail },
                              { value: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
                              { value: "phone" as const, label: "Phone", icon: Phone },
                            ]).map(({ value, label, icon: Icon }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setPreferredResponse(value)}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                                  preferredResponse === value
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 3 — Contact details &amp; submit
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Name *</Label>
                      <Input
                        id="contactName"
                        required
                        className="mt-1 rounded-xl"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        required
                        className="mt-1 rounded-xl"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      className="mt-1 max-w-xs rounded-xl"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                  {status === "success" && (
                    <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <p className="font-medium">
                        We&apos;ve received your idea! Our design team will review it and get back to you within 1 business day with a design brief and quote.
                      </p>
                    </div>
                  )}
                  {status === "error" && <p className="text-red-600">{errorMsg}</p>}
                  <Button
                    type="submit"
                    form="idea-form"
                    disabled={status === "loading"}
                    size="lg"
                    className="rounded-xl px-8"
                  >
                    {status === "loading" ? "Sending…" : "Send My Idea →"}
                  </Button>
                </div>
              </section>
            </>
          )}

          {serviceType !== "design_and_print" && (
            <>
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 2 — Options, upload &amp; estimate
                </h2>
                {optionsLoading && serviceType === "3d_print" && (
                  <Card className="rounded-2xl">
                    <CardContent className="py-10 text-center text-muted-foreground">Loading options…</CardContent>
                  </Card>
                )}
                {(serviceType === "large_format" || (serviceType === "3d_print" && !optionsLoading)) && (
                  <div className="grid lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-0">
                      {serviceType === "large_format" && (
                        <CustomerLFCalculator
                          variant="light"
                          onEstimateChange={(low, high) => {
                            setEstimateLfLow(low);
                            setEstimateLfHigh(high);
                          }}
                        />
                      )}
                      {serviceType === "3d_print" && (
                        <CustomerPrintCalculator
                          variant="light"
                          onEstimateChange={(low, high) => {
                            setEstimate3dLow(low);
                            setEstimate3dHigh(high);
                          }}
                          onMaterialChange={(code, name, color) => {
                            setMaterialSlug3d(code);
                            setSelectedMaterialName3d(name);
                            setSelectedColor3d(color ?? null);
                          }}
                        />
                      )}
                    </div>
                    <div className="space-y-6 lg:sticky lg:top-6">
                      <Card className="rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileUp className="h-5 w-5 text-primary" />
                            Upload your files
                          </CardTitle>
                          <CardDescription>Drag and drop or click to browse</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {serviceType === "large_format" ? (
                            <FileUploader
                              context="CUSTOMER_LARGE_FORMAT"
                              accept={[
                                "application/pdf",
                                "image/png",
                                "image/jpeg",
                                "image/tiff",
                                "image/svg+xml",
                                "application/postscript",
                                "image/vnd.adobe.photoshop",
                                "application/dxf",
                              ]}
                              maxSizeMB={500}
                              maxFiles={3}
                              label="Upload your print file"
                              hint="AI, PDF, PSD, EPS, PNG (300dpi+), SVG, TIFF · Up to 3 files"
                              onUploadComplete={setDesignUploadedFiles}
                            />
                          ) : (
                            <FileUploader
                              context="CUSTOMER_3D_PRINT"
                              accept={[
                                "model/stl",
                                "model/obj",
                                "application/octet-stream",
                                "application/sla",
                              ]}
                              maxSizeMB={500}
                              maxFiles={5}
                              label="Upload your 3D model"
                              hint="STL, OBJ, 3MF, STEP · Up to 5 files · Max 500MB each"
                              onUploadComplete={setDesignUploadedFiles}
                            />
                          )}
                        </CardContent>
                      </Card>
                      {serviceType === "3d_print" ? (
                        <Card className="rounded-2xl border-blue-200 bg-blue-500/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Estimated price</CardTitle>
                            <CardDescription>Indicative only — final quote after we review your files</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {estimate3dLow != null && estimate3dHigh != null ? (
                              <p className="text-2xl font-bold text-blue-700">
                                KES {estimate3dLow.toLocaleString()} – KES {estimate3dHigh.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-600">Enter material, weight &amp; print time to see an estimate.</p>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="rounded-2xl border-primary/20 bg-primary/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Estimated price</CardTitle>
                            <CardDescription>Indicative only — final quote after we review your files</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {estimateLfLow != null && estimateLfHigh != null ? (
                              <p className="text-2xl font-bold text-primary">
                                KES {estimateLfLow.toLocaleString()} – KES {estimateLfHigh.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-600">Enter width, height &amp; material to see an estimate.</p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 3 — Details &amp; submit
                </h2>
                <form onSubmit={handleUploadSubmit} className="space-y-6" suppressHydrationWarning>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" required className="mt-1 rounded-xl" placeholder="Your name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" required className="mt-1 rounded-xl" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" className="mt-1 rounded-xl" placeholder="+254 7XX XXX XXX" />
                  </div>
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Special instructions
                      </CardTitle>
                      <CardDescription>Deadlines, colour matching, or any extra notes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea id="instructions" name="instructions" rows={3} className="rounded-xl resize-none" placeholder="e.g. Need by Friday, match Pantone 286…" />
                    </CardContent>
                  </Card>
                  {status === "success" && (
                    <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <p className="font-medium">We&apos;ve received your request. We&apos;ll review and send a quote within 2 business days.</p>
                    </div>
                  )}
                  {status === "error" && <p className="text-red-600">{errorMsg}</p>}
                  <Button type="submit" disabled={status === "loading" || optionsLoading} size="lg" className="rounded-xl px-8">
                    {status === "loading" ? "Submitting…" : "Submit and get my quote"}
                  </Button>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
