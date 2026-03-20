# PrintHub — Email Reference

This document lists all emails used across the system: environment variables, business settings, transactional email types, and fallback addresses.

---

## 1. Environment Variables

| Variable | Default / Example | Purpose |
|----------|-------------------|--------|
| **FROM_EMAIL** | `hello@printhub.africa` | Sender for all transactional email (Resend "from"). |
| **FROM_NAME** | `PrintHub` | Sender display name. |
| **CONTACT_EMAIL** | *(optional)* | Where **contact form** and **quote form** submissions are sent. If unset: `FROM_EMAIL` → `business.primaryEmail` → `hello@printhub.africa`. |
| **ADMIN_EMAIL** | `admin@printhub.africa` (in `.env.example`) | Used for: manual payment notification, corporate application "new application" admin email, transfer-ownership notifications. |
| **NOTIFY_EMAIL** | *(optional)* | Fallback when **ADMIN_EMAIL** is used (e.g. corporate apply, manual payment). |
| **CAREERS_NOTIFICATION_EMAIL** | *(optional)* | Where **career application** notifications are sent. Fallback: `FROM_EMAIL` → `business.primaryEmail` → `admin@printhub.africa`. |

Defined/used in: `lib/email.ts`, `lib/auth.ts`, `app/api/contact/route.ts`, `app/api/quote/route.ts`, `app/api/corporate/apply/route.ts`, `app/api/payments/manual/route.ts`, `app/api/careers/[slug]/apply/route.ts`, `app/api/invoices/[id]/send/route.ts`.

---

## 2. Business Settings (Database)

Stored in **BusinessSettings**, editable in **Admin → Settings → Business**. Used in layout, footer, legal content injection, invoices, and support links.

| Field | Default in Code | Purpose |
|-------|-----------------|--------|
| **primaryEmail** | `hello@printhub.africa` | Main contact; footer "Contact", legal content, invoice footer, contact/quote recipient when no CONTACT_EMAIL. |
| **supportEmail** | `support@printhub.africa` | Support; FAQ "Contact support", account security "Contact support" link, legal content. |
| **financeEmail** | `finance@printhub.africa` | Billing/finance (exposed in business public/cache). |

Defaults appear in: `lib/business-public.ts`, `lib/cache/unstable-cache.ts`, `app/api/settings/business-public/route.ts`, `components/admin/settings-business-client.tsx`.

---

## 3. Hardcoded / Fallback Addresses in Code

| Address | Where Used |
|---------|------------|
| **hello@printhub.africa** | General contact, account/order/refund instructions in legal and UI, FROM_EMAIL default. |
| **support@printhub.africa** | Support (FAQ, security screen, legal), BusinessSettings default. |
| **dpo@printhub.africa** | Data Protection Officer — legal docs only (`prisma/legal-content.ts`). |
| **admin@printhub.africa** | Admin notifications fallback, careers fallback, seed admin user. |
| **finance@printhub.africa** | BusinessSettings finance default. |

Legal content in `prisma/legal-content.ts` and `[legalSlug]/page.tsx` injects business settings (e.g. `primaryEmail`, `supportEmail`) so displayed addresses can differ from these defaults when BusinessSettings are set.

---

## 4. Editable Email Templates (Phase 1)

Transactional email **subject** and **body** can be edited in **Admin → Content → Email Templates**. Each template has a slug (e.g. `verification`, `order-confirmation`); placeholders like `{{businessName}}`, `{{orderNumber}}`, `{{footer}}` are replaced at send time. Default content is seeded with `npm run db:seed:email-templates`. Admin can list, edit, preview (with sample data), and send a test email per template. If a template is missing or empty in the DB, the system falls back to the built-in default in `lib/email.ts`. See `lib/email-templates.ts` for placeholder metadata and sample context.

---

## 5. Transactional Emails (by recipient)

All sent via **Resend** using `FROM_EMAIL`. Implemented in `lib/email.ts`.

### To customer / applicant

