# PrintHub — Critical Gaps Implementation Status

**Audit date:** 13 March 2026  
**Scope:** Root project folder vs. the 25 features in the Critical Gaps Build Prompt.

---

## Summary

| Priority | Total | Implemented | Partial | Not implemented |
|----------|-------|-------------|---------|-----------------|
| 🔴 Critical | 4 | 0 | 2 | 2 |
| 🟠 High | 5 | 0 | 2 | 3 |
| 🟡 Medium | 12 | 1 | 3 | 8 |

---

## 🔴 CRITICAL

### [CRITICAL-1] Delivery & Logistics System — **NOT IMPLEMENTED** (partial only)

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `DeliveryZone` exists but shape differs: single `feeKes`, `county`/`counties` (string), `minDays`/`maxDays`. No `Delivery` model, no `DeliveryMethod`/`DeliveryStatus` enums, no `standardFee`/`expressFee`/`expressHours`/`estimatedDays`. |
| **Seed Kenya zones** | ❌ | No delivery zone seed; Kenya county rates (Nairobi 200, Central 400, etc.) are not seeded. |
| **API routes** | Partial | `/api/shipping/fee?county=X` exists (not `/api/checkout/delivery-fee`). No `POST/GET/PATCH /api/admin/deliveries/zones`, no `POST /api/admin/deliveries`, no `PATCH /api/admin/deliveries/[id]`, no `GET /api/account/orders/[id]/delivery`, no reschedule endpoint. |
| **Checkout step 2** | Partial | County selection exists; calls `/api/shipping/fee` and shows fee. No live “Estimated delivery: Mon 17 Mar” (production days + transit). No “contact us for your area” when county not in zone. Delivery zone not stored on Order. |
| **Admin order — Delivery tab** | ❌ | No Delivery tab; only a “Delivery” card (address + method + estimated date + tracking). No courier assign, proof photo, Mark Dispatched/Delivered/Failed, reschedule. |
| **Customer delivery timeline** | ❌ | No delivery timeline on `/account/orders/[id]` (only generic order timeline). |
| **Admin /admin/deliveries** | ❌ | Page does not exist. |
| **Admin settings — Delivery Zones** | ✅ | `/admin/settings/shipping` has `DeliveryZonesSection` (list, add, edit zones). |
| **Notifications** | ❌ | No dispatch/delivered/failed emails or SMS. |

**Verdict:** Delivery zones admin + checkout fee by county exist. Full delivery management (Delivery model, courier assignment, tracking, status workflow, dashboard, customer timeline, notifications) is **not implemented**.

---

### [CRITICAL-2] PDF Invoice & Quote Generator — **NOT IMPLEMENTED** (partial only)

| Item | Status | Notes |
|------|--------|--------|
| **Dependencies** | ❌ | `@react-pdf/renderer` not in `package.json`. |
| **Database** | Partial | `Invoice` model exists (orderId, invoiceNumber, issuedAt, dueAt, pdfUrl, vatAmount, totalAmount) but no `pdfKey`, `sentAt`, `sentBy`, `subtotal`. No `QuotePdf` model. No `Counter` model for INV-/QUO- sequence. |
| **Invoice PDF component** | ❌ | No `components/pdf/InvoicePDF.tsx`. |
| **Quote PDF component** | ❌ | No `components/pdf/QuotePDF.tsx`. |
| **Invoice API** | Partial | `GET /api/orders/[id]/invoice` returns **HTML** (print-to-PDF), not generated PDF. No `POST /api/invoices/generate`, no `GET /api/invoices/[id]/download`, no `POST /api/invoices/[id]/send`. No code creates `Invoice` records. |
| **Quote PDF API** | ❌ | No quote PDF generate/download/send routes. |
| **Auto-generate on payment** | ❌ | No `generateAndSaveInvoice(orderId)` or equivalent in payment confirmation flows. |
| **Customer order page** | Partial | “Download invoice” links to HTML invoice; no “Tax Invoice” + PDF download from stored Invoice. |
| **Admin order — Invoice section** | ❌ | No invoice section with Generate/Download/Email to Customer/Regenerate. |
| **Admin quotes — Quote PDF** | ❌ | No quote PDF section. |
| **Admin Finance — Invoices tab** | ❌ | No invoices list/export on `/admin/finance`. |

