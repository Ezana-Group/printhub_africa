"use client";

import { useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
}

export function ProfileSettingsForm({ name, email }: ProfileSettingsFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    // TODO: call API to save profile
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard
        title="Personal Information"
        description="Your name and contact details."
      >
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-lg font-display font-bold text-muted-foreground">
              {name.slice(0, 2).toUpperCase() || "?"}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm">
                Change Photo
              </Button>
              <Button type="button" variant="ghost" size="sm">
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
          <Input id="fullName" name="name" defaultValue={name} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="How we address you in emails"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="flex items-center gap-2">
            <Input id="email" name="email" type="email" defaultValue={email} required />
            <span className="text-sm text-muted-foreground">✓ Verified</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Changing email requires re-verification.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+254 XXX XXX XXX"
          />
          <p className="text-xs text-muted-foreground">
            Used for M-Pesa payments and delivery updates.
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
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
