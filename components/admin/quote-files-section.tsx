"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Box, Download } from "lucide-react";

export type FileMeta = {
  url: string;
  originalName?: string;
  sizeBytes?: number;
  uploadedAt?: string;
};

function isImageUrl(url: string): boolean {
  const u = url.toLowerCase();
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u) || u.includes("image");
}

function is3DFile(url: string): boolean {
  const u = url.toLowerCase();
  return /\.(stl|obj|fbx|3mf|step)(\?|$)/i.test(u);
}

function isDocumentUrl(url: string): boolean {
  const u = url.toLowerCase();
  return /\.(pdf|ai|eps|svg)(\?|$)/i.test(u);
}

/** Derive display name from URL when it follows pattern: .../uuid-OriginalName.ext */
function displayNameFromUrl(url: string, index: number, meta?: FileMeta): string {
  if (meta?.originalName) return meta.originalName;
  try {
    const path = new URL(url).pathname;
    const segment = path.split("/").pop() ?? "";
    const match = segment.match(/^[0-9a-f-]{36}-(.+)$/i);
    if (match) return decodeURIComponent(match[1]);
    if (segment && segment !== "upload") return decodeURIComponent(segment);
  } catch {
    // ignore
  }
  return `File ${index + 1}`;
}

function formatSize(bytes: number | undefined): string {
  if (bytes == null || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Use fixed locale so server and client render the same (avoids hydration mismatch). */
function formatUploadedAt(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function extension(url: string, name: string): string {
  const fromName = name.split(".").pop()?.toUpperCase();
  if (fromName) return fromName;
  const u = url.toLowerCase();
  const m = u.match(/\.(stl|obj|fbx|3mf|step|pdf|ai|eps|svg|jpg|jpeg|png|webp)(\?|$)/);
  return m ? m[1].toUpperCase() : "FILE";
}

export function QuoteFilesSection({
  urls,
  filesMeta,
}: {
  urls: string[];
  filesMeta?: FileMeta[];
}) {
  if (!urls?.length) return null;

  const metaByUrl = (filesMeta ?? []).reduce((acc, f) => {
    acc[f.url] = f;
    return acc;
  }, {} as Record<string, FileMeta>);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Uploaded files</h2>
        <p className="text-xs text-muted-foreground">Download with original filename</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {urls.map((url, i) => {
            const meta = metaByUrl[url];
            const name = displayNameFromUrl(url, i, meta);
            const isImg = isImageUrl(url);
            const is3D = is3DFile(url) || is3DFile(name);
            const isDoc = isDocumentUrl(url) || isDocumentUrl(name);
            const ext = extension(url, name);
            const sizeStr = formatSize(meta?.sizeBytes);
            const uploadedStr = formatUploadedAt(meta?.uploadedAt);

            const Icon = isImg ? ImageIcon : is3D ? Box : FileText;
            const cardTint = is3D ? "border-violet-200 bg-violet-50/50" : isDoc ? "border-red-200 bg-red-50/30" : "border-border bg-muted/30";

            return (
              <div
                key={i}
                className={`rounded-lg border p-4 ${cardTint}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 shrink-0 ${is3D ? "bg-violet-100" : isDoc ? "bg-red-100" : "bg-muted"}`}>
                    <Icon className={`h-6 w-6 ${is3D ? "text-violet-700" : isDoc ? "text-red-700" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" title={name}>
                      {name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ext} · {sizeStr}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {uploadedStr}
                    </p>
                    {isImg && (
                      <div className="mt-2 rounded overflow-hidden bg-muted aspect-video max-h-24">
                        <img src={url} alt={name} className="object-contain w-full h-full" />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      asChild
                    >
                      <a href={url} download={name} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
