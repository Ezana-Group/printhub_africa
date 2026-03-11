"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Check, AlertCircle, File, Image, Box } from "lucide-react";
export interface FileUploaderProps {
  context: string;
  accept: string[];
  maxSizeMB: number;
  maxFiles?: number;
  label?: string;
  description?: string;
  quoteId?: string;
  orderId?: string;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };

    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

function FileRow({
  fileState: f,
  onRemove,
}: {
  fileState: FileState;
  onRemove: () => void;
}) {
  const isImage = f.file.type.startsWith("image/");
  const is3D = /\.(stl|obj|3mf|step)$/i.test(f.file.name);
  const Icon = isImage ? Image : is3D ? Box : File;

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
      <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{f.file.name}</p>
        <p className="text-xs text-gray-400">{formatBytes(f.file.size)}</p>
        {(f.status === "uploading" || f.status === "confirming") && (
          <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-[#FF4D00] h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${f.progress}%` }}
            />
          </div>
        )}
        <p
          className={`text-xs mt-0.5 ${
            f.status === "done"
              ? "text-green-600"
              : f.status === "error"
                ? "text-red-500"
                : "text-gray-400"
          }`}
        >
          {f.status === "uploading" && `Uploading... ${Math.round(f.progress)}%`}
          {f.status === "confirming" && "Finishing..."}
          {f.status === "done" && "✓ Uploaded successfully"}
          {f.status === "error" && (f.error ?? "Upload failed")}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {f.status === "done" && <Check className="w-5 h-5 text-green-500" />}
        {f.status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
        {(f.status === "done" || f.status === "error") && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-300 hover:text-gray-500 rounded"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
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
  label = "Drop files here or click to browse",
  description,
  quoteId,
  orderId,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className = "",
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (
      !accept.includes(file.type) &&
      !accept.includes("*/*") &&
      !(file.type === "application/octet-stream" && accept.some((a) => a.includes("octet-stream")))
    ) {
      return `File type not allowed. Accepted: ${accept.join(", ")}`;
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
            quoteId,
            orderId,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error ?? "Failed to get upload URL");
        }

        const { uploadId, presignedUrl, storageKey, bucket } = await presignRes.json();

        await uploadWithProgress(presignedUrl, file, (progress) =>
          updateFile({ progress: 5 + progress * 0.9 })
        );

        updateFile({ status: "confirming", progress: 97 });

        const confirmRes = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, storageKey }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json();
          throw new Error(err.error ?? "Upload confirmation failed");
        }

        const result: UploadedFileResult = {
          uploadId,
          storageKey,
          originalName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        };

        updateFile({ status: "done", progress: 100, result });

        setFiles((prev) => {
          const next = prev.map((f) =>
            f.id === fileId ? { ...f, status: "done" as const, progress: 100, result } : f
          );
          const completed = next.filter(
            (f): f is FileState & { result: UploadedFileResult } =>
              f.status === "done" && !!f.result
          );
          onUploadComplete?.(completed.map((f) => f.result!));
          return next;
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateFile({ status: "error", error: message });
        onUploadError?.(message);
      }
    },
    [context, quoteId, orderId, onUploadComplete, onUploadError]
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles);
      const remaining =
        maxFiles - files.filter((f) => f.status === "done").length;
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

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const defaultDescription =
    description ??
    `Max ${maxSizeMB}MB · ${accept.map((t) => t.split("/")[1] ?? t).join(", ").toUpperCase()}`;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) =>
          e.key === "Enter" && !disabled && inputRef.current?.click()
        }
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
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
          ${dragging ? "border-[#FF4D00] bg-orange-50" : "border-gray-200 hover:border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-400 mt-1">{defaultDescription}</p>
        {maxFiles > 1 && (
          <p className="text-xs text-gray-400 mt-1">Up to {maxFiles} files</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept.join(",")}
        className="hidden"
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
