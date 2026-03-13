"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  X,
  CheckCircle,
  Loader2,
  FileText,
  FileImage,
  Box,
  File,
} from "lucide-react";

// ── TYPES ────────────────────────────────────────────────────────

export interface FileValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface UploadedFileResult {
  uploadId: string;
  storageKey: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  previewUrl?: string;
  publicUrl?: string;
  validation?: FileValidationResult;
}

export interface FileUploaderProps {
  context: string;
  accept: string[];
  maxSizeMB?: number;
  maxFiles?: number;
  label?: string;
  hint?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  quoteId?: string;
  orderId?: string;
  guestEmail?: string;
  onUploadComplete?: (files: UploadedFileResult[]) => void;
  onUploadError?: (error: string) => void;
  onRemove?: (uploadId: string) => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

interface FileEntry {
  id: string;
  file: File;
  state: UploadState;
  progress: number;
  error?: string;
  result?: UploadedFileResult;
}

// ── HELPERS ──────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string, filename: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (filename.match(/\.(stl|obj|3mf|step|stp)$/i)) return Box;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/") && mimeType !== "image/svg+xml";
}

function humanAccept(accept: string[]): string {
  return accept
    .map((t) => t.split("/")[1]?.toUpperCase() ?? t)
    .filter(Boolean)
    .join(", ");
}

// ── MAIN COMPONENT ───────────────────────────────────────────────

