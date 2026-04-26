"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { KENYA_COUNTIES } from "@/lib/constants/kenya-counties";

const INDUSTRY_OPTIONS = [
  { value: "ADVERTISING_MARKETING", label: "Advertising & Marketing" },
  { value: "ARCHITECTURE_CONSTRUCTION", label: "Architecture & Construction" },
  { value: "EDUCATION", label: "Education" },
  { value: "EVENTS_HOSPITALITY", label: "Events & Hospitality" },
  { value: "FINANCIAL_SERVICES", label: "Financial Services" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "LOGISTICS_TRANSPORT", label: "Logistics & Transport" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "NGO_NONPROFIT", label: "NGO & Non-profit" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "RETAIL_ECOMMERCE", label: "Retail & E-commerce" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "MEDIA_PUBLISHING", label: "Media & Publishing" },
  { value: "OTHER", label: "Other" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "SOLO", label: "Solo (1 person)" },
  { value: "SMALL", label: "Small (2–10)" },
  { value: "MEDIUM", label: "Medium (11–50)" },
  { value: "LARGE", label: "Large (51–200)" },
  { value: "ENTERPRISE", label: "Enterprise (200+)" },
];

const BUDGET_OPTIONS = [
  { value: "Under KES 10,000", label: "Under KES 10,000" },
  { value: "KES 10,000 – 50,000", label: "KES 10,000 – 50,000" },
  { value: "KES 50,000 – 200,000", label: "KES 50,000 – 200,000" },
  { value: "KES 200,000 – 500,000", label: "KES 200,000 – 500,000" },
  { value: "Over KES 500,000", label: "Over KES 500,000" },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "PREPAID", label: "Pay upfront (standard)" },
  { value: "NET_14", label: "NET-14 (pay within 14 days of invoice)" },
  { value: "NET_30", label: "NET-30 (pay within 30 days of invoice)" },
  { value: "NET_60", label: "NET-60 (pay within 60 days of invoice)" },
];

const COUNTY_OPTIONS = KENYA_COUNTIES.map((c) => ({ value: c, label: c }));

type FormData = {
  companyName: string;
  tradingName: string;
  kraPin: string;
  vatNumber: string;
  industry: string;
  companySize: string;
  website: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingPostalCode: string;
  sameAsBilling: boolean;
  physicalAddress: string;
  physicalCity: string;
  physicalCounty: string;
  estimatedMonthlySpend: string;
  creditRequested: string;
  paymentTermsRequested: string;
  additionalNotes: string;
  termsAccepted: boolean;
};

const emptyForm: FormData = {
  companyName: "",
  tradingName: "",
  kraPin: "",
  vatNumber: "",
  industry: "",
  companySize: "",
  website: "",
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  billingAddress: "",
  billingCity: "",
  billingCounty: "",
  billingPostalCode: "",
  sameAsBilling: true,
  physicalAddress: "",
  physicalCity: "",
  physicalCounty: "",
  estimatedMonthlySpend: "",
  creditRequested: "",
  paymentTermsRequested: "PREPAID",
  additionalNotes: "",
  termsAccepted: false,
};

