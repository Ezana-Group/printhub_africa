"use client";

import { useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, ShieldAlert, Lock } from "lucide-react";

const BUSINESS_TYPES: SelectOption[] = [
  { value: "sole_trader", label: "Sole Trader" },
  { value: "sme", label: "SME" },
  { value: "corporate", label: "Corporate" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

const INDUSTRIES: SelectOption[] = [
  { value: "advertising", label: "Advertising" },
  { value: "real_estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "events", label: "Events" },
  { value: "other", label: "Other" },
];

const LANGUAGES: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
];

const PREFERRED_CONTACT: SelectOption[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "any", label: "Any" },
];

interface ProfileSettingsFormProps {
  name: string;
  email: string;
  isEmailVerified: boolean;
}

export function ProfileSettingsForm({ name, email, isEmailVerified }: ProfileSettingsFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const body: Record<string, string | null> = {};
      const nameVal = formData.get("name");
      if (nameVal != null) body.name = String(nameVal).trim();
      const phoneVal = formData.get("phone");
      body.phone = phoneVal ? String(phoneVal).trim() || null : null;
      const res = await fetch("/api/account/settings/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save profile");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard
        title="Personal Information"
        description="Your name and contact details."
      >
        <div className="relative">
          {/* Header Lock Badges inside the body to avoid title prop issues */}
          {!isEmailVerified && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider font-bold border border-slate-200 shadow-sm">
                <Lock className="w-3 h-3 text-slate-400" /> Locked
              </span>
            </div>
          )}

          {/* Interceptor overlay if unverified */}
          {!isEmailVerified && (
            <div className="absolute inset-0 top-8 z-10 cursor-not-allowed bg-background/20" title="Verify your email to edit your profile"></div>
          )}

          {/* Form Content wrapped in disabled logic */}
          <div className={`space-y-4 ${!isEmailVerified ? "opacity-60 grayscale-[30%] pointer-events-none transition-all duration-500" : "transition-all duration-500"}`}>
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-lg font-display font-bold text-muted-foreground">
                  {name.slice(0, 2).toUpperCase() || "?"}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={!isEmailVerified}>
                    Change Photo
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={!isEmailVerified}>
                    Remove Photo
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Max 5MB, JPG/PNG/WEBP. Shown on account page and order confirmations.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" name="name" defaultValue={name} required disabled={!isEmailVerified} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="How we address you in emails"
                disabled={!isEmailVerified}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+254 XXX XXX XXX"
                disabled={!isEmailVerified}
              />
              <p className="text-xs text-muted-foreground">
                Used for M-Pesa payments and delivery updates.
              </p>
            </div>
          </div>
        </div>

        {/* Email Address - Out of lock boundary */}
        <div className="grid gap-2 pt-6 mt-6 border-t border-slate-100">
          <Label htmlFor="email">Account Email Address *</Label>
          <div className="flex items-center gap-3">
            <Input id="email" name="email" type="email" defaultValue={email} disabled className="max-w-[300px] bg-muted/50" />
            {isEmailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <ShieldCheck className="w-4 h-4" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 font-medium whitespace-nowrap">
                <ShieldAlert className="w-4 h-4" /> Unverified
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Changing your email triggers a new verification link. Updates must be managed through the warning banner.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Business Information (optional)"
        description="Fill this in if you're ordering for a business."
      >
        <div className="grid gap-2">
          <Label htmlFor="companyName">Company / Business Name</Label>
          <Input id="companyName" name="companyName" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="businessType">Business Type</Label>
          <Select
            id="businessType"
            name="businessType"
            options={BUSINESS_TYPES}
            placeholder="Select..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            id="industry"
            name="industry"
            options={INDUSTRIES}
            placeholder="Select..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="kraPin">KRA PIN</Label>
          <Input id="kraPin" name="kraPin" placeholder="Required for VAT invoices over KES 50,000" />
        </div>
      </SectionCard>

      <SectionCard
        title="Preferences"
        description="Language and communication preferences."
      >
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Select
            id="language"
            name="language"
            options={LANGUAGES}
          />
          <p className="text-xs text-muted-foreground">Swahili UI is coming soon.</p>
        </div>
        <div className="grid gap-2">
          <Label>Currency Display</Label>
          <p className="text-sm text-muted-foreground">KES (Kenyan Shilling) — fixed</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="preferredContact">Preferred Contact</Label>
          <Select
            id="preferredContact"
            name="preferredContact"
            options={PREFERRED_CONTACT}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Newsletter</Label>
            <p className="text-xs text-muted-foreground">
              Receive PrintHub news, offers and tips
            </p>
          </div>
          <Switch name="newsletter" />
        </div>
      </SectionCard>

      {saved && (
        <p className="text-sm text-green-600 font-medium">✓ Saved</p>
      )}
      {error && (
        <p className="text-sm text-destructive">✗ Error — {error}</p>
      )}
      <div className="flex items-center gap-4 relative group w-max">
        <Button type="submit" disabled={saving || !isEmailVerified} className="min-w-32">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        
        {/* Tooltip intercept for disabled save button */}
        {!isEmailVerified && (
          <div className="absolute top-full left-0 mt-2 w-max px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
            Verify your email to save changes
          </div>
        )}
      </div>
    </form>
  );
}