export function FileUploader({
  context,
  accept,
  maxSizeMB = 50,
  maxFiles = 1,
  label,
  hint,
  description,
  disabled = false,
  className = "",
  quoteId,
  orderId,
  guestEmail,
  onUploadComplete,
  onUploadError,
  onRemove,
}: FileUploaderProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hintText = hint ?? description;
  const doneCount = entries.filter((e) => e.state === "done").length;
  const canAddMore = doneCount < maxFiles;

  const validate = useCallback(
    (file: File): string | null => {
      if (accept.length > 0 && !accept.includes("*/*")) {
        const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
        const mimeOk = accept.includes(file.type);
        const extMap: Record<string, string[]> = {
          "model/stl": [".stl"],
          "model/obj": [".obj"],
          "model/3mf": [".3mf"],
          "application/octet-stream": [".stl", ".obj", ".3mf", ".step", ".stp"],
          "image/vnd.adobe.photoshop": [".psd"],
          "application/postscript": [".ai", ".eps"],
          "application/dxf": [".dxf"],
        };
        const extOk =
          accept.some((t) => extMap[t]?.includes(ext)) || accept.includes(ext);
        if (!mimeOk && !extOk) {
          const readable = humanAccept(accept);
          return `File type not supported. Please upload: ${readable}`;
        }
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large (${formatBytes(file.size)}). Max size is ${maxSizeMB}MB`;
      }
      return null;
    },
    [accept, maxSizeMB]
  );

  const uploadFile = useCallback(
    async (entry: FileEntry) => {
      const update = (patch: Partial<FileEntry>) =>
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, ...patch } : e))
        );

      try {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: entry.file.name,
            mimeType: entry.file.type || "application/octet-stream",
            sizeBytes: entry.file.size,
            context,
            quoteId: quoteId ?? undefined,
            orderId: orderId ?? undefined,
            guestEmail: guestEmail ?? undefined,
          }),
        });
        if (!presignRes.ok) {
          const err = (await presignRes.json().catch(() => ({}))) as { error?: string; code?: string };
          const msg =
            presignRes.status === 503
              ? "Upload service is temporarily unavailable. Please try again in a moment."
              : presignRes.status === 413
                ? "File is too large. Please use a smaller file."
                : presignRes.status === 400
                  ? "Upload request was invalid. Please try again or contact support."
                  : err?.error ?? "Could not start upload";
          console.error("[FileUploader] Presign failed:", presignRes.status, err);
          throw new Error(msg);
        }
        const {
          uploadId,
          presignedUrl,
          storageKey,
          bucket,
        } = (await presignRes.json()) as {
          uploadId: string;
          presignedUrl: string;
          storageKey: string;
          bucket?: "private" | "public";
        };

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader(
            "Content-Type",
            entry.file.type || "application/octet-stream"
          );
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              update({ progress: Math.round((e.loaded / e.total) * 95) });
            }
          };
          xhr.onload = () =>
            xhr.status < 300
              ? resolve()
              : reject(new Error(`Upload error (${xhr.status})`));
          xhr.onerror = () =>
            reject(new Error("Network error — check your connection"));
          xhr.send(entry.file);
        });

        update({ progress: 98 });

        const confirmRes = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, storageKey }),
        });
        if (!confirmRes.ok) {
          const err = (await confirmRes.json().catch(() => ({}))) as { error?: string; code?: string };
          const msg =
            confirmRes.status === 503
              ? "Upload service temporarily unavailable. Please try again in a moment."
              : confirmRes.status === 400
                ? "Upload could not be saved. Please try again or contact support."
                : err?.error ?? "Upload confirmation failed";
          console.error("[FileUploader] Confirm failed:", confirmRes.status, err);
          throw new Error(msg);
        }
        const confirmData = await confirmRes.json();

        const result: UploadedFileResult = {
          uploadId,
          storageKey,
          originalName: entry.file.name,
          sizeBytes: entry.file.size,
          mimeType: entry.file.type || "application/octet-stream",
          previewUrl: isImageType(entry.file.type)
            ? URL.createObjectURL(entry.file)
            : undefined,
          publicUrl:
            bucket === "public" && process.env.NEXT_PUBLIC_R2_PUBLIC_URL
              ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storageKey}`
              : undefined,
          validation: confirmData.validation,
        };

        update({ state: "done", progress: 100, result });

        setEntries((prev) => {
          const next = prev.map((e) =>
            e.id === entry.id ? { ...e, state: "done" as const, progress: 100, result } : e
          );
          const allDone = next
            .filter((e) => e.state === "done" && e.result)
            .map((e) => e.result!);
          onUploadComplete?.(allDone);
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        update({ state: "error", error: message });
        onUploadError?.(message);
      }
    },
    [context, quoteId, orderId, guestEmail, onUploadComplete, onUploadError]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;
      const arr = Array.from(files);
      const currentEntries = entries;
      const slots = maxFiles - currentEntries.filter((e) => e.state === "done").length;
      const batch = arr.slice(0, Math.max(0, slots));

      const newEntries: FileEntry[] = batch.map((file) => {
        const error = validate(file);
        return {
          id: crypto.randomUUID(),
          file,
          state: error ? "error" : "uploading",
          progress: 0,
          error: error ?? undefined,
        };
      });

      setEntries((prev) => [...prev, ...newEntries]);

      newEntries
        .filter((e) => e.state === "uploading")
        .forEach((e) => uploadFile(e));
    },
    [entries, maxFiles, disabled, validate, uploadFile]
  );

  const removeEntry = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (entry?.result?.uploadId) onRemove?.(entry.result.uploadId);
      if (entry?.result?.previewUrl) URL.revokeObjectURL(entry.result.previewUrl);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (inputRef.current) inputRef.current.value = "";
    },
    [entries, onRemove]
  );

  const retryEntry = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, state: "uploading" as const, progress: 0, error: undefined } : e
        )
      );
      uploadFile({ ...entry, state: "uploading", progress: 0, error: undefined });
    },
    [entries, uploadFile]
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      {hintText && (
        <p className="text-xs text-gray-500">{hintText}</p>
      )}

      {canAddMore && (
        <div
          role="button"
          tabIndex={disabled ? undefined : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) =>
            e.key === "Enter" && !disabled && inputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled && e.dataTransfer.files?.length)
              handleFiles(e.dataTransfer.files);
          }}
          className={[
            "border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer",
            dragging ? "border-[#FF4D00] bg-orange-50 scale-[1.01]" : "",
            disabled
              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              : "border-gray-300 hover:border-[#FF4D00] hover:bg-orange-50",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition ${
              dragging ? "bg-orange-100" : "bg-gray-100"
            }`}
          >
            <Upload
              className={`w-5 h-5 transition ${
                dragging ? "text-[#FF4D00]" : "text-gray-400"
              }`}
            />
          </div>
          <p
            className={`text-sm font-medium transition ${
              dragging ? "text-[#FF4D00]" : "text-gray-600"
            }`}
          >
            {dragging
              ? "Drop to upload"
              : maxFiles > 1
                ? "Drop files here or click to browse"
                : "Drop file here or click to browse"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {humanAccept(accept)} · Max {maxSizeMB}MB
            {maxFiles > 1 && ` · Up to ${maxFiles} files`}
          </p>
          {maxFiles > 1 && doneCount > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {doneCount} of {maxFiles} uploaded
            </p>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <FileEntryRow
              key={entry.id}
              entry={entry}
              onRemove={removeEntry}
              onRetry={retryEntry}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}

// ── FILE ENTRY ROW ───────────────────────────────────────────────

function FileEntryRow({
  entry,
  onRemove,
  onRetry,
}: {
  entry: FileEntry;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const Icon = getFileIcon(entry.file.type, entry.file.name);
  const hasPreview = entry.state === "done" && entry.result?.previewUrl;

  return (
    <div
      className={[
        "rounded-xl border overflow-hidden transition",
        entry.state === "done" ? "border-green-200 bg-green-50" : "",
        entry.state === "uploading" ? "border-blue-200 bg-blue-50" : "",
        entry.state === "error" ? "border-red-200 bg-red-50" : "",
        entry.state === "idle" ? "border-gray-200 bg-gray-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
          {hasPreview && entry.result?.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL from createObjectURL
            <img
              src={entry.result.previewUrl}
              alt={entry.file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon
              className={`w-6 h-6 ${
                entry.state === "error"
                  ? "text-red-400"
                  : entry.state === "done"
                    ? "text-green-500"
                    : entry.state === "uploading"
                      ? "text-blue-400"
                      : "text-gray-400"
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {entry.file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatBytes(entry.file.size)}
          </p>

          {entry.state === "uploading" && (
            <div className="mt-1.5">
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-blue-600">Uploading...</span>
                <span className="text-xs text-blue-600 font-medium">
                  {entry.progress}%
                </span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5">
                <div
                  className="bg-[#FF4D00] h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${entry.progress}%` }}
                />
              </div>
            </div>
          )}

          {entry.state === "done" && (
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700 font-medium">
                Uploaded successfully
              </span>
            </div>
          )}

          {entry.state === "done" && entry.result?.validation && (
            <div className="mt-1.5 space-y-0.5">
              {entry.result.validation.errors.length > 0 && (
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {entry.result.validation.errors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
              {entry.result.validation.warnings.length > 0 && (
                <ul className="text-xs text-amber-600 list-disc list-inside">
                  {entry.result.validation.warnings.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {entry.state === "error" && entry.error && (
            <p className="text-xs text-red-600 mt-0.5 leading-snug">
              {entry.error}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1">
          {entry.state === "uploading" && (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          )}

          {entry.state === "error" && (
            <button
              type="button"
              onClick={() => onRetry(entry.id)}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-100 transition mr-1"
            >
              Retry
            </button>
          )}

          {(entry.state === "done" || entry.state === "error") && (
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              title={entry.state === "done" ? "Remove file" : "Dismiss"}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {hasPreview && entry.result?.previewUrl && (
        <div className="px-3 pb-3">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-white border border-green-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.result.previewUrl}
              alt={entry.file.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
