"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Box, Download, Eye, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

export type QuoteUploadedFile = {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  fileType: string;
  createdAt: Date | string;
};

function formatSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: Date | string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function is3DFile(name: string, mime: string): boolean {
  return /\.(stl|obj|fbx|3mf|step|stp)(\?|$)/i.test(name) || /model\/|stl|obj|3mf|step/i.test(mime);
}

export function QuoteUploadedFilesCard({ files }: { files: QuoteUploadedFile[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const list = files ?? [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/uploads/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete file.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Customer uploads</h2>
        <p className="text-xs text-muted-foreground">
          {list.length > 0
            ? "Files attached to this quote. Use Download to open or save."
            : "Files the customer uploaded when submitting this quote."}
        </p>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No files attached to this quote.</p>
        ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {files.map((file) => {
            const is3D = is3DFile(file.originalName, file.mimeType);
            const Icon = is3D ? Box : FileText;
            return (
              <div
                key={file.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  is3D ? "border-violet-200 bg-violet-50/50" : "border-border bg-muted/30"
                }`}
              >
                <div
                  className={`shrink-0 rounded-lg p-2 ${is3D ? "bg-violet-100" : "bg-muted"}`}
                >
                  <Icon
                    className={`h-5 w-5 ${is3D ? "text-violet-700" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.fileType} · {formatSize(file.size)} · {formatDate(file.createdAt)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                      <a
                        href={`/api/upload/${file.id}/download?redirect=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                      <a
                        href={`/api/upload/${file.id}/download?redirect=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={file.originalName}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(file.id, file.originalName)}
                      disabled={deletingId === file.id}
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
