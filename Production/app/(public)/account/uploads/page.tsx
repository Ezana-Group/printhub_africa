"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, File, Image, Box, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadItem = {
  id: string;
  originalName: string;
  sizeBytes: number;
  fileType: string;
  status: string;
  uploadContext: string | null;
  quoteId: string | null;
  rejectionReason: string | null;
  createdAt: string;
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
  });
}

function statusBadge(status: string): string {
  const s = status.toUpperCase();
  if (s === "UPLOADED" || s === "CLEAN" || s === "APPROVED") return "bg-emerald-100 text-emerald-800";
  if (s === "REJECTED" || s === "INFECTED") return "bg-red-100 text-red-800";
  if (s === "UPLOADING" || s === "VIRUS_SCANNING" || s === "PROCESSING") return "bg-amber-100 text-amber-800";
  if (s === "REVIEWING") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  const t = fileType.toUpperCase();
  if (["PNG", "JPEG", "WEBP", "TIFF"].includes(t)) return <Image className="w-8 h-8 text-slate-400" />;
  if (["STL", "OBJ", "THREE_MF", "STEP"].includes(t)) return <Box className="w-8 h-8 text-slate-400" />;
  if (t === "PDF") return <FileText className="w-8 h-8 text-slate-400" />;
  return <File className="w-8 h-8 text-slate-400" />;
}

export default function AccountUploadsPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/uploads")
      .then((r) => r.json())
      .then((data) => setUploads(Array.isArray(data) ? data : []))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  }, []);

  const downloadFile = async (id: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/upload/${id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } catch {
      // ignore
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Uploads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Files you’ve uploaded for quotes and orders. Download or view linked quote.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">
          Loading…
        </div>
      ) : uploads.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <Upload className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-slate-600">No uploads yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Uploads from Get a Quote and orders will appear here.
          </p>
          <Link href="/get-a-quote" className="mt-4 inline-block">
            <Button variant="outline" size="sm">Get a quote</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {uploads.map((file) => (
            <div
              key={file.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <FileTypeIcon fileType={file.fileType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{file.originalName}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.sizeBytes)}</p>
                  <p className="text-xs text-slate-500">{formatDate(file.createdAt)}</p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(file.status)}`}
                  >
                    {file.status.replace(/_/g, " ")}
                  </span>
                  {file.status === "REJECTED" && file.rejectionReason && (
                    <p className="mt-1 text-xs text-red-600">{file.rejectionReason}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(file.id)}
                  disabled={downloadingId === file.id}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
                {file.quoteId && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/account/quotes/${file.quoteId}`}>View quote</Link>
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
