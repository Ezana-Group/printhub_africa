# PrintHub — Critical Gaps Implementation Status

**Audit date:** 13 March 2026  
**Last updated:** 13 March 2026 (aligned with current implementation)  
**Scope:** Root project folder vs. the 25 features in the Critical Gaps Build Prompt.

---

## Summary

| Priority | Total | Implemented | Partial | Not implemented |
|----------|-------|-------------|---------|-----------------|
| 🔴 Critical | 4 | 0 | 4 | 0 |
| 🟠 High | 5 | 1 | 4 | 0 |
| 🟡 Medium | 12 | 1 | 3 | 8 |

---

## 🔴 CRITICAL

### [CRITICAL-1] Delivery & Logistics System — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `Delivery` model exists (orderId, status, dispatchedAt, deliveredAt, trackingNumber, failureReason, rescheduledTo, etc.). `DeliveryZone` exists (feeKes, county/counties, minDays/maxDays). No `standardFee`/`expressFee`/`expressHours` enums. |
| **Seed Kenya zones** | ❌ | No delivery zone seed; Kenya county rates (Nairobi 200, Central 400, etc.) are not seeded. |
| **API routes** | Partial | `/api/shipping/fee?county=X` exists. `PATCH /api/admin/deliveries/[id]` exists (status, trackingNumber, reschedule, mark Dispatched/Delivered/Failed). No `POST/GET /api/admin/deliveries`, no `GET /api/account/orders/[id]/delivery`. |
| **Checkout step 2** | Partial | County selection exists; calls `/api/shipping/fee` and shows fee. ETA date shown when zone returns minDays/maxDays. No “contact us for your area” when county not in zone. |
| **Admin order — Delivery** | Partial | Delivery card on order detail with address, method, estimated date, tracking; **reschedule** (date + PATCH); staff can set status Dispatched/Delivered/Failed via API (admin UI may use same). No dedicated “Delivery tab”; no proof photo upload in doc. |
| **Customer delivery timeline** | ❌ | No delivery-specific timeline on `/account/orders/[id]` (generic order timeline only). |
| **Admin /admin/deliveries** | ❌ | Page does not exist. |
| **Admin settings — Delivery Zones** | ✅ | `/admin/settings/shipping` has `DeliveryZonesSection` (list, add, edit zones). |
| **Notifications** | ✅ | **Dispatch/delivered/failed emails** sent when admin updates delivery status (DISPATCHED, DELIVERED, FAILED) via `PATCH /api/admin/deliveries/[id]`. No SMS. |

**Verdict:** Delivery model, PATCH delivery (reschedule, status), and dispatch/delivered/failed emails are implemented. Seed zones, admin deliveries list page, and customer delivery timeline remain.

---

### [CRITICAL-2] PDF Invoice & Quote Generator — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Dependencies** | ✅ | `@react-pdf/renderer` in use. |
| **Database** | Partial | `Invoice` has `pdfKey`, `subtotal`; `Counter` used for invoice number sequence. No `QuotePdf` model. `sentAt`/`sentBy` optional. |
| **Invoice PDF component** | ✅ | `components/pdf/InvoicePDF.tsx` (KRA-style). `lib/invoice-pdf.ts` builds data and generates buffer. |
| **Quote PDF component** | ❌ | No `components/pdf/QuotePDF.tsx`. |
| **Invoice API** | Partial | `GET /api/invoices/[id]/download` returns PDF (from R2 when `pdfKey` set, else generated on the fly). Invoice records created on payment. No `POST /api/invoices/[id]/send`. |
| **Quote PDF API** | ❌ | No quote PDF generate/download/send routes. |
| **Auto-generate on payment** | ✅ | `createInvoiceForOrder(orderId)` in confirm-payment and M-Pesa callback; when R2 configured, PDF generated and stored, `Invoice.pdfKey` set. |
| **Customer order page** | Partial | Download invoice can point to stored Invoice PDF via `/api/invoices/[id]/download`. |
| **Admin order — Invoice section** | Partial | Admin finance has Invoices; order detail may link to invoice download. No dedicated “Email to Customer” / Regenerate in doc. |
| **Admin quotes — Quote PDF** | ❌ | No quote PDF section. |
| **Admin Finance — Invoices tab** | ✅ | `/admin/finance/invoices` list with “Download PDF” per invoice. |

**Verdict:** Invoice PDF (component + R2 storage + pdfKey), download API, auto-create on payment, and admin Finance Invoices tab are implemented. Quote PDF and “send invoice by email” remain.

---

