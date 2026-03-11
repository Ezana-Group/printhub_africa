# Audit: Catalogue Admin — Complete Rebuild

**Date:** 2026-03-11  
**Scope:** Catalogue list page, Add/Edit item form, Approval queue (spec: “Fix Edit Bug + Full Item Form + Approval Workflow”).

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| **FIX 1 — Catalogue list** | ⚠️ Partial | Table exists with Photo, Name, Category, Materials, Price, Status; **missing** KPI cards, status tabs, filter bar, License column, ⋯ actions menu. **Edit is broken** (links to `?edit=id`, no edit page). |
| **FIX 2 — Add/Edit form** | ❌ Not done | Add form has **only 4 fields** (name, category, shortDescription, description). **No** `/admin/catalogue/[id]/edit` page. No STL, photos, materials/pricing, designer/license, print specs, status panel, checklist. |
| **FIX 3 — Approval queue** | ⚠️ Partial | Queue page exists; shows PENDING_REVIEW items and Approve button. **Missing:** Reject handler, checklist, reject modal, “all clear” / draft hint, tabs (Import Queue, Recently Approved, Rejected). |
| **APIs** | ⚠️ Partial | List, create, get one, PATCH, DELETE, status PATCH, queue GET exist. **Missing:** PENDING_REVIEW in status enum, photos CRUD routes, STL upload/delete, calculate-price, dedicated approve/reject (status can do approve; reject needs reason + DRAFT). |

---

## FIX 1 — Catalogue List Page (`/admin/catalogue`)

### Spec vs current

| Spec element | Status | Current |
|--------------|--------|--------|
| Page header with stats line | ⚠️ Partial | Title + “Print-on-Demand catalogue items”; no “X total · Y awaiting approval” in subtitle. |
| Import from Printables + Add Item buttons | ✅ Done | Both links present. |
| Amber warning banner when pendingReview > 0 | ✅ Done | Banner with “Review now →” link. |
| KPI cards (Total, Live, Pending Review, Paused) | ❌ Missing | No KPI row. |
| Status tabs (All, Live, Pending Review, Draft, Paused, Retired) | ❌ Missing | No tabs; list is single view. |
| Filter bar (search, category, license) | ❌ Missing | No search or filters. |
| Table: Photo \| Name+slug \| Category \| Materials \| Price \| **License** \| Status \| **⋯** | ⚠️ Partial | Photo, Name+slug, Category, Materials, Price, Status, Actions. **No License column.** **No ⋯ dropdown** — only “Edit” and “View on site” (when LIVE). |
| Photo 64×64, no-photo tooltip | ⚠️ Partial | 48×48 thumb; “No photo” text, no amber tooltip. |
| License badges (CC0, CC BY, etc.) | ❌ Missing | Not in table. |
| ⋯ menu: Edit, Manage photos, Upload STL, Calculate price, Submit for review, Approve, Pause, Unpause, Retire, View on site, Delete | ❌ Missing | Only “Edit” (broken) and “View on site”. |
| **Edit button → `/admin/catalogue/[id]/edit`** | ❌ **Broken** | Edit links to **`/admin/catalogue?edit=${item.id}`** (same page, query param). **No route** `app/(admin)/admin/catalogue/[id]/edit/page.tsx` exists, so “Edit” does nothing useful. |

### List API

- **GET /api/admin/catalogue** — Implemented with `status`, `category`, `q`, `page`, `limit`. Returns `items`, `total`, `pendingReviewCount`, etc. **Missing:** `license` query param; response does not include `statusCounts` (for tabs/KPIs). So list data is partly there; filters and counts for tabs/KPIs need to be added.

---

## FIX 2 — Add / Edit Item — Full Form

### Add form (`/admin/catalogue/new`)

**Spec:** Full form with 7 sections: Basic details, Designer & license, Materials & colours, Pricing, Print specifications, Display options, SEO. Right column: Status panel, Photos card, STL card, Go-live checklist. Submit for review (DRAFT → PENDING_REVIEW) when checklist complete.

**Current:**

- **`app/(admin)/admin/catalogue/new/page.tsx`** — Renders `CatalogueItemForm` with categories.
- **`components/admin/catalogue-item-form.tsx`** — **Only 4 fields:** Name, Category, Short description, Description. No slug, tags, license, designer, source URL, materials, pricing, print specs, display options, SEO, no right column, no status/photos/STL/checklist.
- New items are created with **status DRAFT** (POST handler sets `CatalogueStatus.DRAFT`). There is no “Submit for review” control, so items stay DRAFT.

**Verdict:** Add form is minimal (4 fields). Spec’s full form and right panel are **not** implemented.

