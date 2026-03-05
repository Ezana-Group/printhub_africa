"use client";

import { useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";

type CorporateStatus = "none" | "pending" | "approved" | "rejected";
const STATUS = "none" as CorporateStatus;

const INDUSTRIES: SelectOption[] = [
  { value: "advertising", label: "Advertising" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
];

const BUDGET_RANGES: SelectOption[] = [
  { value: "0-100k", label: "Under KES 100,000" },
  { value: "100k-500k", label: "KES 100,000 – 500,000" },
  { value: "500k-1m", label: "KES 500,000 – 1M" },
  { value: "1m+", label: "Over KES 1M" },
];

export function CorporateAccountClient() {
  const [showForm, setShowForm] = useState(false);

  if (STATUS === "pending") {
    return (
      <SectionCard
        title="Application under review"
        description="We'll review within 2 business days and contact you by email."
      >
        <p className="text-sm">Submitted: —</p>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline" size="sm">
            View Application
          </Button>
          <Button type="button" variant="ghost" size="sm">
            Withdraw Application
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (STATUS === "approved") {
    return (
      <SectionCard
        title="Corporate account"
        description="Your company is approved for invoice billing."
      >
        <p className="text-sm">Company: —</p>
        <p className="text-sm">Status: ✓ APPROVED</p>
        <p className="text-sm">Account Manager: —</p>
        <p className="text-sm">Credit Limit: KES —</p>
        <p className="text-sm">Payment Terms: NET-30</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button type="button" variant="outline" size="sm">
            Request Credit Limit Increase
          </Button>
          <Button type="button" variant="outline" size="sm">
            Update Company Details
          </Button>
          <Button type="button" variant="link" size="sm">
            View Statements
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (STATUS === "rejected") {
    return (
      <SectionCard
        title="Application not approved"
        description="You can reapply after 90 days or contact us to discuss."
      >
        <p className="text-sm text-muted-foreground">Reason: —</p>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline" size="sm" disabled>
            Reapply (available after 90 days)
          </Button>
          <Button type="button" variant="outline" size="sm">
            Contact Us
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Apply for Corporate Account"
        description="Access NET-30 payment terms, volume pricing, dedicated account manager, priority production, consolidated invoicing, and up to KES 500,000 credit limit."
      >
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>NET-30 payment terms (pay by invoice)</li>
          <li>Volume pricing discounts</li>
          <li>Dedicated account manager</li>
          <li>Priority production queue</li>
          <li>Consolidated monthly invoicing</li>
          <li>Up to KES 500,000 credit limit</li>
        </ul>
        <Button
          type="button"
          className="mt-4"
          onClick={() => setShowForm(true)}
        >
          Apply for Corporate Account
        </Button>
      </SectionCard>

      {showForm && (
        <SectionCard
          title="Corporate account application"
          description="Submit your company details for review."
        >
          <form className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="registrationNumber">Company Registration Number *</Label>
              <Input id="registrationNumber" name="registrationNumber" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kraPin">KRA PIN *</Label>
              <Input id="kraPin" name="kraPin" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select
                id="industry"
                name="industry"
                options={INDUSTRIES}
                placeholder="Select..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="annualBudget">Annual print budget estimate (KES)</Label>
              <Select
                id="annualBudget"
                name="annualBudget"
                options={BUDGET_RANGES}
                placeholder="Select range..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primaryName">Primary contact name *</Label>
              <Input id="primaryName" name="primaryName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primaryEmail">Primary contact email *</Label>
              <Input id="primaryEmail" name="primaryEmail" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primaryPhone">Primary contact phone *</Label>
              <Input id="primaryPhone" name="primaryPhone" type="tel" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthlyValue">Expected monthly order value (KES) *</Label>
              <Input id="monthlyValue" name="monthlyValue" type="number" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hearAbout">How did you hear about us?</Label>
              <Input id="hearAbout" name="hearAbout" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <p className="text-sm text-muted-foreground">
              Upload: Company registration docs / KRA cert (file upload coming)
            </p>
            <div className="flex gap-2">
              <Button type="submit">Submit Application</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
