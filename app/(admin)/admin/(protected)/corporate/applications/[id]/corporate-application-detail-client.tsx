"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Application = {
  id: string;
  companyName: string;
  tradingName: string | null;
  kraPin: string;
  vatNumber: string | null;
  industry: string;
  companySize: string;
  website: string | null;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  estimatedMonthlySpend: string;
  creditRequested: number | null;
  paymentTermsRequested: string | null;
  additionalNotes: string | null;
  status: string;
  rejectedReason: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
  applicant: { id: string; name: string | null; email: string | null };
};

const INDUSTRY_LABELS: Record<string, string> = {
  ADVERTISING_MARKETING: "Advertising & Marketing",
  ARCHITECTURE_CONSTRUCTION: "Architecture & Construction",
  EDUCATION: "Education",
  EVENTS_HOSPITALITY: "Events & Hospitality",
  FINANCIAL_SERVICES: "Financial Services",
  GOVERNMENT: "Government",
  HEALTHCARE: "Healthcare",
  LOGISTICS_TRANSPORT: "Logistics & Transport",
  MANUFACTURING: "Manufacturing",
  NGO_NONPROFIT: "NGO & Non-profit",
  REAL_ESTATE: "Real Estate",
  RETAIL_ECOMMERCE: "Retail & E-commerce",
  TECHNOLOGY: "Technology",
  MEDIA_PUBLISHING: "Media & Publishing",
  OTHER: "Other",
};

const COMPANY_SIZE_LABELS: Record<string, string> = {
  SOLO: "Solo (1)",
  SMALL: "Small (2–10)",
  MEDIUM: "Medium (11–50)",
  LARGE: "Large (51–200)",
  ENTERPRISE: "Enterprise (200+)",
};

export function CorporateApplicationDetailClient({
  application,
}: {
  application: Application;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState("");

  const isPending = application.status === "PENDING";

  async function handleApprove() {
    setError("");
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/corporate/applications/${application.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to approve");
        return;
      }
      router.refresh();
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setError("");
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/corporate/applications/${application.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedReason: rejectReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to reject");
        return;
      }
      setShowRejectForm(false);
      setRejectReason("");
      router.refresh();
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{application.companyName}</CardTitle>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                  application.status === "PENDING" && "bg-amber-100 text-amber-800",
                  application.status === "APPROVED" && "bg-green-100 text-green-800",
                  application.status === "REJECTED" && "bg-red-100 text-red-800"
                )}
              >
                {application.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Company</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Trading name</dt>
                <dd>{application.tradingName || "—"}</dd>
                <dt className="text-muted-foreground">KRA PIN</dt>
                <dd className="font-mono">{application.kraPin}</dd>
                <dt className="text-muted-foreground">VAT number</dt>
                <dd>{application.vatNumber || "—"}</dd>
                <dt className="text-muted-foreground">Industry</dt>
                <dd>{INDUSTRY_LABELS[application.industry] ?? application.industry}</dd>
                <dt className="text-muted-foreground">Company size</dt>
                <dd>{COMPANY_SIZE_LABELS[application.companySize] ?? application.companySize}</dd>
                <dt className="text-muted-foreground">Website</dt>
                <dd>
                  {application.website ? (
                    <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {application.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Person</dt>
                <dd>{application.contactPerson}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{application.contactPhone}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{application.contactEmail}</dd>
                <dt className="text-muted-foreground">Applicant (login)</dt>
                <dd>{application.applicant.email ?? application.applicant.name ?? "—"}</dd>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Billing address</h3>
              <p className="text-sm">
                {application.billingAddress}, {application.billingCity}, {application.billingCounty}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account requirements</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Estimated monthly spend</dt>
                <dd>{application.estimatedMonthlySpend}</dd>
                <dt className="text-muted-foreground">Credit requested</dt>
                <dd>{application.creditRequested != null ? `KES ${application.creditRequested.toLocaleString()}` : "—"}</dd>
                <dt className="text-muted-foreground">Payment terms requested</dt>
                <dd>{application.paymentTermsRequested ?? "—"}</dd>
              </dl>
              {application.additionalNotes && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Additional notes</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{application.additionalNotes}</p>
                </div>
              )}
            </div>
            {application.status === "REJECTED" && application.rejectedReason && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                <p className="text-sm font-medium text-red-800">Rejection reason</p>
                <p className="text-sm text-red-700 mt-1">{application.rejectedReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">
              Applied {new Date(application.createdAt).toLocaleString()}
            </p>
            {application.reviewedAt && (
              <p className="text-sm text-muted-foreground">
                Reviewed {new Date(application.reviewedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        {isPending && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                  {error}
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleApprove}
                disabled={approving}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {approving ? "Approving…" : "Approve"}
              </Button>
              {!showRejectForm ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowRejectForm(true)}
                  disabled={rejecting}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              ) : (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  <Textarea
                    placeholder="Reason for rejection (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReject}
                      disabled={rejecting}
                    >
                      {rejecting ? "Rejecting…" : "Confirm reject"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      disabled={rejecting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
