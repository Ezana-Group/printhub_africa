"use client";

import { useState, useRef } from "react";

type Job = {
  id: string;
  title: string;
  slug: string;
  customQuestions: unknown;
  applicationDeadline: Date | null;
};

const SOURCE_OPTIONS = [
  { value: "careers_page", label: "PrintHub website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral from someone" },
  { value: "whatsapp_social", label: "WhatsApp/Social" },
  { value: "walk_in", label: "Walk-in" },
  { value: "other", label: "Other" },
];

type CustomQuestion = {
  id: string;
  question: string;
  type: string;
  required?: boolean;
  options?: string[];
};

export function ApplicationForm({ job }: { job: Job }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customQuestions = (job.customQuestions as CustomQuestion[] | null) ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("cv", cvFile ?? "");
    if (source) fd.set("source", source);
    if (source === "referral" && referredBy) fd.set("referredBy", referredBy);

    const answers: Record<string, string> = {};
    customQuestions.forEach((q) => {
      const val = fd.get(`q_${q.id}`);
      if (val != null) answers[q.id] = String(val);
    });
    fd.set("answers", JSON.stringify(answers));

    setStatus("submitting");
    try {
      const res = await fetch(`/api/careers/${job.slug}/apply`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <h2 className="font-display text-3xl font-bold text-white">
          Application Received!
        </h2>
        <p className="font-body text-white/70 mt-4">
          We&apos;ll review your application and get back to you within 5 business
          days.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <a
            href="/careers"
            className="font-body text-primary hover:underline"
          >
            ← Back to Careers
          </a>
          <a
            href="/careers"
            className="font-body text-primary hover:underline"
          >
            View All Open Roles
          </a>
        </div>
      </div>
    );
  }

  const isPastDeadline =
    job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

  if (isPastDeadline) {
    return (
      <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 text-center">
        <p className="font-body text-white/70">
          Applications for this role have closed.
        </p>
        <a href="/careers" className="text-primary mt-2 inline-block hover:underline">
          View other openings
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-white mb-6">
        Apply for This Role
      </h2>
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6"
      >
        <div>
          <label className="block font-body text-sm font-medium text-white/90 mb-1">
            Personal details
          </label>
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <input
              type="text"
              name="firstName"
              required
              minLength={2}
              placeholder="First name *"
              className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
            />
            <input
              type="text"
              name="lastName"
              required
              minLength={2}
              placeholder="Last name *"
              className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
            />
          </div>
          <input
            type="email"
            name="email"
            required
            placeholder="Email address *"
            className="mt-4 w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
          />
          <input
            type="tel"
            name="phone"
            required
            placeholder="Phone (+254 XXX XXX XXX) *"
            className="mt-4 w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
          />
          <input
            type="text"
            name="location"
            placeholder="Where are you based? (e.g. Nairobi, Westlands)"
            className="mt-4 w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-white/90 mb-2">
            Cover letter *
          </label>
          <textarea
            name="coverLetter"
            required
            minLength={100}
            maxLength={2000}
            rows={5}
            placeholder="Tell us why you want this role and what makes you the right fit. Be specific."
            className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm resize-y"
          />
          <p className="font-body text-xs text-white/40 mt-1">
            Min 100 characters, max 2000.
          </p>
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-white/90 mb-2">
            Upload your CV * (PDF only, max 5MB)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-white/30 bg-[#1A1A1A] px-4 py-6 text-white/60 font-body text-sm hover:border-primary/50 hover:text-white/80 transition-colors"
          >
            {cvFile ? (
              <span className="text-white/90">✓ {cvFile.name}</span>
            ) : (
              "Drag and drop or click to browse"
            )}
          </button>
          {!cvFile && (
            <p className="text-red-400 text-xs mt-1">
              PDF required to submit
            </p>
          )}
        </div>

        <div>
          <input
            type="url"
            name="linkedinUrl"
            placeholder="LinkedIn profile (optional)"
            className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
          />
        </div>
        <div>
          <input
            type="url"
            name="portfolioUrl"
            placeholder="Portfolio / Website (optional)"
            className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-3 text-white placeholder:text-white/40 font-body text-sm"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-white/90 mb-2">
            How did you hear about us?
          </label>
          <div className="space-y-2">
            {SOURCE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 font-body text-sm text-white/80">
                <input
                  type="radio"
                  name="source"
                  value={opt.value}
                  checked={source === opt.value}
                  onChange={() => setSource(opt.value)}
                  className="rounded-full border-white/30 text-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {source === "referral" && (
            <input
              type="text"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              placeholder="Who referred you?"
              className="mt-3 w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-2 text-white placeholder:text-white/40 font-body text-sm"
            />
          )}
        </div>

        {customQuestions.length > 0 && (
          <div>
            <label className="block font-body text-sm font-medium text-white/90 mb-2">
              Additional questions
            </label>
            <div className="space-y-4">
              {customQuestions.map((q) => (
                <div key={q.id}>
                  <label className="block font-body text-sm text-white/80 mb-1">
                    {q.question}
                    {q.required && " *"}
                  </label>
                  {q.type === "yes_no" ? (
                    <select
                      name={`q_${q.id}`}
                      required={q.required}
                      className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-2 text-white font-body text-sm"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  ) : q.type === "multiple_choice" && q.options?.length ? (
                    <select
                      name={`q_${q.id}`}
                      required={q.required}
                      className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-2 text-white font-body text-sm"
                    >
                      <option value="">Select</option>
                      {q.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={`q_${q.id}`}
                      required={q.required}
                      className="w-full rounded-lg border border-white/20 bg-[#1A1A1A] px-4 py-2 text-white font-body text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-2 font-body text-sm text-white/80">
            <input type="checkbox" name="consent" value="true" required className="rounded border-white/30 text-primary" />
            I confirm the information I&apos;ve provided is accurate
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-white/80">
            <input type="checkbox" required className="rounded border-white/30 text-primary" />
            I consent to PrintHub storing my data for recruitment purposes. We&apos;ll keep your application for 12 months.
          </label>
        </div>

        {errorMessage && (
          <p className="text-red-400 text-sm">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !cvFile}
          className="w-full rounded-lg bg-primary text-white font-medium py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Submitting…" : "Submit Application →"}
        </button>
      </form>
    </div>
  );
}