**Verdict:** Only HTML invoice (browser print-to-PDF) exists. KRA-style PDF invoices, quote PDFs, Counter, R2 PDF storage, and email/send flows are **not implemented**.

---

### [CRITICAL-3] Refund & Order Cancellation System — **PARTIAL** (minimal)

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `Refund` exists with id, orderId, amount, reason, status, processedBy, processedAt. No `refundNumber`, `RefundReason`/`RefundType`/`RefundStatus` enums, no `Cancellation` model, no M-Pesa B2C fields (`mpesaPhone`, `mpesaReceiptNo`), no `itemsRefunded`, `reviewedBy`, `rejectionReason`. Order has `CANCELLED` and `cancelledAt`/`cancelReason`. |
| **Cancellation rules** | Partial | Customer cancel allowed for PENDING/CONFIRMED only (implemented in API). No `lib/cancellation.ts` or `requiresRefund()`. |
| **API — cancel** | Partial | `PATCH /api/orders/[id]` with `action: "cancel"` for customer; no `POST /api/admin/orders/[id]/cancel`. Cancel updates order only; no `Cancellation` record, no auto-creation of `Refund`. |
| **API — refunds** | ❌ | No `GET/POST /api/account/refunds`, no `GET /api/account/refunds/[id]`. No `GET/POST/PATCH /api/admin/refunds`, no approve/reject/process, no `POST /api/admin/refunds/mpesa-b2c`. |
| **M-Pesa B2C** | ❌ | No `lib/mpesa-b2c.ts`, no B2C callback route. |
| **Customer — cancel UI** | Partial | Cancel button on `/account/orders/[id]` with confirm; no reason dropdown/modal as specified. |
| **Customer — refund tracking** | ❌ | No refund status card on order detail. |
| **Admin — refund queue** | ❌ | No `/admin/refunds` page or refund detail. |
| **Admin — cancel order** | ❌ | No staff “Cancel Order” with reason in admin order detail. |
| **Checkout — policy checkbox** | ❌ | No “I agree to Terms of Service and Refund Policy” checkbox or custom-print notice before Place Order. |
| **Notifications** | ❌ | No cancellation/refund emails or SMS. |

**Verdict:** Customer can cancel PENDING/CONFIRMED orders; no refund workflow, no B2C, no admin refund UI, no policy checkbox or notifications.

---

### [CRITICAL-4] Support Ticket System & Contact Form — **NOT IMPLEMENTED** (contact only)

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `SupportTicket` (userId required, orderId optional, subject, status, priority) and `TicketMessage` exist. No `ticketNumber`, no `guestEmail`/`guestName`/`guestPhone`, no `TicketCategory`/`TicketPriority`/`TicketStatus`/`MessageSender` enums, no `assignedTo`, `resolvedAt`, `closedAt`, no `isInternal` on messages. |
| **API** | ❌ | No `POST /api/support/tickets`, no `GET/POST /api/account/support/tickets`, no admin support ticket routes. |
| **Contact form** | Partial | `/contact` submits to `POST /api/contact`; sends email only, does **not** create a SupportTicket. No category, no file attachments, no ticket number in response. |
| **Customer /account/support** | ❌ | No support tickets list or detail pages. |
| **Customer /account/support/new** | ❌ | No new-ticket form. |
| **Admin /admin/support** | ❌ | No support dashboard or ticket management. |
| **Notifications** | ❌ | No ticket created/replied/resolved emails. |
| **Tawk.to** | ❌ | No TawkTo component or embed. |

