# Audit: R2 Upload System & Mobile Nav Fix

**Date:** 2026-03-11  
**Scope:** Cloudflare R2 complete file upload system (spec) and Mobile nav menu fix (spec).

---

## Part 1 — Cloudflare R2 Complete File Upload System

### Summary

| Area | Status | Notes |
|------|--------|--------|
| R2 client setup | ⚠️ Partial | `lib/s3.ts` exists with R2; not `lib/r2.ts`. Single bucket in code; no two-bucket (private/public) split in presign. |
| Database model | ⚠️ Partial | `UploadedFile` + enums exist; field names differ from spec; no `guestEmail`, `reviewedAt`; `Quote` not `PrintQuote` in main schema. |
| Upload API (presign/confirm) | ❌ Not done | No `/api/upload/presign` or `/api/upload/confirm`. Quote upload uses multipart through Next.js. |
| Reusable FileUploader | ❌ Not done | No `components/upload/FileUploader.tsx`. Each place uses custom or form upload. |
| Upload touchpoints | ⚠️ Partial | See table below. |
| Virus scanning | ⚠️ Code only | `lib/virustotal.ts` exists; not wired to any upload confirm flow. |
| Security checklist | ⚠️ Partial | No `file-type` magic-byte check; no upload confirm flow to hook scanning. |

---

### 1. R2 client (`lib/r2.ts` vs current)

**Spec:** Dedicated `lib/r2.ts` with two buckets (`printhub-uploads` private, `printhub-public` public), `createPresignedUploadUrl`, `createPresignedDownloadUrl`, `deleteFile`, `publicFileUrl`, `generateStorageKey`, `UploadFolder` type.

**Current:**

- **`lib/s3.ts`** (not `lib/r2.ts`): R2-compatible S3 client; single bucket from `R2_UPLOADS_BUCKET` / `AWS_S3_BUCKET_NAME`.
- **`getUploadUrl(key, contentType)`** — presigned PUT; no `maxSizeMB`, no bucket choice (private vs public).
- **`getSignedDownloadUrl(key)`** — presigned GET (1hr).
- **`getPublicUrl(key)`** — uses `R2_PUBLIC_URL`.
- **Missing:** `R2_PUBLIC_BUCKET` not used in code (only in `.env.example`). No `generateStorageKey`, no `UploadFolder` type, no `deleteFile`, no two-bucket presign.

**Verdict:** Partial. R2 is used for uploads, but architecture is single-bucket and API doesn’t match the spec (no key generator, no private/public bucket split in presign).

---

### 2. Database model (`UploadedFile`)

**Spec:** `UploadedFile` with `guestEmail`, `storagKey` (typo in spec; should be `storageKey`), `sizeBytes`, `fileType` (FileType), `uploadContext`, `folder`, 3D fields, image dimensions, `virusScanStatus`, `reviewedAt`, `rejectionReason`, relations to Quote/Order. Enums: `FileType`, `UploadContext`, `FileStatus`.

**Current (`prisma/schema.prisma`):**

- **UploadedFile** exists with: `userId`, `orderId`, `quoteId`, `quote` (→ `Quote`), `uploadedByAdmin`, `filename`, `originalName`, `storageKey`, `bucket`, `folder`, `mimeType`, `size` (not `sizeBytes`), `url`, `ext`, `uploadContext`, `thumbnailUrl`, `fileType` (`UploadedFileType`), `status` (`UploadedFileStatus`), `virusScanStatus`, `virusScanAt`, `reviewedBy`, `reviewNotes`, `rejectionReason`, `printVolume`, `printWeight`, `printTime`, `dimensions`, `printQuotes` (PrintQuote[]).
- **Missing vs spec:** `guestEmail`, `reviewedAt`. Schema uses `Quote` and `PrintQuote` (PrintQuote has `uploadedFileId`); spec said `PrintQuote` for quote relation.
- **Enums:** `UploadedFileType`, `UploadedFileStatus`, `UploadContext` — present and align with spec (names slightly different: `FileStatus` → `UploadedFileStatus`).

**Verdict:** Partial. Model is usable; add `guestEmail` and `reviewedAt` if you want full spec compliance.