export function CorporateApplyForm() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- applicationRef used in success JSX below
  const [applicationRef, setApplicationRef] = useState("");

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const canStep1 =
    form.companyName.trim().length >= 2 &&
    /^[PA]\d{9}[A-Z]$/i.test(form.kraPin.replace(/\s/g, "")) &&
    form.industry &&
    form.companySize;
  const canStep2 =
    form.contactPerson.trim().length >= 2 &&
    form.contactEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail) &&
    form.billingAddress.trim() &&
    form.billingCity.trim() &&
    form.billingCounty;
  const canStep3 = form.estimatedMonthlySpend.length > 0;
  const canStep4 = form.termsAccepted;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const kraPin = form.kraPin.replace(/\s/g, "").toUpperCase();
      const phone = form.contactPhone.replace(/\D/g, "");
      const normalizedPhone = phone.startsWith("254") ? `+${phone}` : phone.length === 9 ? `+254${phone}` : form.contactPhone;
      const res = await fetch("/api/corporate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          tradingName: form.tradingName.trim() || undefined,
          kraPin,
          vatNumber: form.vatNumber.trim() || undefined,
          industry: form.industry,
          companySize: form.companySize,
          website: form.website.trim() || undefined,
          contactPerson: form.contactPerson.trim(),
          contactPhone: normalizedPhone,
          contactEmail: form.contactEmail.trim(),
          billingAddress: form.billingAddress.trim(),
          billingCity: form.billingCity.trim(),
          billingCounty: form.billingCounty.trim(),
          estimatedMonthlySpend: form.estimatedMonthlySpend,
          creditRequested: form.creditRequested ? parseInt(form.creditRequested, 10) : undefined,
          paymentTermsRequested: form.paymentTermsRequested === "PREPAID" ? undefined : form.paymentTermsRequested,
          additionalNotes: form.additionalNotes.trim() || undefined,
          termsAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }
      setApplicationRef(data.applicationRef ?? "");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
        <p className="text-slate-600 mb-2">
          Thank you, {form.contactPerson || "there"}. We&apos;ve received your corporate account application for{" "}
          <strong>{form.companyName}</strong>
          {applicationRef ? ` (ref: ${applicationRef})` : ""}.
        </p>
        <p className="text-slate-600 mb-6">
          Our team will review your application and respond to <strong>{form.contactEmail}</strong> within 1 business day.
        </p>
        <div className="bg-orange-50 rounded-2xl p-5 text-left mb-8 border border-orange-100">
          <p className="text-sm font-semibold text-slate-900 mb-2">What happens next?</p>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
            <li>Our team reviews your application (1 business day)</li>
            <li>We may contact you for additional information</li>
            <li>On approval: you receive your corporate account number and login details</li>
            <li>Immediately access corporate pricing and start placing orders</li>
          </ol>
        </div>
        <Link href="/account" className="text-sm text-[#CC3D00] underline">
          Return to your account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${step >= s ? "bg-[#CC3D00]" : "bg-slate-200"}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Step {step} of 4:{" "}
        {step === 1 && "Company Information"}
        {step === 2 && "Contact & Billing"}
        {step === 3 && "Account Requirements"}
        {step === 4 && "Review & Submit"}
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Company information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company name *</Label>
              <Input
                value={form.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
                placeholder="Acme Corporation Ltd"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Trading name (optional)</Label>
              <Input
                value={form.tradingName}
                onChange={(e) => update({ tradingName: e.target.value })}
                placeholder="Leave blank if same as company name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>KRA PIN *</Label>
              <Input
                value={form.kraPin}
                onChange={(e) => update({ kraPin: e.target.value.toUpperCase().slice(0, 11) })}
                placeholder="P051234567X"
                className="mt-1 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">P or A, 9 digits, then a letter. Found on your KRA Tax Compliance Certificate.</p>
            </div>
            <div>
              <Label>VAT number (optional)</Label>
              <Input
                value={form.vatNumber}
                onChange={(e) => update({ vatNumber: e.target.value })}
                placeholder="If VAT registered"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Industry *</Label>
              <Select
                value={form.industry}
                onChange={(e) => update({ industry: e.target.value })}
                options={INDUSTRY_OPTIONS}
                placeholder="Select industry"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Company size *</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPANY_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ companySize: opt.value })}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition ${
                      form.companySize === opt.value ? "border-[#CC3D00] bg-orange-50 text-[#CC3D00]" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Company website (optional)</Label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => update({ website: e.target.value })}
                placeholder="https://yourcompany.co.ke"
                className="mt-1"
              />
            </div>
            <Button type="button" onClick={() => setStep(2)} disabled={!canStep1} className="w-full">
              Continue →
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact & billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Contact person *</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => update({ contactPerson: e.target.value })}
                placeholder="Main person we'll deal with"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Contact phone *</Label>
              <Input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update({ contactPhone: e.target.value })}
                placeholder="+254 7XX XXX XXX"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Contact email *</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
                placeholder="billing@company.co.ke"
                className="mt-1"
              />
              {session?.user?.email && (
                <p className="text-xs text-slate-500 mt-1">Logged in as {session.user.email}. You can use a different email for billing.</p>
              )}
            </div>
            <div>
              <Label>Billing address *</Label>
              <Textarea
                value={form.billingAddress}
                onChange={(e) => update({ billingAddress: e.target.value })}
                placeholder="Street address"
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input value={form.billingCity} onChange={(e) => update({ billingCity: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>County *</Label>
                <Select
                  value={form.billingCounty}
                  onChange={(e) => update({ billingCounty: e.target.value })}
                  options={COUNTY_OPTIONS}
                  placeholder="Select county"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Postal code (optional)</Label>
              <Input value={form.billingPostalCode} onChange={(e) => update({ billingPostalCode: e.target.value })} className="mt-1" />
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={!canStep2} className="flex-1">
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Account requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Estimated monthly printing budget *</Label>
              <Select
                value={form.estimatedMonthlySpend}
                onChange={(e) => update({ estimatedMonthlySpend: e.target.value })}
                options={BUDGET_OPTIONS}
                placeholder="Select range"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Credit limit requested (optional, KES)</Label>
              <Input
                type="number"
                min={0}
                value={form.creditRequested}
                onChange={(e) => update({ creditRequested: e.target.value })}
                placeholder="e.g. 500000"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">We&apos;ll review this. Approval depends on order history and payment record.</p>
            </div>
            <div>
              <Label>Payment terms requested</Label>
              <div className="mt-2 space-y-2">
                {PAYMENT_TERMS_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={form.paymentTermsRequested === opt.value}
                      onChange={() => update({ paymentTermsRequested: opt.value })}
                      className="rounded-full"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Additional notes (optional)</Label>
              <Textarea
                value={form.additionalNotes}
                onChange={(e) => update({ additionalNotes: e.target.value })}
                placeholder="Anything else about your printing needs"
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button type="button" onClick={() => setStep(4)} disabled={!canStep3} className="flex-1">
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <p><strong>Company:</strong> {form.companyName} · KRA: {form.kraPin} · {INDUSTRY_OPTIONS.find((i) => i.value === form.industry)?.label ?? form.industry}</p>
              <p><strong>Contact:</strong> {form.contactPerson} · {form.contactPhone} · {form.contactEmail}</p>
              <p><strong>Billing:</strong> {form.billingAddress}, {form.billingCity}, {form.billingCounty}</p>
              <p><strong>Budget:</strong> {form.estimatedMonthlySpend} · Credit requested: {form.creditRequested ? `KES ${Number(form.creditRequested).toLocaleString()}` : "None"} · Terms: {PAYMENT_TERMS_OPTIONS.find((t) => t.value === form.paymentTermsRequested)?.label ?? form.paymentTermsRequested}</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => update({ termsAccepted: e.target.checked })}
                className="mt-1 rounded accent-[#CC3D00]"
                required
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                I confirm I have authority to bind <strong>{form.companyName}</strong> to PrintHub&apos;s{" "}
                <Link href="/corporate-terms" target="_blank" rel="noopener noreferrer" className="text-[#CC3D00] underline">Corporate Account Terms and Conditions</Link>
                {" "}and the incorporated{" "}
                <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-[#CC3D00] underline">Terms of Service</Link>.
                I confirm the information I have provided is accurate and complete.
              </span>
            </label>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                ← Back
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!canStep4 || loading} className="flex-1">
                {loading ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