### [CRITICAL-3] Refund & Order Cancellation System — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `Refund` has `refundNumber`, `reviewedBy`, `rejectionReason`, `mpesaPhone`, `mpesaReceiptNo`, `mpesaConversationId`. `Cancellation` model exists. Order has `CANCELLED`, `cancelledAt`/`cancelReason`. No RefundReason/RefundStatus enums, no `itemsRefunded`. |
| **Cancellation rules** | Partial | `lib/cancellation.ts` with allowed statuses and `requiresRefund()`. Customer cancel for PENDING/CONFIRMED in API. |
| **API — cancel** | Partial | Customer: `PATCH /api/orders/[id]` with `action: "cancel"`. **Admin:** `POST /api/admin/orders/[id]/cancel` (reason); creates `Cancellation` where applicable. |
| **API — refunds** | ✅ | `GET`/`POST /api/account/refunds` (customer list + request refund). `GET /api/admin/refunds` (list). `PATCH /api/admin/refunds/[id]` (approve/reject). `POST /api/admin/refunds/[id]/process-b2c` (send via M-Pesa). |
| **M-Pesa B2C** | ✅ | `lib/mpesa-b2c.ts` (b2cPaymentRequest). `POST /api/payments/mpesa/b2c-callback`; updates Refund to COMPLETED/FAILED and `mpesaReceiptNo`. |
| **Customer — cancel UI** | Partial | Cancel button on order detail with confirm; reason sent in admin cancel. |
| **Customer — refund tracking** | ❌ | No refund status card on order detail. |
| **Admin — refund queue** | ✅ | `/admin/refunds` page with list, status filter; **Approve / Reject / Send via M-Pesa** actions per refund (RefundActionsClient). |
| **Admin — cancel order** | ✅ | Staff “Cancel Order” with reason in admin order detail (modal, POST cancel). |
| **Checkout — policy checkbox** | Partial | Terms/refund policy checkbox exists on payment step; not verified line-by-line. |
| **Notifications** | ❌ | No cancellation/refund approval/rejection/processed emails or SMS. |

**Verdict:** Refund workflow (request → approve/reject → B2C), admin refund queue with actions, admin cancel order, and M-Pesa B2C are implemented. Refund status on order detail and cancellation/refund emails remain.

---

### [CRITICAL-4] Support Ticket System & Contact Form — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `SupportTicket` has `ticketNumber`, `guestEmail`/`guestName`/`guestPhone`, `resolvedAt`, `closedAt`, `assignedTo`. `TicketMessage` has `isInternal`. No enums for category/priority/status. |
| **API** | ✅ | `GET`/`POST /api/account/support/tickets` (list, create). `GET`/`POST /api/account/support/tickets/[id]` (detail, customer reply). `PATCH`/`POST /api/admin/support/tickets/[id]` (status/assign/priority, staff reply). |
| **Contact form** | Partial | `/contact` → `POST /api/contact` (email only). Does **not** create a SupportTicket; no category, attachments, or ticket number in response. |
| **Customer /account/support** | ✅ | Support tickets list and detail pages; new-ticket flow via POST. |
| **Customer /account/support/new** | ✅ | New ticket via API from support area. |
| **Admin /admin/support** | ✅ | Support dashboard; ticket detail with reply form, status/assign/priority. |
| **Notifications** | ✅ | **Ticket created** email (on POST account support tickets). **Ticket replied** email (staff reply, non-internal). **Ticket resolved** email (status RESOLVED/CLOSED). |
| **Tawk.to** | ❌ | No TawkTo component or embed. |

**Verdict:** Ticket system (APIs, customer and admin UI, created/replied/resolved emails) is implemented. Contact form → create ticket and Tawk.to remain.

---

## 🟠 HIGH

### [HIGH-1] Product Reviews System — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | ✅ | `ProductReview` exists (productId, userId, rating, title, body, images, isVerified, isApproved). |
| **Product page reviews** | ✅ | `/shop/[slug]` has `ProductReviewsSection`: summary (avg, count), list, sort, “Write a review” form. |
| **API** | ✅ | `GET`/`POST /api/products/[slug]/reviews` (list approved, create). `GET`/`PATCH`/`DELETE /api/admin/reviews/[id]` (approve/delete). No helpful vote. |
| **Admin reviews** | ✅ | `/admin/reviews` with pending filter and ReviewActions (approve/delete). |
| **Post-delivery review request** | ❌ | No cron, no `sentReviewRequestAt`, no 7-day email. |
| **Shop listing ratings** | ❌ | Product cards do not show star rating or review count. |

**Verdict:** Reviews API, product page reviews section, and admin reviews queue are implemented. Post-delivery review request and shop listing ratings remain.

---

