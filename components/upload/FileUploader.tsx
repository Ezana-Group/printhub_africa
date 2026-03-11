"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Check, AlertCircle, File, Image, Box } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FileUploaderProps {
  context: string;
  accept: string[];
  maxSizeMB: number;
  maxFiles?: number;
  label?: string;
  description?: string;
  quoteId?: string;
  orderId?: string;
  guestEmail?: string;
  onUploadComplete?: (files: UploadedFileResult[]) => void;
  onUploadError?: (error: string) => void;
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface UploadedFileResult {
  uploadId: string;
  storageKey: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  url?: string;
}

type FileState = {
  file: File;
  id: string;
  status: "pending" | "uploading" | "confirming" | "done" | "error";
  progress: number;
  error?: string;
  result?: UploadedFileResult;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };

    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.send(file);
  });
}

function FileRow({
  fileState,
  onRemove,
}: {
  fileState: FileState;
  onRemove: () => void;
}) {
  const f = fileState;
  const icon =
    f.file.type.startsWith("image/") ? Image :
    /\.(stl|obj|3mf|step)$/i.test(f.file.name) ? Box : File;

  const Icon = icon;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{f.file.name}</p>
        <p className="text-xs text-slate-500">{formatBytes(f.file.size)}</p>
        {(f.status === "uploading" || f.status === "confirming") && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${f.progress}%` }}
            />
          </div>
        )}
        <p
          className={`mt-0.5 text-xs ${
            f.status === "done"
              ? "text-green-600"
              : f.status === "error"
                ? "text-red-500"
                : "text-slate-500"
          }`}
        >
          {f.status === "uploading" && `Uploading... ${Math.round(f.progress)}%`}
          {f.status === "confirming" && "Finishing..."}
          {f.status === "done" && "Uploaded successfully"}
          {f.status === "error" && (f.error ?? "Upload failed")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {f.status === "done" && <Check className="h-5 w-5 text-green-500" />}
        {f.status === "error" && <AlertCircle className="h-5 w-5 text-red-400" />}
        {(f.status === "done" || f.status === "error") && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-slate-400 hover:text-slate-600"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FileUploader({
  context,
  accept,
  maxSizeMB,
  maxFiles = 1,
  label,
  description,
  quoteId,
  orderId,
  guestEmail,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowed = accept.includes(file.type) || accept.includes("*/*");
    if (!allowed) {
      const exts = accept.map((t) => t.split("/")[1]).join(", ");
      return `File type not allowed. Accepted: ${exts}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File, fileId: string) => {
      const updateFile = (updates: Partial<FileState>) =>
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f))
        );

      try {
        updateFile({ status: "uploading", progress: 5 });

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            context,
            quoteId: quoteId ?? undefined,
            orderId: orderId ?? undefined,
            guestEmail: guestEmail ?? undefined,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to get upload URL");
        }

        const { uploadId, presignedUrl, storageKey, bucket } = await presignRes.json();

        await uploadWithProgress(presignedUrl, file, (progress) =>
          updateFile({ progress: 5 + progress * 90 })
        );

        updateFile({ status: "confirming", progress: 97 });

        const confirmRes = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, storageKey }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload confirmation failed");
        }

        const data = await confirmRes.json();
        const result: UploadedFileResult = {
          uploadId: data.file.id,
          storageKey: data.file.storageKey,
          originalName: file.name,
          sizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
          url: data.file.url ?? undefined,
        };

        updateFile({ status: "done", progress: 100, result });

        setFiles((prev) => {
          const next = prev.map((f) =>
            f.id === fileId ? { ...f, status: "done" as const, progress: 100, result } : f
          );
          const allDone = next
            .filter((f) => f.status === "done" && f.result)
            .map((f) => f.result!);
          onUploadComplete?.(allDone);
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateFile({ status: "error", error: message });
        onUploadError?.(message);
      }
    },
    [context, quoteId, orderId, guestEmail, files, onUploadComplete, onUploadError]
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles);
      const doneCount = files.filter((f) => f.status === "done").length;
      const remaining = Math.max(0, maxFiles - doneCount);
      const toAdd = arr.slice(0, remaining);

      const newStates: FileState[] = toAdd.map((file) => {
        const id = crypto.randomUUID();
        const error = validateFile(file);
        return {
          file,
          id,
          status: error ? "error" : "pending",
          progress: 0,
          error: error ?? undefined,
        };
      });

      setFiles((prev) => [...prev, ...newStates]);

      newStates
        .filter((f) => f.status === "pending")
        .forEach((f) => uploadFile(f.file, f.id));
    },
    [files, maxFiles, uploadFile]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const descriptionText =
    description ??
    `Max ${maxSizeMB}MB · ${accept.map((t) => t.split("/")[1]).join(", ").toUpperCase()}`;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && e.dataTransfer.files?.length)
            handleFiles(e.dataTransfer.files);
        }}
        onKeyDown={(e) =>
          e.key === "Enter" && !disabled && inputRef.current?.click()
        }
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <Upload className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700">
          {label ?? "Drop files here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-slate-500">{descriptionText}</p>
        {maxFiles > 1 && (
          <p className="mt-1 text-xs text-slate-400">Up to {maxFiles} files</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const list = e.target.files;
          if (list?.length) handleFiles(list);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f) => (
            <FileRow key={f.id} fileState={f} onRemove={() => removeFile(f.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