| Email function | Trigger |
|----------------|--------|
| `sendVerificationEmail` | Email verification after signup |
| `sendPasswordResetEmail` | Password reset request |
| `sendQuoteReceivedEmail` | Quote request submitted |
| `sendQuoteSentToCustomerEmail` | Admin sent quote to customer |
| `sendQuoteInProductionEmail` | Quote moved to production |
| `sendOrderConfirmationEmail` | Order confirmed |
| `sendOrderStatusEmail` | Order status / tracking update |
| `sendPaymentReceivedEmail` | Payment received |
| `sendPaymentRejectedEmail` | Payment rejected |
| `sendPickupConfirmationEmail` | Pickup order ready |
| `sendDeliveryDispatchedEmail` | Delivery dispatched |
| `sendDeliveryDeliveredEmail` | Delivery delivered |
| `sendDeliveryFailedEmail` | Delivery failed |
| `sendOrderCancelledEmail` | Order cancelled |
| `sendRefundApprovedEmail` | Refund approved |
| `sendRefundRejectedEmail` | Refund rejected |
| `sendRefundProcessedEmail` | Refund processed |
| `sendTicketCreatedEmail` | Support ticket created |
| `sendTicketRepliedEmail` | Reply on support ticket |
| `sendTicketResolvedEmail` | Support ticket resolved |
| `sendAbandonedCartEmail1` | Abandoned cart reminder 1 |
| `sendAbandonedCartEmail2` | Abandoned cart reminder 2 |
| `sendCareerApplicationConfirmationEmail` | Career application submitted |
| `sendCareerStatusShortlistedEmail` | Applicant shortlisted |
| `sendCareerStatusRejectedEmail` | Applicant rejected |
| `sendCareerOfferMadeEmail` | Job offer made |
| `sendCorporateApplicationReceivedEmail` | Corporate application submitted |
| `sendCorporateApplicationApprovedEmail` | Corporate application approved |
| `sendCorporateApplicationRejectedEmail` | Corporate application rejected |

### To staff (email passed in)

| Email function | Trigger |
|----------------|--------|
| `sendStaffQuoteAcceptedEmail` | Quote accepted by customer |
| `sendStaffQuoteAssignedEmail` | Quote assigned to staff |

### To admin / internal

| Email function / flow | Recipient | Trigger |
|----------------------|-----------|--------|
| `sendCareerApplicationNotificationToAdmin` | `CAREERS_NOTIFICATION_EMAIL` → `FROM_EMAIL` → `business.primaryEmail` → `admin@printhub.africa` | New career application |
| `sendCorporateApplicationNewAdminEmail` | `ADMIN_EMAIL` or `NOTIFY_EMAIL` | New corporate application |
| Manual payment recorded | `ADMIN_EMAIL` or `NOTIFY_EMAIL` | Customer selects manual payment |
| Transfer ownership | Current and new owner emails | Admin transfers ownership |
| Factory reset / export-all-data / user invite | Requesting user or invited email | Admin actions |

### Contact / quote forms

- **Recipient:** `CONTACT_EMAIL` ?? `FROM_EMAIL` ?? `business.primaryEmail` ?? `hello@printhub.africa`
- **Routes:** `app/api/contact/route.ts`, `app/api/quote/route.ts`

### Invoice “email to customer”

- **From:** `FROM_EMAIL` (e.g. `PrintHub <hello@printhub.africa>`)
- **To:** Customer email
- **Route:** `app/api/invoices/[id]/send/route.ts`

---

## 6. Seed / Test User Emails

Defined in `prisma/seed.ts` (and `prisma/scripts/seed-production.ts` for production seed):

| Email | Role / purpose |
|-------|----------------|
| **admin@printhub.africa** | Admin user |
| **admin2@printhub.africa** | Second admin |
| **sales@printhub.africa** | Sales staff |
| **marketing@printhub.africa** | Marketing staff |
| **customer@printhub.africa** | Test customer |
| **corporate@printhub.africa** | Test corporate account (e.g. CORP-001) |

These are for development/seed only; production should use real addresses and configure env/DB as above.

---

## 7. Quick reference: where to change what

| Goal | Where to change |
|------|------------------|
| Sender of all transactional email | `FROM_EMAIL` in `.env` |
| Contact form / quote form recipient | `CONTACT_EMAIL` or Admin → Settings → Business → Primary Email |
| Support link and support-related copy | Admin → Settings → Business → Support Email |
| Admin notifications (manual payment, corporate applications) | `ADMIN_EMAIL` in `.env` |
| Career application notifications | `CAREERS_NOTIFICATION_EMAIL` or `FROM_EMAIL` / Business primary |
| DPO / legal doc contact | Update `prisma/legal-content.ts` and/or BusinessSettings if you add a DPO field |
| Subject/body of transactional emails | Admin → Content → Email Templates (placeholders: `{{businessName}}`, `{{orderNumber}}`, etc.) |