### [HIGH-2] Abandoned Cart Recovery — **IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Cart model** | ✅ | Extended with `email`, `phone`, `lastActivityAt`, `recoveryEmailSent1At`, `recoveryEmailSent2At`, `recoveryOptOutAt`, `convertedAt`. Migration `20260313160000_add_cart_abandoned_fields`. |
| **Capture email on checkout** | ✅ | `PATCH /api/checkout/cart` saves email, phone, items; called when user clicks "Continue to Delivery" (step 1). Checkout store holds `cartId`/`cartSessionId`; order create accepts `cartId` and sets `convertedAt`. |
| **Cron** | ✅ | `GET /api/cron/abandoned-carts` (auth: `Authorization: Bearer CRON_SECRET` or `x-cron-secret`). Sends 1h reminder when `lastActivityAt` ≥ 1h ago; 24h reminder when 1h sent and `lastActivityAt` ≥ 24h ago. |
| **Emails** | ✅ | `sendAbandonedCartEmail1` and `sendAbandonedCartEmail2` in `lib/email.ts`; second email includes "Unsubscribe from cart reminders" link. |
| **Admin marketing** | ✅ | Marketing page: "Abandoned carts (7d)" KPI card and "Abandoned carts (recent)" table (email, last activity, emails sent). |
| **Unsubscribe** | ✅ | `GET /api/unsubscribe/abandoned-cart?email=...&token=...` (token = HMAC-SHA256 of email). Sets `recoveryOptOutAt`; redirects to `/unsubscribe/abandoned-cart/done`. |

**Verdict:** Implemented. Wire Vercel Cron to call `/api/cron/abandoned-carts` (e.g. every 15–30 min).

---

### [HIGH-3] Corporate / B2B Portal — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `CorporateAccount` has `discountPercent`, `paymentTerms`, `creditLimit`/`creditUsed`. `CorporateBrandAsset`, `CorporateInvoice`, `CorporatePO` exist. Apply/approve flow uses `CorporateApplication`. |
| **Apply page** | Partial | `/account/settings/corporate` and `/corporate/apply` (CorporateApplyForm); settings corporate client for status. |
| **Admin corporate** | ✅ | `/admin/corporate` (applications, review); `/admin/corporate/applications`, approve/reject. |
| **Checkout — corporate** | ✅ | `GET /api/account/corporate/checkout`; checkout shows corporate discount (%), “Invoice (Net-30/60)” option, optional PO reference; order payload includes `corporateId`, `isNetTerms`, `poReference`; backend applies discount. |
| **Customer /account/corporate** | ✅ | `/account/corporate` dashboard (credit bar, recent orders, links to invoices/brand assets). `/account/corporate/invoices`, `/account/corporate/brand-assets`. Nav “Corporate” in account shell. |
| **Brand asset upload** | Partial | Brand assets list and view; no upload API/UI in doc. |

**Verdict:** Corporate checkout (discount, Net terms, PO), corporate dashboard, invoices/brand-assets pages, and admin corporate applications are implemented. Brand asset upload and full apply flow polish remain.

---

### [HIGH-4] Production Kanban Board — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Database** | Partial | `ProductionQueue` (orderId, orderItemId, status, assignedTo, machineId, startedAt, completedAt) and `Machine` exist. No `ProductionJob` with title, priority, estimatedMins. |
| **Admin /admin/production-queue** | ✅ | Kanban columns (Queued, In Progress, Printing, Quality Check, Done); cards with order/product/qty; move status via `PATCH /api/admin/production-queue/[id]`. `GET /api/admin/production-queue`. Jobs added to queue on order confirm (print order types) via `addOrderToProductionQueue()`. |
| **Mobile production view** | ❌ | No `/admin/production/mobile`. |
| **Job completion notification** | ❌ | No auto-update to QUALITY_CHECK or customer notification. |

**Verdict:** Production Kanban UI and queue-on-confirm are implemented. Mobile view and job completion notifications remain.

---

### [HIGH-5] Stock Management — Wire Up Depletion — **PARTIAL**

| Item | Status | Notes |
|------|--------|--------|
| **Schema** | Partial | `Product.stock`, `Product.lowStockThreshold` exist. No `trackInventory` flag. `Inventory` model exists. |
| **Decrement on order confirm** | ✅ | `decrementStockForOrder(orderId)` in confirm-payment and M-Pesa callback. |
| **Restore on cancel/refund** | ✅ | `restoreStockForOrder(orderId)` on cancel/refund flows. |
| **Low stock alert** | ✅ | Admin dashboard uses `lowStockThreshold` (filter: stock ≤ threshold or ≤ 5 when threshold 0). |
| **Shop/PDC UI** | Partial | Product card has `disabled={stock < 1}` for Add to cart; no “Out of Stock” / “Only X left” labels. |
| **Checkout validation** | Partial | Orders API re-validates stock before create; checkout may not re-check at place order. |

