"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Box, Download } from "lucide-react";

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
  return /\.(stl|obj|fbx|3mf|step)(\?|$)/i.test(name) || /model\/|stl|obj|3mf|step/i.test(mime);
}

export function QuoteUploadedFilesCustomer({ files }: { files: QuoteUploadedFile[] }) {
  const list = files ?? [];

  if (list.length === 0) return null;

  return (
    <Card className="border-orange-100 bg-orange-50/5 shadow-sm">
      <CardHeader className="pb-3 border-b border-orange-100/50">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1 rounded bg-orange-100 text-orange-600">
            <Download className="w-4 h-4" />
          </div>
          Your uploaded files
        </h2>
        <p className="text-xs text-slate-500">
          Files you attached to this quote request. Click download to retrieve them.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((file) => {
            const is3D = is3DFile(file.originalName, file.mimeType);
            const Icon = is3D ? Box : FileText;
            return (
              <div
                key={file.id}
                className={`flex items-center gap-4 group rounded-xl border p-4 transition-all hover:shadow-md ${
                  is3D ? "border-violet-100 bg-violet-50/30 hover:border-violet-300" : "border-slate-100 bg-white hover:border-orange-200"
                }`}
              >
                <div
                  className={`shrink-0 rounded-xl p-3 transition-colors ${is3D ? "bg-violet-100 text-violet-700" : "bg-orange-50 text-orange-600"}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate text-slate-900 leading-tight mb-1" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {file.fileType} · {formatSize(file.size)}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 h-8 border-slate-200 hover:border-orange-500 hover:text-orange-600 rounded-lg group" asChild>
                    <a
                      href={`/api/upload/${file.id}/download?redirect=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.originalName}
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
