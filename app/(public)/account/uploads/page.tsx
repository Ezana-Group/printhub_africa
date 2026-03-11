"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { File, Image, Box, Download, AlertCircle } from "lucide-react";

interface UploadRow {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  fileType: string;
  status: string;
  virusScanStatus: string | null;
  rejectionReason: string | null;
  createdAt: string;
  quoteId: string | null;
  quoteNumber: string | null;
  orderId: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "UPLOADED" || s === "CLEAN" || s === "APPROVED")
    return "bg-green-100 text-green-800";
  if (s === "INFECTED" || s === "REJECTED") return "bg-red-100 text-red-800";
  if (s === "PENDING_REVIEW" || s === "VIRUS_SCANNING") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function AccountUploadsPage() {
  const { status: authStatus } = useSession();
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/account/uploads")
      .then((res) => (res.ok ? res.json() : { uploads: [] }))
      .then((data) => setUploads(data.uploads ?? []))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  }, [authStatus]);

  const handleDownload = async (id: string) => {
    const res = await fetch(`/api/upload/${id}/download`);
    if (!res.ok) return;
    const { url } = await res.json();
    if (url) window.open(url, "_blank");
  };

  if (authStatus === "unauthenticated" || authStatus === "loading") {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">My Uploads</h1>
      <p className="text-slate-600 mt-1">Files you have uploaded for quotes and orders.</p>
      <Link href="/account" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to account
      </Link>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading uploads...</p>
      ) : uploads.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <File className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-600">No uploads yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            When you attach files to a quote or order, they will appear here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/get-a-quote">Get a quote</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploads.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  {u.mimeType.startsWith("image/") ? (
                    <Image className="h-5 w-5 text-slate-500" aria-hidden alt="" />
                  ) : /\.(stl|obj|3mf)$/i.test(u.originalName) ? (
                    <Box className="h-5 w-5 text-slate-500" />
                  ) : (
                    <File className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{u.originalName}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(u.sizeBytes)} · {formatDate(u.createdAt)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(u.status)}`}
                  >
                    {u.status.replace("_", " ")}
                  </span>
                  {u.status === "REJECTED" && u.rejectionReason && (
                    <p className="mt-2 flex items-start gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {u.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => handleDownload(u.id)}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Download
                </Button>
                {u.quoteId && (
                  <Button variant="outline" size="sm" className="rounded-lg" asChild>
                    <Link href="/account/quotes">View quotes</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