**Verdict:** Contact form sends email only. No ticket system, no support API, no customer or admin support UI.

---

## 🟠 HIGH

### [HIGH-1] Product Reviews System — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | ✅ | `ProductReview` exists (productId, userId, rating, title, body, images, isVerified, isApproved). |
| **Product page reviews tab** | ❌ | No reviews summary, list, sort, or “Write a review” on `/shop/[slug]`. |
| **API** | ❌ | No `GET/POST /api/products/[slug]/reviews`, no helpful vote, no admin approve/reject/reply/delete. |
| **Admin reviews** | ❌ | No pending queue or reviews management (tab or page). |
| **Post-delivery review request** | ❌ | No cron, no `sentReviewRequestAt`, no 7-day email. |
| **Shop listing ratings** | ❌ | Product cards do not show star rating or review count. |

**Verdict:** Model only; no reviews UI or API.

---

### [HIGH-2] Abandoned Cart Recovery — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Cart model** | Partial | `Cart` has id, userId, sessionId, items, createdAt/updatedAt. No `email`, `phone`, `recoveryEmailSent1At`, `recoveryEmailSent2At`, `lastActivityAt`, `convertedAt`. |
| **Capture email on checkout** | ❌ | No PATCH to save email to cart on step 1. |
| **Cron** | ❌ | No `/api/cron/abandoned-carts` or Vercel cron config. |
| **Emails** | ❌ | No 1hr or 24hr abandoned cart email templates. |
| **Admin marketing** | ❌ | No abandoned cart KPIs or table on `/admin/marketing`. |
| **Unsubscribe** | ❌ | No cart recovery opt-out or token endpoint. |

**Verdict:** Not implemented.

---

### [HIGH-3] Corporate / B2B Portal — **PARTIAL** (schema + minimal UI)

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `CorporateAccount` exists (userId, companyName, kraPin, industry, creditLimit, paymentTerms, isApproved, approvedBy). No `ReferralCode`-style full B2B spec: no `contactPerson`, `contactPhone`, `discountPercent`, `CorpStatus` enum, no `BrandAsset` or `BulkOrder` models. |
| **Apply page** | Partial | `/account/settings/corporate` and `corporate-account-client.tsx` exist; no dedicated `/account/corporate/apply` with benefits + full application form as in prompt. |
| **Admin corporate** | ❌ | No `/admin/corporate` (pending applications, active accounts, review flow). |
| **Checkout — corporate** | ❌ | No corporate discount at checkout, no Net-30/Net-60 or PO reference, no “Invoice (Net-30)” option. |
| **Customer /account/corporate** | ❌ | No corporate dashboard with credit bar, brand assets, monthly invoices. |
| **Brand asset upload** | ❌ | No brand asset API or UI. |

**Verdict:** Corporate account model and basic settings UI only; no full apply flow, admin management, or checkout integration.

---

### [HIGH-4] Production Kanban Board — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `ProductionQueue` (orderId, orderItemId, status, assignedTo, machineId, startedAt, completedAt) and `Machine` exist. No `ProductionJob` with title, priority, estimatedMins, JobStatus enum as in prompt. |
| **Admin /admin/production** | ❌ | `/admin/production-queue` is a placeholder (“will be built here”) with link to orders. No Kanban columns, drag-and-drop, or job cards. |
| **Mobile production view** | ❌ | No `/admin/production/mobile`. |
| **Job completion notification** | ❌ | No auto-update to QUALITY_CHECK or customer notification. |

**Verdict:** Production queue model exists; Kanban UI and workflow are not implemented.

---

### [HIGH-5] Stock Management — Wire Up Depletion — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | Partial | `Product.stock`, `Product.lowStockThreshold` exist. No `trackInventory` flag. `Inventory` model exists. |
| **Decrement on order confirm** | ❌ | No stock decrement in checkout or payment confirmation. |
| **Restore on cancel/refund** | ❌ | No stock restore. |
| **Low stock alert** | ❌ | No admin alert or notification when stock ≤ threshold. |
| **Shop/PDC UI** | Partial | Product card has `disabled={stock < 1}` for Add to cart; no “Out of Stock” / “Only X left” labels. |
| **Checkout validation** | ❌ | No re-validation of stock at confirmation. |

