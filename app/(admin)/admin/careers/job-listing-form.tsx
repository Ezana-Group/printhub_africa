"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";

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
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function JobListingForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [department, setDepartment] = useState("Production");
  const [type, setType] = useState("FULL_TIME");
  const [location, setLocation] = useState("Nairobi, Kenya");
  useEffect(() => {
    fetch("/api/settings/business-public")
      .then((r) => r.json())
      .then((d) => {
        const loc = [d?.city, d?.country].filter(Boolean).join(", ");
        if (loc) setLocation(loc);
      })
      .catch(() => {});
  }, []);
  const [isRemote, setIsRemote] = useState(false);
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [niceToHave, setNiceToHave] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [showSalary, setShowSalary] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slug || slug === slugify(title)) setSlug(slugify(v));
  }

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
      const res = await fetch("/api/admin/careers/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          department,
          type,
          location,
          isRemote,
          description,
          responsibilities,
          requirements,
          niceToHave: niceToHave || undefined,
          salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
          showSalary,
          benefits,
          applicationDeadline: applicationDeadline || undefined,
          status,
          isFeatured,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create listing");
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="space-y-2">
        <Label>Job title *</Label>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder="e.g. Print Technician (Large Format)"
        />
      </div>
      <div className="space-y-2">
        <Label>URL slug *</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from title"
        />
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
            onChange={(e) => setType(e.target.value)}
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
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Nairobi, Kenya"
        />
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
        {(showSalary || salaryMin || salaryMax) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min (KES/month)</Label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="45000"
              />
            </div>
            <div>
              <Label>Max (KES/month)</Label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="65000"
              />
            </div>
          </div>
        )}
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
        <div className="mt-1">
          <SmartTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Rich text / markdown"
            minHeight="150px"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Responsibilities *</Label>
        <div className="mt-1">
          <SmartTextEditor
            value={responsibilities}
            onChange={setResponsibilities}
            minHeight="150px"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Requirements *</Label>
        <div className="mt-1">
          <SmartTextEditor
            value={requirements}
            onChange={setRequirements}
            minHeight="150px"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nice to have</Label>
        <div className="mt-1">
          <SmartTextEditor
            value={niceToHave}
            onChange={setNiceToHave}
            minHeight="150px"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Benefits</Label>
        <div className="flex gap-2">
          <Input
            value={benefitInput}
            onChange={(e) => setBenefitInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
            placeholder="e.g. Medical cover"
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
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
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
        <Input
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="SEO title (60 chars)"
          maxLength={60}
        />
      </div>
      <div className="space-y-2">
        <Label>Meta description</Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          placeholder="SEO description (160 chars)"
          maxLength={160}
          className="resize-y"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : status === "PUBLISHED" ? "Publish Now" : "Save as Draft"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