### Edit form (`/admin/catalogue/[id]/edit`)

**Spec:** Same form as add, used for edit; route must be `app/admin/catalogue/[id]/edit/page.tsx` (or under `(admin)` group). Edit button must go to `router.push(\`/admin/catalogue/${item.id}/edit\`)`.

**Current:**

- **No** `app/(admin)/admin/catalogue/[id]/edit/page.tsx` (no `[id]` segment under catalogue).
- List “Edit” uses `<a href={/admin/catalogue?edit=${item.id}}>Edit</a>`. No redirect to an edit page, no edit form. So **edit is broken** as described in the spec.

**Verdict:** Edit route and edit form **not** implemented. Edit button is broken (query param only, no edit page).

### Form save / status

- **POST /api/admin/catalogue** — Creates item (DRAFT). Accepts many optional fields in schema (slug, tags, designerId, sourceUrl, licenseType, etc.); form only sends name, categoryId, shortDescription, description, sourceType.
- **PATCH /api/admin/catalogue/[id]** — Exists; supports most spec fields (basePriceKes, weightGrams, printTimeHours, etc.). No `status` in update schema (status is changed via status route).
- **PATCH /api/admin/catalogue/[id]/status** — Body: `{ status: "LIVE" | "PAUSED" | "RETIRED" | "DRAFT" }`. **Does not accept `PENDING_REVIEW`.** So “Submit for review” cannot be implemented without adding `PENDING_REVIEW` to this endpoint.
- Reject: spec says return to DRAFT with reason. Status route supports `rejectionReason` only when `status === "RETIRED"`. So “Reject” would need to either (a) allow status `DRAFT` + `rejectionReason`, or (b) a dedicated reject endpoint that sets DRAFT and stores reason.

---

## FIX 3 — Approval Queue Page (`/admin/catalogue/queue`)

### Spec vs current

| Spec element | Status | Current |
|--------------|--------|--------|
| Tabs: Pending Review, Import Queue, Recently Approved, Rejected | ❌ Missing | Single view; queue API returns `pendingReview` and `importQueue` but UI doesn’t show tabs. |
| Empty state: “All clear!” + optional draft hint | ⚠️ Partial | “No items awaiting review.” No “All clear!” styling; no hint about DRAFT items or link to drafts. |
| Draft hint: “X items in Draft… submit for review” | ❌ Missing | Not shown. |
| Per-item card: photo, details, source URL, designer credit, quick stats | ⚠️ Partial | Photo, name, category, license; no source URL, designer credit, or material/price/photo counts. |
| Approval checklist (tick each to enable Approve) | ❌ Missing | No checklist. |
| Internal notes textarea | ❌ Missing | Not present. |
| Reject button + modal (reason chips + custom text) | ❌ Missing | Reject button exists but **no handler** (no `onClick`). No modal, no reason, no API call. |
| Approve — Set Live | ✅ Done | `handleApprove` calls PATCH `.../status` with `status: "LIVE"`. |
| Edit item link | ❌ Missing | No “Edit item” link (and edit page doesn’t exist). |

**Queue API:** **GET /api/admin/catalogue/queue** — Returns `pendingReview` (items with status PENDING_REVIEW) and `importQueue`. Queue data is there; UI and workflow (checklist, reject, tabs) are not.

---

## API Routes — Spec vs Existence

| Route | Spec | Exists | Notes |
|-------|------|--------|--------|
| GET /api/admin/catalogue | ✅ | ✅ | Has status, category, q, page; missing license param, statusCounts. |
| POST /api/admin/catalogue | ✅ | ✅ | Creates DRAFT; form only sends 4 fields. |
| GET /api/admin/catalogue/[id] | ✅ | ✅ | Single item for edit. |
| PATCH /api/admin/catalogue/[id] | ✅ | ✅ | Full update schema; no status (use status route). |
| DELETE /api/admin/catalogue/[id] | ✅ | ✅ | Soft delete (sets RETIRED). |
| PATCH /api/admin/catalogue/[id]/status | ✅ | ✅ | **Missing PENDING_REVIEW** in body enum; reject reason only for RETIRED. |
| POST /api/admin/catalogue/[id]/photos | ✅ | ❌ | Not implemented. |
| PATCH /api/admin/catalogue/[id]/photos/[pid] | ✅ | ❌ | Not implemented. |
| DELETE /api/admin/catalogue/[id]/photos/[pid] | ✅ | ❌ | Not implemented. |
| POST /api/admin/catalogue/[id]/stl | ✅ | ❌ | Not implemented. |
| DELETE /api/admin/catalogue/[id]/stl | ✅ | ❌ | Not implemented. |
| POST /api/admin/catalogue/[id]/calculate-price | ✅ | ❌ | Not implemented. |
| GET /api/admin/catalogue/queue | ✅ | ✅ | Returns pendingReview + importQueue. |
| POST .../approve | Optional | — | Approve can use PATCH status LIVE. |
| POST .../reject | Optional | — | Reject needs DRAFT + reason (extend status or new endpoint). |

