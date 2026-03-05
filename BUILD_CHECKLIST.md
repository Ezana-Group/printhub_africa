# PrintHub — Master Build Checklist

Status key: ✅ Done | 🚧 In progress | ⬜ Not started

---

## PHASE 1: PROJECT SETUP & INFRASTRUCTURE

- [x] Initialize Next.js 14 project with TypeScript and App Router
- [x] Configure Tailwind CSS with custom design tokens (colors, fonts, spacing)
- [x] Install and configure shadcn/ui component library
- [x] Set up ESLint, Prettier, Husky (pre-commit hooks)
- [x] Configure absolute imports (`@/components`, `@/lib`, etc.)
- [x] Set up PostgreSQL database (local dev + production connection string)
- [x] Initialize Prisma ORM with `prisma init`
- [x] Create `.env.local` with all environment variable placeholders (documented in .env.local.example)
- [ ] Set up AWS S3 or Cloudflare R2 bucket for file storage (lib/s3.ts placeholder)
- [x] Configure NextAuth.js with providers (Email + Google)
- [x] Set up Resend for transactional email (lib/email.ts)
- [x] Africa's Talking SDK for Kenya SMS (lib/africas-talking.ts)
- [x] Sanity.io placeholder (lib/sanity.ts)
- [x] Algolia placeholder (lib/algolia.ts)
- [ ] Configure Google Analytics 4 and Hotjar
- [ ] Deploy skeleton to Vercel with custom domain `printhub.africa`
- [ ] Configure SSL certificate on domain
- [ ] Set up staging environment `staging.printhub.africa`

---

## PHASE 2: DATABASE SCHEMA (Prisma)

- [x] Full schema: User, Address, Session, Account, VerificationToken
- [x] Category, Product, ProductVariant, ProductImage, ProductReview
- [x] PrintMaterial, PrintFinish, PrintingMedium, LaminationType
- [x] Order, OrderItem, OrderTimeline, ShippingAddress, Refund
- [x] Payment, MpesaTransaction, Invoice
- [x] UploadedFile, PrintQuote
- [x] Coupon, CouponUsage, Newsletter, Wishlist, Cart, Notification
- [x] CorporateAccount, BulkQuote
- [x] Inventory, ProductionQueue, Machine
- [x] Staff, AuditLog, SupportTicket, TicketMessage
- [ ] Run migrations: `npx prisma migrate dev --name init` (requires DB)
- [x] Seed: categories, sample products, print materials, mediums, admin user, coupons

---

## PHASE 3: AUTHENTICATION SYSTEM

- [x] NextAuth with Prisma adapter + JWT session
- [x] Email/password + Google OAuth placeholders
- [x] Email verification flow (Resend + VerificationToken)
- [x] Password reset flow (forgot → email link → reset)
- [x] Role-based access control middleware (/admin, /account)
- [x] Guest checkout support (cart persistence via zustand + localStorage)
- [ ] Phone verification (Africa's Talking OTP)
- [x] Remember me (session maxAge 30 days), lockout (5 attempts, 15 min)
- [ ] 2FA for admin

---

## PHASE 4: CUSTOMER-FACING WEBSITE (partial)

- [x] Global layout: announcement bar, header (nav, cart, auth), footer, WhatsApp float
- [x] Homepage: Hero, Services overview, How it works, Featured products, Price calculator teaser, Why PrintHub, CTA banner
- [x] Placeholder pages: shop, upload, quote, contact, blog, cart, services/large-format, services/3d-printing, account
- [x] Full services pages with calculators (large-format + 3D materials)
- [x] Full shop listing, product detail, cart (API + store + pages)
- [x] Checkout page with M-Pesa payment
- [x] Upload flow, quote form (forms + APIs)
- [x] Account sections (orders, addresses, profile)
- [x] Contact form; Blog placeholder (Sanity when configured)

## PHASE 5: PAYMENT INTEGRATIONS

- [x] M-Pesa STK Push (lib/mpesa.ts, /api/payments/mpesa/stkpush)
- [x] M-Pesa callback (/api/payments/mpesa/callback)
- [x] M-Pesa query for polling (/api/payments/mpesa/query)
- [x] Checkout page with M-Pesa UI (phone input, pay button, polling)
- [x] Pesapal, Flutterwave, Stripe stubs (501)
- [ ] Pesapal v3 full implementation
- [ ] Flutterwave full implementation
- [ ] Stripe Payment Intents
- [ ] Bank transfer (show details, upload proof)

## PHASE 6: ADMIN DASHBOARD

- [x] Admin layout with sidebar nav (Dashboard, Orders, Products, Customers, Quotes, Finance, Inventory, Marketing, Staff, Reports, Settings)
- [x] Dashboard: KPIs, revenue chart, orders by status pie, recent orders, low stock
- [x] Orders list and order detail
- [x] Products list, customers, finance, quotes, inventory, marketing, staff, reports, settings
- [x] Product add/edit form (POST /api/admin/products, PATCH /api/admin/products/[id], ProductForm component)
- [x] Order status update, timeline, refund (PATCH /api/admin/orders/[id], POST refund, OrderActions component)
- [ ] Full CRUD for all modules (customers, quotes, etc. — product & order CRUD done)

## PHASES 7–15

- [x] Email: order confirmation template (lib/email.ts)
- [x] SEO: metadata (layout), sitemap.ts, robots.ts
- [x] A11y: skip-to-main link, main id
- [x] 404 (not-found.tsx), 500 (error.tsx, global-error.tsx)
- [ ] PWA manifest
- [ ] Testing (unit/e2e)
- [ ] DevOps (Vercel, staging)
- [ ] Content & launch checklist

---

*Last updated: Phase 4 (shop, cart, upload, quote, account, contact, services calculators) and Phase 7–8 (email template, SEO, 404/500, skip link) complete.*
