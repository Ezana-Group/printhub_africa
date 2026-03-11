"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobListing } from "@prisma/client";

const DEPARTMENTS = ["Production", "Design", "Sales", "Operations", "Tech", "Other"];
const TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "ATTACHMENT", label: "Attachment" },
];
const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PAUSED", label: "Paused" },
  { value: "CLOSED", label: "Closed" },
  { value: "FILLED", label: "Filled" },
];

export function JobListingEditForm({ listing }: { listing: JobListing }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(listing.title);
  const [slug, setSlug] = useState(listing.slug);
  const [department, setDepartment] = useState(listing.department);
  const [type, setType] = useState(listing.type);
  const [location, setLocation] = useState(listing.location);
  const [isRemote, setIsRemote] = useState(listing.isRemote);
  const [description, setDescription] = useState(listing.description);
  const [responsibilities, setResponsibilities] = useState(listing.responsibilities);
  const [requirements, setRequirements] = useState(listing.requirements);
  const [niceToHave, setNiceToHave] = useState(listing.niceToHave ?? "");
  const [salaryMin, setSalaryMin] = useState(listing.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(listing.salaryMax?.toString() ?? "");
  const [showSalary, setShowSalary] = useState(listing.showSalary);
  const [benefits, setBenefits] = useState<string[]>(
    Array.isArray(listing.benefits) ? listing.benefits.filter((b): b is string => typeof b === "string") : []
  );
  const [benefitInput, setBenefitInput] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState(
    listing.applicationDeadline
      ? new Date(listing.applicationDeadline).toISOString().slice(0, 16)
      : ""
  );
  const [status, setStatus] = useState(listing.status);
  const [isFeatured, setIsFeatured] = useState(listing.isFeatured);
  const [metaTitle, setMetaTitle] = useState(listing.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(listing.metaDescription ?? "");

  function addBenefit() {
    const t = benefitInput.trim();
    if (t && !benefits.includes(t)) {
      setBenefits([...benefits, t]);
      setBenefitInput("");
    }
  }

  function removeBenefit(b: string) {
    setBenefits(benefits.filter((x) => x !== b));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/careers/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          department,
          type,
          location,
          isRemote,
          description,
          responsibilities,
          requirements,
          niceToHave: niceToHave || null,
          salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
          salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
          showSalary,
          benefits,
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
          status,
          isFeatured,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      router.push("/admin/careers");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label>Job title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>URL slug *</Label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Department *</Label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Job type *</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as JobListing["type"])}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRemote"
          checked={isRemote}
          onChange={(e) => setIsRemote(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="isRemote">Remote option</Label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showSalary"
            checked={showSalary}
            onChange={(e) => setShowSalary(e.target.checked)}
            className="rounded border-input"
          />
          <Label htmlFor="showSalary">Show salary to applicants</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Min (KES/month)</Label>
            <Input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
          </div>
          <div>
            <Label>Max (KES/month)</Label>
            <Input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Application deadline</Label>
        <Input
          type="datetime-local"
          value={applicationDeadline}
          onChange={(e) => setApplicationDeadline(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>About this role *</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="resize-y"
        />
      </div>
      <div className="space-y-2">
        <Label>Responsibilities *</Label>
        <Textarea
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          required
          rows={4}
          className="resize-y"
        />
      </div>
      <div className="space-y-2">
        <Label>Requirements *</Label>
        <Textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          required
          rows={4}
          className="resize-y"
        />
      </div>
      <div className="space-y-2">
        <Label>Nice to have</Label>
        <Textarea
          value={niceToHave}
          onChange={(e) => setNiceToHave(e.target.value)}
          rows={2}
          className="resize-y"
        />
      </div>
      <div className="space-y-2">
        <Label>Benefits</Label>
        <div className="flex gap-2">
          <Input
            value={benefitInput}
            onChange={(e) => setBenefitInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
            placeholder="Add benefit"
          />
          <Button type="button" variant="outline" onClick={addBenefit}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {benefits.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {b}
              <button
                type="button"
                onClick={() => removeBenefit(b)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${b}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded border-input"
          />
          <Label htmlFor="isFeatured">Featured listing</Label>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobListing["status"])}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Meta title</Label>
        <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={60} />
      </div>
      <div className="space-y-2">
        <Label>Meta description</Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          maxLength={160}
          className="resize-y"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/careers")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