**Verdict:** Stock fields exist but are not wired to order lifecycle or alerts.

---

## 🟡 MEDIUM

### [MEDIUM-1] Loyalty Programme — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | ✅ | `User.loyaltyPoints`, `LoyaltyAccount`, `LoyaltyTransaction` (accountId, points, type, reference). `LoyaltySettings` exists. |
| **Earning on payment** | ❌ | No points awarded on order confirmation. |
| **Redemption at checkout** | ❌ | No “Redeem points” input or discount on checkout review step. |
| **Customer /account/loyalty** | ❌ | No loyalty page with balance, tier, history, how to earn/redeem. |
| **Admin loyalty settings** | Partial | `/admin/settings` has loyalty (e.g. minimum to redeem); not full config (points per KES, redemption rate, bonuses, tiers). |

**Verdict:** Schema and some admin settings; no earning, redemption, or customer loyalty page.

---

### [MEDIUM-2] Referral Programme — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | Partial | `ReferralCode` (userId, code) exists. No full `Referral` model with referrer/referee, status, referee discount code, referrer points, orderId. |
| **Code on registration** | Partial | Referral code generated in `/api/account/settings/referral` (upsert). No evidence it’s created on user registration. |
| **Ref link** | ✅ | `/ref/[code]/route.ts` looks up referral code. |
| **Referee signup/order** | ❌ | No applying ref on register, no WELCOME10, no referrer reward on first order. |
| **Customer /account/referrals** | ❌ | No referrals page with code, share link, table, rewards. |

**Verdict:** Referral code and ref route exist; full referral flow and UI are not implemented.

---

### [MEDIUM-3] Wishlist — Wire Up Heart Icon — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | ✅ | `Wishlist` (userId, productId) exists. |
| **API** | ❌ | No POST/DELETE/GET `/api/account/wishlist`, no GET `/api/account/wishlist/ids`. |
| **Product card heart** | ❌ | Heart has `aria-label="Add to wishlist"` only; no onClick, no API call, no filled state. |
| **Wishlist page** | ❌ | No `/account/wishlist`. |

**Verdict:** Model only; heart and wishlist page not wired.

---

### [MEDIUM-4] Blog / Content Marketing — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | ❌ | No `BlogPost` model. |
| **Sanity/DB** | Partial | `lib/sanity.ts` and `lib/algolia.ts` mention blog; no DB-backed blog. |
| **Pages** | ❌ | No `/blog` or `/blog/[slug]`. |
| **Admin** | ❌ | No `/admin/blog` or post editor. |
| **Seed posts** | ❌ | No seed. |

**Verdict:** Not implemented (prompt asks DB-only, no Sanity).

---

### [MEDIUM-5] Product Search — PostgreSQL Full-Text — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **API** | ❌ | No `GET /api/search?q=...` or Prisma raw full-text query. |
| **PostgreSQL index** | ❌ | No GIN index for product search. |
| **Header search** | ❌ | No debounced search dropdown or results. |
| **Full results page** | ❌ | No `/shop?q=...` with highlighted results. |

**Verdict:** Not implemented.

---

### [MEDIUM-6] Kenya Data Protection Act 2019 Compliance — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Cookie consent** | ❌ | No `CookieConsent` component, no accept/essential-only, no consent-gated analytics. |
| **Data export** | ❌ | No “Download My Data” or `POST /api/account/data/export`. |
| **Data deletion** | ❌ | No “Delete My Account” or `POST /api/account/data/delete` (anonymise/delete). |
| **Legal pages** | Partial | `/privacy-policy`, `/terms-of-service`, `/refund-policy`, `/cookie-policy` exist (e.g. from `prisma/legal-content.ts` and LegalPage). Content not verified against prompt (KDPA sections, DPO, ODPC, Kenya-specific T&Cs). |