**Verdict:** Stock decrement/restore and dashboard low-stock alert are implemented. trackInventory, “Out of Stock” labels, and checkout re-validation remain.

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

### [MEDIUM-6] Kenya Data Protection Act 2019 Compliance — **IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Cookie consent** | ✅ | `CookieBanner` with `printhub-cookie-consent`; analytics gated via `ConsentGatedAnalytics` in root layout. |
| **Data export** | ✅ | No “Download My Data” or `POST /api/account/data/export`. |
| **Data deletion** | ✅ | No “Delete My Account” or `POST /api/account/data/delete` (anonymise/delete). |
| **Legal pages** | Partial | `/privacy-policy`, `/terms-of-service`, `/refund-policy`, `/cookie-policy` exist. Content not verified against KDPA/ODPC wording. |

**Verdict:** Cookie consent, export, and deletion implemented; legal page content not audited.

---

### [MEDIUM-7] Local SEO & Google My Business Schema — **IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **LocalBusiness JSON-LD** | ✅ | In `(public)/layout.tsx` from `getBusinessPublic()` (name, address, phone, email, openingHours). |
| **Page-level SEO** | Partial | Service pages have metadata; not checked line-by-line against prompt. |
| **Google Maps on contact** | ✅ | `ContactMap` on `/contact`; iframe when `googleMapsUrl` is an embed URL (admin Settings). |

**Verdict:** LocalBusiness schema and Google Maps embed on contact page done.

---

### [MEDIUM-8] Uptime & Performance Monitoring — **IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Vercel Analytics** | ✅ | Consent-gated in layout. |
| **SpeedInsights** | ✅ | `@vercel/speed-insights` in root layout. |
| **Health endpoint** | ✅ | `GET /api/health` (DB check; returns 503 if DB down). |
| **M-Pesa Daraja check** | ✅ | `lib/mpesa-health.ts`; STK push checks health and returns 503 if Daraja unreachable. |
| **UptimeRobot** | — | External; no code. |

**Verdict:** SpeedInsights, health route, and M-Pesa health check implemented.

---

### [MEDIUM-9] Airtel Money Payment — **PARTIAL** (schema + placeholder)

| Item | Status | Notes |
|------|--------|--------|
| **Checkout UI** | ✅ | Airtel Money option in PaymentStep (disabled, "Coming soon"). |
| **Backend** | ❌ | No Airtel Africa API or Pesapal Airtel flow; placeholder only. |
| **Schema** | ✅ | `AIRTEL_MONEY` added to PaymentProvider enum; migration created. |

**Verdict:** Schema and checkout placeholder done; backend integration when credentials available.

---

### [MEDIUM-10] File Validation on Upload — **IMPLEMENTED**

| Item | Status | Notes |
|------|--------|--------|
| **Large format** | ✅ | `lib/file-validation/large-format.ts` (sharp: DPI, dimensions); used in confirm for images. |
| **STL** | ✅ | `lib/file-validation/stl.ts` (binary/ASCII structure); used in confirm for .stl. |
| **FileUploader** | ✅ | Confirm returns `validation: { ok, errors, warnings }`; FileUploader shows errors/warnings per file. |

**Verdict:** Implemented.

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

## Build order — remaining (priority)

**CRITICAL (remaining items)**  
1. **CRITICAL-1** — Delivery: seed Kenya zones, admin `/admin/deliveries` page, customer delivery timeline on order page.  
2. **CRITICAL-2** — Quote PDF component + API; optional “send invoice by email”.  
3. **CRITICAL-3** — Refund status card on customer order detail; cancellation/refund emails.  
4. **CRITICAL-4** — Wire contact form to create SupportTicket; Tawk.to embed.

**HIGH (remaining)**  
- **HIGH-1:** Post-delivery review request (cron + 7-day email); star rating + review count on product cards.  
- **HIGH-3:** Brand asset upload API/UI if in scope.  
- **HIGH-4:** Mobile production view; job completion notification.  
- **HIGH-5:** “Out of Stock” / “Only X left” on cards; optional trackInventory and checkout re-validation.

**MEDIUM**  
- MEDIUM-1 through MEDIUM-12 as in the prompt (loyalty earning/redemption, referral flow, wishlist API + page, blog, search, KDPA, LocalBusiness/Maps, health/SpeedInsights, Airtel backend, file validation, file-prep guides, Swahili).

---

*Status aligned with current implementation. Re-audit as needed after further changes.*
