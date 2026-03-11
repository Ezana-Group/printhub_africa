"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobApplication, ApplicationStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview scheduled" },
  { value: "INTERVIEWED", label: "Interviewed" },
  { value: "OFFER_MADE", label: "Offer made" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

type AppWithJob = JobApplication & { jobListing: { title: string; slug: string } };

export function ApplicationDetailClient({ application: initial }: { application: AppWithJob }) {
  const [application, setApplication] = useState(initial);
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/careers/applications/${application.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplication(updated);
        setNote("");
      }
    } finally {
      setAddingNote(false);
    }
  }

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/careers/applications/${application.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplication(updated);
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  const answers = (application.answers as Record<string, string> | null) ?? {};

  return (
    <div className="grid lg:grid-cols-[65%_35%] gap-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 rounded-full bg-primary/20 items-center justify-center font-display font-bold text-primary">
            {application.firstName[0]}
            {application.lastName[0]}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">
              {application.firstName} {application.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{application.email}</p>
            <p className="text-sm text-muted-foreground">{application.phone}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Applied: {new Date(application.createdAt).toLocaleString()} ·{" "}
              {application.jobListing.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={application.status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              disabled={statusUpdating}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <a
              href={`/api/admin/careers/applications/${application.id}/cv`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Download CV
              </Button>
            </a>
          </div>
        </div>

        <section className="rounded-lg border p-4">
          <h2 className="font-display font-semibold mb-2">Cover letter</h2>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {application.coverLetter}
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-display font-semibold mb-2">Details</h2>
          <dl className="text-sm space-y-1">
            <dt className="text-muted-foreground">How they heard about us</dt>
            <dd>{application.source ?? "—"}</dd>
            {application.source === "referral" && (
              <>
                <dt className="text-muted-foreground mt-2">Referred by</dt>
                <dd>{application.referredBy ?? "—"}</dd>
              </>
            )}
            {application.linkedinUrl && (
              <>
                <dt className="text-muted-foreground mt-2">LinkedIn</dt>
                <dd>
                  <a
                    href={application.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {application.linkedinUrl}
                  </a>
                </dd>
              </>
            )}
            {application.portfolioUrl && (
              <>
                <dt className="text-muted-foreground mt-2">Portfolio</dt>
                <dd>
                  <a
                    href={application.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {application.portfolioUrl}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </section>

        {Object.keys(answers).length > 0 && (
          <section className="rounded-lg border p-4">
            <h2 className="font-display font-semibold mb-2">Custom question answers</h2>
            <dl className="text-sm space-y-2">
              {Object.entries(answers).map(([qId, answer]) => (
                <div key={qId}>
                  <dt className="text-muted-foreground">Q: {qId}</dt>
                  <dd>{String(answer)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="font-display font-semibold mb-2">Internal notes</h2>
          <form onSubmit={handleAddNote} className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="resize-y"
            />
            <Button type="submit" size="sm" disabled={addingNote || !note.trim()}>
              {addingNote ? "Saving…" : "Add note"}
            </Button>
          </form>
          {application.internalNotes && (
            <div className="mt-4 pt-4 border-t text-sm whitespace-pre-wrap text-muted-foreground">
              {application.internalNotes}
            </div>
          )}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-display font-semibold mb-2">Actions</h2>
          <div className="flex flex-col gap-2">
            <select
              value={application.status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              disabled={statusUpdating}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/api/admin/careers/applications/${application.id}/cv`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download CV
              </a>
            </Button>
            <Link href={`/careers/${application.jobListing.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="w-full">
                View job on site
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
