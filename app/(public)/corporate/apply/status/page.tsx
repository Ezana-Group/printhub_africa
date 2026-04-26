"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

type Application = {
  id: string;
  status: ApplicationStatus;
  companyName: string;
  contactEmail: string;
  createdAt: string;
  rejectedReason: string | null;
};

export default function CorporateApplyStatusPage() {
  const { data: session, status: authStatus } = useSession();
  const [application, setApplication] = useState<Application | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/corporate/application/status")
      .then((res) => res.json())
      .then((data) => {
        setApplication(data.application ?? null);
      })
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [authStatus]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-slate-600 mb-4">Sign in to view your application status.</p>
        <Link href="/login?callbackUrl=/corporate/apply/status" className="text-[#CC3D00] underline">
          Log in
        </Link>
      </div>
    );
  }

  if (application === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">No application found</h1>
        <p className="text-slate-600 mb-6">
          You haven&apos;t submitted a corporate account application yet.
        </p>
        <Link
          href="/corporate/apply"
          className="inline-flex items-center gap-2 rounded-lg bg-[#CC3D00] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#e64500]"
        >
          <Building2 className="w-4 h-4" />
          Apply for a Corporate Account
        </Link>
      </div>
    );
  }

  const createdDate = new Date(application.createdAt).toLocaleDateString("en-KE", {
    dateStyle: "medium",
  });

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#CC3D00]" />
            </div>
            <div>
              <CardTitle>Corporate application</CardTitle>
              <p className="text-sm text-slate-500">{application.companyName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Submitted</span>
            <span className="text-sm font-medium">{createdDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Status</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                application.status === "PENDING"
                  ? "bg-amber-100 text-amber-800"
                  : application.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {application.status === "PENDING" && "Under review"}
              {application.status === "APPROVED" && "Approved"}
              {application.status === "REJECTED" && "Rejected"}
            </span>
          </div>
          {application.status === "PENDING" && (
            <p className="text-sm text-slate-600 pt-2">
              Our team will review your application and contact you at <strong>{application.contactEmail}</strong> within 1 business day.
            </p>
          )}
          {application.status === "REJECTED" && application.rejectedReason && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-800">
              <p className="font-medium mb-1">Reason</p>
              <p>{application.rejectedReason}</p>
            </div>
          )}
          {application.status === "APPROVED" && (
            <p className="text-sm text-slate-600 pt-2">
              Your corporate account is active. You can access it from your account dashboard.
            </p>
          )}
          <div className="pt-4 border-t">
            <Link href="/account" className="text-sm text-[#CC3D00] underline">
              Back to account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