---

### 3. Upload API routes

**Spec:**

- **3A** `POST /api/upload/presign` — body: filename, mimeType, sizeBytes, context, optional quoteId/orderId; returns uploadId, presignedUrl, storageKey, bucket, expiresIn. Validates MIME/size, context→folder/bucket, creates `UploadedFile` with status UPLOADING.
- **3B** `POST /api/upload/confirm` — body: uploadId, storageKey; verifies file in R2, sets status UPLOADED, triggers async (virus scan, 3D analysis, thumbnail, notify).
- **3C** `GET /api/upload/[id]/download` — returns signed URL for private file; access control owner/admin; audit log.

**Current:**

- **No** `/api/upload/presign` or `/api/upload/confirm` or `/api/upload/[id]/download`.
- **`POST /api/quotes/upload`** — multipart form with `file(s)`; routes files through Next.js; uses `getUploadUrl` then server-side PUT to R2 (or local `public/uploads/quotes` fallback). Returns `urls` and `filesMeta`; does **not** create `UploadedFile` or use presign pattern.
- **Avatar:** `POST /api/account/settings/avatar` — FormData; placeholder “TODO: R2 upload”, returns fake path; no presign, no UploadedFile.

**Verdict:** Not done. Presign → client PUT → confirm flow is not implemented. Quote upload is legacy (multipart through app, no UploadedFile, no virus scan hook).

---

### 4. Reusable `FileUploader` component

**Spec:** `components/upload/FileUploader.tsx` — context, accept, maxSizeMB, maxFiles, quoteId/orderId, onUploadComplete(onUploadError), showPreview, disabled; flow: presign → PUT to R2 with progress → confirm; `UploadedFileResult`: uploadId, storageKey, originalName, sizeBytes, mimeType, url (public).

**Current:** No such component. Get-a-quote uses a custom drop zone and `uploadFilesForQuote()` calling `/api/quotes/upload` (multipart). No shared upload component.

**Verdict:** Not done.

---

### 5. Upload touchpoints (spec 5A–5K)

| Spec | Page/Feature | Status | Notes |
|------|--------------|--------|--------|
| 5A | /upload → 3D print tab | ❌ | `/upload` redirects to `/get-a-quote`; no dedicated 3D upload tab with FileUploader. |
| 5B | /upload → Large format tab | ❌ | Same; no large-format tab. |
| 5C | /get-a-quote → file attachment | ⚠️ | File upload exists; uses multipart `/api/quotes/upload`, not FileUploader/presign. |
| 5D | Checkout → payment proof (bank transfer) | ❌ | Checkout page has no payment-proof upload; no BANK_TRANSFER UI with FileUploader. |
| 5E | Account → My uploads | ❌ | No `app/(public)/account/uploads/page.tsx` or equivalent. |
| 5F | Admin → uploads queue | ❌ | No `app/admin/uploads/page.tsx`; dashboard only counts `uploadedFile.count({ status: "UPLOADED" })`. |
| 5G | Admin → product images | ⚠️ | Product edit exists; images likely URL/upload elsewhere — not spec’s FileUploader + R2 flow. |
| 5H | Admin → catalogue STL | ❌ | Not found as spec (catalogue item STL upload with FileUploader). |
| 5I | Admin → catalogue photos | ❌ | Not found as spec. |
| 5J | Settings → logo & favicon | ❌ | Not verified; no FileUploader. |
| 5K | Account settings → profile photo | ⚠️ | Avatar API exists; placeholder upload, no R2/FileUploader. |

**Verdict:** Only get-a-quote has file upload; it does not use the spec’s R2 presign/confirm or FileUploader. Other touchpoints either missing or not wired to the spec.

---

### 6. Virus scanning & security

**Spec:** Virus scan (e.g. VirusTotal) after upload confirm; optional; async; set status INFECTED; path traversal prevention via `generateStorageKey`; no R2 key in client URL; expired UPLOADING cleanup cron.

**Current:**

- **`lib/virustotal.ts`** — `scanFile(buffer, filename, apiKey)` implemented; not called from any upload or confirm route.
- **Quotes upload:** Key is `quotes/${uuid}-${sanitizedFilename}`; no `UploadedFile`; no virus scan.
- **No** cron for UPLOADING expiry.