**Verdict:** Legal pages exist; cookie consent, export, and deletion are not implemented.

---

### [MEDIUM-7] Local SEO & Google My Business Schema — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **LocalBusiness JSON-LD** | ❌ | No `LocalBusinessSchema` in root layout. Service pages have `Service` + `FAQPage` JSON-LD only. |
| **Page-level SEO** | Partial | Service pages have metadata; not checked line-by-line against prompt. |
| **Google Maps on contact** | ❌ | Not verified; prompt asks for real embed. |

**Verdict:** Service schema and meta exist; full LocalBusiness on root and Maps embed are not done.

---

### [MEDIUM-8] Uptime & Performance Monitoring — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Vercel Analytics** | ✅ | `@vercel/analytics` in layout. |
| **SpeedInsights** | ❌ | `@vercel/speed-insights` not in package or layout. |
| **Health endpoint** | ❌ | No `GET /api/health`. |
| **M-Pesa Daraja check** | ❌ | No `lib/mpesa-health.ts` or fallback before STK push. |
| **UptimeRobot** | — | External; no code. |

**Verdict:** Analytics only; no health route, SpeedInsights, or Daraja check.

---

### [MEDIUM-9] Airtel Money Payment — **PARTIAL** (UI only)

| Item | Status | Notes |
|------|--------|--------|
| **Checkout UI** | ✅ | Airtel Money option and phone input exist. |
| **Backend** | ❌ | No Airtel Africa API or Pesapal Airtel flow; .env notes say add credentials when available. |
| **Schema** | ❌ | No `AIRTEL_MONEY` in PaymentProvider enum (only MPESA, PESAPAL, etc.). |

**Verdict:** UI only; no Airtel payment processing.

---

### [MEDIUM-10] File Validation on Upload — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Large format** | ❌ | No `lib/file-validation/large-format.ts` or sharp-based DPI check. |
| **STL** | ❌ | No `lib/file-validation/stl.ts`. |
| **FileUploader** | ❌ | No validation result (errors/warnings) shown after confirm. |

**Verdict:** Not implemented.

---

### [MEDIUM-11] Print File Preparation Guides — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Pages** | ❌ | No `/file-prep/large-format` or `/file-prep/3d-printing`. |
| **Link from quote/upload** | ❌ | No “View our file preparation guide” link. |

**Verdict:** Not implemented.

---

### [MEDIUM-12] Swahili Language Support — **NOT IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **next-intl** | ❌ | Not in package.json. |
| **app/[locale]** | ❌ | No locale routing. |
| **messages/sw.json** | ❌ | No translation files. |
| **Language toggle** | ❌ | No EN/SW toggle in header. |

**Verdict:** Not implemented.

---

## Build order (from prompt) — what’s missing first

1. **CRITICAL-1** — Delivery: add Delivery model, seed zones, full API, checkout ETA, admin Delivery tab + dashboard, customer delivery timeline, notifications.
2. **CRITICAL-2** — Invoices/Quotes: add @react-pdf/renderer, Counter, QuotePdf, Invoice/Quote PDF components, generate + R2 + send APIs, auto-generate on payment, admin Finance Invoices.
3. **CRITICAL-3** — Refunds: extend Refund schema, add Cancellation, refund + cancel APIs, M-Pesa B2C, customer and admin refund UI, checkout policy checkbox, notifications.
4. **CRITICAL-4** — Support: extend SupportTicket/TicketMessage, add ticket APIs, wire contact form to create ticket, add /account/support and /admin/support, notifications.
5. Then HIGH-1 through HIGH-5, then MEDIUM-1 through MEDIUM-12 as in the prompt.

---

*Generated from codebase audit. Implement each gap per the Critical Gaps Build Prompt.*
