"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  File,
  Image,
  Box,
  Download,
  Check,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  type SelectOption,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadItem = {
  id: string;
  originalName: string;
  size: number;
  fileType: string;
  status: string;
  uploadContext: string | null;
  quoteId: string | null;
  rejectionReason: string | null;
  printWeight: number | null;
  printTime: number | null;
  dimensions: unknown;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
  guestEmail: string | null;
  quote: { id: string; quoteNumber: string } | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string): string {
  const s = status.toUpperCase();
  if (s === "UPLOADED" || s === "CLEAN") return "bg-emerald-100 text-emerald-800";
  if (s === "APPROVED") return "bg-blue-100 text-blue-800";
  if (s === "REJECTED" || s === "INFECTED") return "bg-red-100 text-red-800";
  if (s === "UPLOADING" || s === "VIRUS_SCANNING" || s === "PROCESSING") return "bg-amber-100 text-amber-800";
  if (s === "REVIEWING") return "bg-slate-200 text-slate-800";
  return "bg-slate-100 text-slate-700";
}

function contextLabel(ctx: string | null): string {
  if (!ctx) return "—";
  return ctx.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  const t = fileType.toUpperCase();
  if (["PNG", "JPEG", "WEBP", "TIFF"].includes(t)) return <Image className="w-5 h-5 text-slate-400" />;
  if (["STL", "OBJ", "THREE_MF", "STEP"].includes(t)) return <Box className="w-5 h-5 text-slate-400" />;
  if (t === "PDF") return <FileText className="w-5 h-5 text-slate-400" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

const CONTEXT_OPTIONS: SelectOption[] = [
  { value: "", label: "All contexts" },
  { value: "CUSTOMER_3D_PRINT", label: "3D Print" },
  { value: "CUSTOMER_LARGE_FORMAT", label: "Large Format" },
  { value: "CUSTOMER_QUOTE", label: "Quote" },
  { value: "CUSTOMER_PAYMENT_PROOF", label: "Payment Proof" },
  { value: "ADMIN_CATALOGUE_STL", label: "Catalogue STL" },
  { value: "ADMIN_CATALOGUE_PHOTO", label: "Catalogue Photo" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "CLEAN", label: "Clean" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextFilter, setContextFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchUploads = () => {
    const params = new URLSearchParams();
    if (contextFilter) params.set("context", contextFilter);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/uploads?${params}`)
      .then((r) => r.json())
      .then((data) => setUploads(Array.isArray(data) ? data : []))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchUploads();
  }, [contextFilter, statusFilter]);

  const downloadFile = async (id: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/upload/${id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const approveFile = async (id: string) => {
    const res = await fetch(`/api/admin/uploads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    if (res.ok) fetchUploads();
  };

  const rejectFile = async () => {
    if (!rejectModal) return;
    const res = await fetch(`/api/admin/uploads/${rejectModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", rejectionReason: rejectReason || undefined }),
    });
    if (res.ok) {
      setRejectModal(null);
      setRejectReason("");
      fetchUploads();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Uploads Queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Customer and admin uploads. Download, approve, or reject.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={contextFilter}
          onChange={(e) => setContextFilter(e.target.value)}
          options={CONTEXT_OPTIONS}
          className="w-48"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="w-48"
        />
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-12 text-center text-slate-500 shadow-sm">
          Loading…
        </div>
      ) : uploads.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Upload className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-slate-600">No uploads match the filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploads.map((file) => (
            <div
              key={file.id}
              className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <FileTypeIcon fileType={file.fileType} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{file.originalName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(file.status)}`}>
                    {file.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-500">{contextLabel(file.uploadContext)}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {file.user?.name ?? file.user?.email ?? file.guestEmail ?? "Guest"} · {formatBytes(file.size)} · {formatDate(file.createdAt)}
                </p>
                {file.printWeight != null && (
                  <p className="mt-1 text-xs text-slate-500">
                    Weight: ~{file.printWeight}g · Time: ~{file.printTime ?? "—"}h
                    {file.dimensions && typeof file.dimensions === "object" && "x" in file.dimensions && "y" in file.dimensions && "z" in file.dimensions && (
                      <span> · {(file.dimensions as { x: number }).x}×{(file.dimensions as { y: number }).y}×{(file.dimensions as { z: number }).z} mm</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => downloadFile(file.id)} disabled={downloadingId === file.id}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
                {(file.status === "UPLOADED" || file.status === "CLEAN") && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveFile(file.id)}>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRejectModal({ id: file.id, name: file.originalName })}>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {file.quoteId && file.quote && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/quotes/${file.quoteId}`}>View quote</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!rejectModal} onOpenChange={(open) => !open && setRejectModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject upload</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectModal && `Reject "${rejectModal.name}"? Optionally provide a reason (shown to the customer).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Input
              id="reject-reason"
              className="mt-1"
              placeholder="e.g. File format not supported"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={rejectFile} className="bg-red-600 hover:bg-red-700">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
