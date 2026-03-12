# PrintHub Audit — Critical + High Fix Checklist (Sprint)

Use this as the sprint checklist. Full context in **AUDIT_REPORT.md**.

---

## 🔴 CRITICAL — Fix before any real customers

- [x] **M-Pesa callback security** — `app/api/payments/mpesa/callback/route.ts`  
  **DONE:** Validate callback using `MPESA_CALLBACK_IP_WHITELIST` (comma-separated IPs). If set, only those IPs accepted; if empty (sandbox), allow all.

- [x] **Pesapal card payments** — `app/api/payments/pesapal/initiate/route.ts` + callback  
  **DONE:** Initiate validates body and returns 501 with friendly message when not implemented. **DONE:** `POST /api/payments/pesapal/callback` IPN route added; updates Payment + Order on completed status. Register this URL in Pesapal dashboard.

- [x] **Order cancellation**  
  **DONE:** Customer can cancel from order detail: `PATCH /api/orders/[id]` with `{ action: "cancel", cancelReason? }`. Only PENDING/CONFIRMED. Creates tracking event and notifies (SMS/email via tracking).

- [x] **Refund system**  
  **DONE:** Admin POST `/api/admin/orders/[id]/refund` creates Refund, sets Order status to REFUNDED, calls `createTrackingEvent(REFUNDED)` so customer gets email + SMS. Optional `markCompleted: true` in body. Refund form added to order detail page (amount, reason, “Issue refund and notify customer”).

- [x] **KRA-compliant PDF invoice**  
  **DONE:** `GET /api/orders/[id]/invoice` returns print-ready HTML with 16% VAT, line items, business details, optional KRA PIN (env `KRA_PIN`). Customer order detail has "Download invoice" (open in new tab → Print to PDF).

---

## 🟠 HIGH — Fix before launch

- [x] **Contact page** — `app/(public)/contact/page.tsx`  
  **DONE:** Full-page contact form that POSTs to `/api/contact` (name, email, phone, subject, message). Success/error feedback.

- [x] **Audit log real data** — `app/(admin)/admin/settings/audit-log/page.tsx`  
  **DONE:** `AuditLogClient` fetches `GET /api/admin/settings/audit-log` with filters (from, to, q, page). Table shows real log entries.

- [x] **My-account activity real data** — `app/(admin)/admin/settings/my-account/activity/page.tsx`  
  **DONE:** `MyActivityClient` fetches `GET /api/admin/settings/my-activity` and displays recent audit events for current user.

- [x] **Loading states** — Add `loading.tsx` to high-traffic segments.  
  **DONE:** checkout, cart, get-a-quote, track, account, contact.

- [x] **Error boundaries** — Add `error.tsx` for critical routes.  
  **DONE:** get-a-quote, track, cart, contact (Sentry + Try again + WhatsApp link).

- [x] **Rate limiting** — Register and STK already had rate limiting. Login has per-account lockout (5 failures = 15 min). No additional change.

- [x] **SMS in tracking** — `lib/tracking.ts`  
  **DONE:** `sendTrackingSms` uses `sendSMS` from `lib/africas-talking`; `sendTrackingEmail` uses new `sendOrderStatusEmail` from `lib/email`. Admin order status change now calls `createTrackingEvent`, so customer gets SMS + email on status updates.

- [x] **Admin/account API auth** — **DONE:** Audited; only `/api/admin/accept-invite` is intentionally unauthenticated (invite flow). Secured by requiring `token` in body and validating it (bcrypt.compare, expiry). Form now sends token; API validates before setting password.

---

## Reference

- **Full report:** `AUDIT_REPORT.md`
- **Safe to delete:** `AUDIT_DELETE.md`
- **Raw scan:** `audit-raw.txt`