**Verdict:** VirusTotal helper exists but is not integrated. Security items (key generation, no key in URL) depend on implementing presign/confirm and using a single upload service.

---

### 7. Testing checklist (spec Step 8)

Not run as part of this audit. Once presign/confirm/FileUploader and touchpoints exist, the spec’s testing checklist should be executed.

---

## Part 2 — Mobile Nav Menu Fix

### Summary

| Fix | Status | Notes |
|-----|--------|--------|
| 1. Menu scrollable | ✅ Fixed | Sheet uses `flex flex-col`; scrollable area has `flex-1 min-h-0 overflow-y-auto overscroll-contain`. |
| 2. Login/Register at top | ✅ Fixed | Login/Register (or user strip) moved to top, below header, before nav links. |
| 3. Overlay tap to close | ✅ | Radix Sheet overlay closes on tap (default). |

---

### 1. Scrollable menu

**Spec:** Outer panel `flex flex-col`; inner content `flex-1 overflow-y-auto overscroll-contain p-6` so nav links scroll and Login/Register stay visible.

**Current:** Implemented in `components/layout/header.tsx`. SheetContent uses `flex flex-col p-0`; middle section has `min-h-0 flex-1 overflow-y-auto overscroll-contain` with nav links, Get a Quote, and (when logged in) My Account links. Header and Login/Register strip are `flex-shrink-0`; footer "Shop Now" is `flex-shrink-0`.

**Verdict:** ✅ Done. Menu is scrollable on small screens.

---

### 2. Login/Register at top

**Spec:** Login and Register immediately below the header (logo + close), before nav links, so they’re always visible on small screens.

**Current:** Structure is: nav links (Home, About, Services, Shop, Get a Quote) first, then a border-t section with “Shop Now” and then Login/Register (or My Account / Admin when logged in). So Login/Register are at the bottom and can be cut off on short viewports.

**Verdict:** ✅ Done. Login/Register (or user strip) are at the top of the mobile menu.

---

### 3. Overlay

**Spec:** Dark overlay behind menu; tap to close.

**Current:** `SheetContent` uses `SheetOverlay` (bg-black/80). Radix Sheet closes on overlay click by default. No change needed.

**Verdict:** ✅ OK. Overlay tap-to-close works (Radix default).

---

## Summary Table

| Item | R2 / Upload | Mobile Nav |
|------|-------------|------------|
| Core R2 client (two buckets, presign, key gen) | Partial (s3.ts, one bucket) | — |
| DB model UploadedFile | Partial (exists, minor diffs) | — |
| Presign + confirm + download API | Not done | — |
| FileUploader component | Not done | — |
| All upload touchpoints 5A–5K | Mostly not done | — |
| Virus scan integration | Not done (lib exists) | — |
| Menu scrollable | — | ✅ Done |
| Login/Register at top | — | ✅ Done |
| Overlay tap to close | — | ✅ OK |

---

## Recommendations

1. **R2:** Implement `lib/r2.ts` (or extend `lib/s3.ts`) with two-bucket support, `generateStorageKey`, and presign that selects bucket by context. Add `POST /api/upload/presign`, `POST /api/upload/confirm`, `GET /api/upload/[id]/download`, then build `FileUploader` and wire it to each touchpoint (5A–5K). Optionally add `guestEmail`/`reviewedAt` to schema. After confirm, call `lib/virustotal.ts` when API key is set and add a cron for UPLOADING expiry.
2. **Mobile nav:** ✅ **Implemented.** In `header.tsx`, the sheet is restructured: fixed header (site name + close) → fixed Login/Register or user strip → scrollable area (`min-h-0 flex-1 overflow-y-auto overscroll-contain`) for nav links, Get a Quote, and (when logged in) My Account links and Sign out → fixed footer ("Shop Now"). Sheet uses `flex flex-col` so the scrollable section gets a bounded height.

**R2:** Not implemented in this pass. The full R2 upload system (presign, confirm, FileUploader, touchpoints) can be done in a separate pass if needed.
