"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, MoreHorizontal, ExternalLink, Pencil, FileText } from "lucide-react";
import { JobListingForm } from "./job-listing-form";
import type { JobListing, JobApplication, JobStatus, ApplicationStatus } from "@prisma/client";

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  ATTACHMENT: "Attachment",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Live",
  PAUSED: "Paused",
  CLOSED: "Closed",
  FILLED: "Filled",
};

const STATUS_CLASS: Record<JobStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PAUSED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CLOSED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  FILLED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview",
  INTERVIEWED: "Interviewed",
  OFFER_MADE: "Offer Made",
  HIRED: "Hired ✓",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

type ListingRow = JobListing & { _count: { applications: number } };
type ApplicationRow = JobApplication & {
  jobListing: { id: string; title: string; department: string; slug: string };
};

export function CareersAdminClient({
  initialListings,
  initialApplications,
  newApplicationsCount,
  initialTab = "listings",
  filterJobId,
}: {
  initialListings: ListingRow[];
  initialApplications: ApplicationRow[];
  newApplicationsCount: number;
  initialTab?: "listings" | "applications";
  filterJobId?: string;
}) {
  const [tab, setTab] = useState<"listings" | "applications">(initialTab);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listings, setListings] = useState(initialListings);
  const [applicationsList, setApplicationsList] = useState(initialApplications);
  void setApplicationsList; // reserved for refetch after mutations
  const applications = filterJobId
    ? applicationsList.filter((a) => a.jobListingId === filterJobId)
    : applicationsList;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function refetchListings() {
    const res = await fetch("/api/admin/careers/listings");
    if (res.ok) {
      const data = await res.json();
      setListings(data);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Careers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} · {applications.length} application
            {applications.length !== 1 ? "s" : ""}
            {newApplicationsCount > 0 && (
              <span className="text-primary font-medium"> · {newApplicationsCount} new</span>
            )}
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Post New Role
        </Button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab("listings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Job Listings ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("applications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "applications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Applications ({applications.length})
        </button>
      </div>

      {tab === "listings" && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Department</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Applications</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Deadline</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((job) => {
                const isExpired =
                  job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
                return (
                  <tr key={job.id} className="border-t">
                    <td className="p-3">
                      <span className="font-medium">{job.title}</span>
                      <div className="text-xs text-muted-foreground font-mono">{job.slug}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{job.department}</Badge>
                    </td>
                    <td className="p-3">{TYPE_LABEL[job.type] ?? job.type}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/careers?tab=applications&jobId=${job.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {job._count.applications}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge className={STATUS_CLASS[job.status]} variant="secondary">
                        {STATUS_LABEL[job.status]}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {job.applicationDeadline ? (
                        <span className={isExpired ? "text-destructive" : ""}>
                          {new Date(job.applicationDeadline).toLocaleDateString()}
                          {isExpired && " (Expired)"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {job.status === "PUBLISHED" && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`${baseUrl}/careers/${job.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View on site
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/careers/listings/${job.id}/edit`} className="gap-2">
                              <Pencil className="h-4 w-4" />
                              Edit listing
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/careers?tab=applications&jobId=${job.id}`}
                              className="gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              View applications ({job._count.applications})
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {listings.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No job listings yet. Click &quot;Post New Role&quot; to add one.
            </div>
          )}
        </div>
      )}

      {tab === "applications" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{applications.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">New</p>
              <p className="text-2xl font-bold text-primary">
                {applications.filter((a) => a.status === "NEW").length}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Shortlisted</p>
              <p className="text-2xl font-bold">
                {applications.filter((a) => a.status === "SHORTLISTED").length}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Hired</p>
              <p className="text-2xl font-bold">
                {applications.filter((a) => a.status === "HIRED").length}
              </p>
            </div>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Applicant</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Applied</th>
                  <th className="text-left p-3 font-medium">CV</th>
                  <th className="w-20 p-3" />
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">
                        {app.firstName} {app.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {app.email} · {app.phone}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{app.jobListing.title}</div>
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        {app.jobListing.department}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{APP_STATUS_LABEL[app.status]}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/api/admin/careers/applications/${app.id}/cv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Download CV
                      </a>
                    </td>
                    <td className="p-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/careers/applications/${app.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                No applications yet.
              </div>
            )}
          </div>
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Post New Role</SheetTitle>
          </SheetHeader>
          <JobListingForm
            onSuccess={() => {
              setSheetOpen(false);
              refetchListings();
            }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