---

## Database / Schema

- Catalogue system exists in DB (migration `20260311114202_add_catalogue_system`): `CatalogueItem`, `CatalogueCategory`, `CatalogueDesigner`, `CatalogueItemMaterial`, `CatalogueItemPhoto`, `CatalogueStatus` (DRAFT, PENDING_REVIEW, LIVE, PAUSED, RETIRED), etc. Default for new items in API is DRAFT; migration default for `CatalogueItem.status` is PENDING_REVIEW (API overrides to DRAFT on create).
- Schema supports: stlFileUrl, stlFileName, stlFileSizeBytes, weightGrams, printTimeHours, basePriceKes, priceOverrideKes, approvedBy, approvedAt, rejectedBy, rejectionReason, internalNotes, etc. So the **data model** can support the spec; the **UI and some APIs** are missing.

---

## Testing Checklist (Spec) — Status

- [ ] Catalogue list loads with all status tabs showing correct counts — **N/A** (no tabs).
- [ ] KPI cards show correct numbers — **N/A** (no KPI cards).
- [ ] ⋯ menu opens on each row with all 8 actions — **No** (no ⋯ menu).
- [ ] [Edit item] in ⋯ menu → navigates to `/admin/catalogue/[id]/edit` — **Broken** (Edit goes to `?edit=id`, no edit page).
- [ ] Edit form loads with all existing data pre-filled — **N/A** (no edit page).
- [ ] All 7 sections of the form are present and functional — **No** (4 fields only).
- [ ] Photo upload → thumbnail in right panel, primary marker — **No** (no photo upload in form).
- [ ] STL upload → file name/size in right panel — **No** (no STL upload).
- [ ] [Calculate price] → breakdown → [Use this price] — **No** (no such API or UI).
- [ ] Go-live checklist updates as fields completed — **No** (no checklist).
- [ ] [Submit for Review] disabled until checklist complete — **No** (no Submit for Review; status API doesn’t accept PENDING_REVIEW).
- [ ] [Submit for Review] → PENDING_REVIEW → item in queue — **No** (no way to submit).
- [ ] Approval queue shows PENDING_REVIEW items with full detail cards — **Partial** (basic cards only).
- [ ] Checklist on queue items must be ticked → [Approve] enables — **No** (Approve always enabled).
- [ ] [Approve] → LIVE → item at /catalogue/[slug] — **Yes** (approve works).
- [ ] [Reject] → modal with reason → DRAFT, reason saved — **No** (Reject has no handler/modal).
- [ ] Existing item: edit opens correctly, all fields pre-fill — **No** (edit page missing).

---

## Recommendations

1. **Fix Edit:** Add `app/(admin)/admin/catalogue/[id]/edit/page.tsx` and change the list “Edit” action to `href={/admin/catalogue/${item.id}/edit}` (or use router.push). Reuse or extend the same form component for both new and edit.
2. **Catalogue list:** Add KPI cards and status counts (from groupBy or separate counts). Add status tabs and filter bar (search, category, license). Add License column. Replace single “Edit” with a ⋯ dropdown and implement all spec actions (Edit, Manage photos, Upload STL, Calculate price, Submit for review, Approve, Pause, Unpause, Retire, View on site, Delete).
3. **Status API:** Allow `PENDING_REVIEW` in `PATCH /api/admin/catalogue/[id]/status` so “Submit for review” can set status to PENDING_REVIEW. For Reject, allow setting status to DRAFT with `rejectionReason` (and optionally `rejectedBy`/timestamp) so queue reject returns item to draft with reason.
4. **Add/Edit form:** Replace or extend `CatalogueItemForm` with the full 7-section form and right column (status, photos, STL, go-live checklist). Implement photo upload (and photos API), STL upload (and STL API), and price calculation (and calculate-price API) so the checklist and “Submit for review” can work.
5. **Approval queue:** Add Reject handler and modal (reason chips + free text), wire to status PATCH (DRAFT + rejectionReason). Add approval checklist per item and gate “Approve” on checklist complete. Add empty state “All clear!” and draft hint; optionally add tabs (Import Queue, Recently Approved, Rejected) if you use those in the spec.

---

*PrintHub Catalogue Admin Rebuild Audit v1.0 | printhub.africa | An Ezana Group Company*
