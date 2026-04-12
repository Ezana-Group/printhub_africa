"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { File, ImageIcon, Box, Download, ExternalLink, Eye, Trash2 } from "lucide-react";

type UploadWithRelations = {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
  fileType: string;
  status: string;
  virusScanStatus: string | null;
  uploadContext: string | null;
  createdAt: Date;
  user: { name: string | null; email: string | null } | null;
  quote: { id: string; quoteNumber: string } | null;
  orderId: string | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(s: string) {
  const u = s.toUpperCase();
  if (u === "UPLOADED" || u === "CLEAN" || u === "APPROVED") return "bg-green-100 text-green-800";
  if (u === "INFECTED" || u === "REJECTED") return "bg-red-100 text-red-800";
  if (u === "VIRUS_SCANNING" || u === "UPLOADING") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export function AdminUploadsClient({
  initialUploads,
  statusCounts,
}: {
  initialUploads: UploadWithRelations[];
  statusCounts: Record<string, number>;
}) {
  const [uploads] = useState(initialUploads);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? uploads
      : uploads.filter((u) => u.status === statusFilter);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this upload? This action cannot be undone.")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/uploads/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete upload.");
      }
    } catch (err) {
      alert("Error deleting upload.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = async (id: string) => {
    const res = await fetch(`/api/upload/${id}/download`);
    if (!res.ok) return;
    const { url } = await res.json();
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            statusFilter === "all"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All ({uploads.length})
        </button>
        {["UPLOADED", "CLEAN", "UPLOADING", "VIRUS_SCANNING", "INFECTED", "REJECTED"].map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {s.replace("_", " ")} ({(statusCounts[s] ?? 0)})
            </button>
          )
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left p-3 font-medium text-slate-700">File</th>
                <th className="text-left p-3 font-medium text-slate-700">Uploader</th>
                <th className="text-left p-3 font-medium text-slate-700">Context</th>
                <th className="text-left p-3 font-medium text-slate-700">Status</th>
                <th className="text-left p-3 font-medium text-slate-700">Date</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-100">
                        {u.mimeType.startsWith("image/") ? (
                          <ImageIcon className="h-4 w-4 text-slate-500" />
                        ) : /stl|obj|3mf/i.test(u.fileType) ? (
                          <Box className="h-4 w-4 text-slate-500" />
                        ) : (
                          <File className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 truncate max-w-[200px]">
                          {u.originalName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(u.size)} · {u.fileType}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">
                    {u.user?.name ?? u.user?.email ?? "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="rounded-md text-xs">
                      {u.uploadContext?.replace(/_/g, " ") ?? "—"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(u.status)}`}
                    >
                      {u.status.replace("_", " ")}
                    </span>
                    {u.virusScanStatus && (
                      <span className="ml-1 text-xs text-slate-500">
                        ({u.virusScanStatus})
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 text-xs">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-8"
                        onClick={() => handleDownload(u.id)}
                        disabled={isDeleting === u.id}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {u.mimeType.startsWith("image/") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8"
                          onClick={() => handleDownload(u.id)}
                          disabled={isDeleting === u.id}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      {u.quote && (
                        <Button variant="ghost" size="sm" className="rounded-lg h-8" asChild>
                          <Link href={`/admin/quotes/${u.quote.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Quote
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-8 text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                        onClick={() => handleDelete(u.id)}
                        disabled={isDeleting === u.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No uploads match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
