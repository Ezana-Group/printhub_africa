# PrintHub Africa — System Architecture & Documentation

**Product:** PrintHub — Large-format printing & 3D printing for Nairobi and Kenya  
**Company:** Ezana Group  
**Repository:** Printhub_Africa_ProdV1  
**Last updated:** April 5, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Data Model & Entity Relationships](#4-data-model--entity-relationships)
5. [API Layer](#5-api-layer)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Business Flows](#7-business-flows)
8. [External Integrations](#8-external-integrations)
9. [Deployment & Environment](#9-deployment--environment)

---

## 1. Overview

PrintHub is a **full-stack e-commerce and print-services platform** for:

- **Large-format printing** (banners, vinyl, canvas, signage)
- **3D printing** (FDM, resin; custom and ready-made)
- **Shop** (ready-made products, custom print, print-on-demand catalogue)
- **B2B** (corporate accounts, net terms, POs, team management)
- **Hardware/Equipment** (professional printers, scanners, bundles, warranties)

### Architecture Summary

- **Split-domain Application:** Next.js 15 (App Router) monorepo serving two distinct user experiences:
  - **Main Storefront (`CUSTOMER`):** Customer-facing Shop, Services, Account, and B2B portal.
  - **Admin Portal (`STAFF/ADMIN`):** Hardened internal control centre with restricted access, hosted on a separate `admin.*` subdomain.
- **Backend:** Next.js API Routes (running on Railway) with split authentication middleware for customers and staff.
- **Database:** PostgreSQL via Prisma ORM (Neon in production; Railway Redis for rate-limiting).
- **Automation:** Comprehensive n8n infrastructure for marketing, security, and AI-powered operations (34 modular workflows + Centralized Error Handler).
- **Deployment:** Multi-service Railway architecture: `web`, `n8n`, and `ffmpeg-service`.
- **Templates:** Unified Database-Driven Template Management for Email, WhatsApp, and PDF with full-page editor.

### High-Level Architecture Diagram

```mermaid
flowchart TB
  subgraph Client
    Browser[Web Browser]
  end

  subgraph "Next.js App (Railway)"
    AppRouter[App Router / Pages]
    APIRoutes[API Routes]
    Middleware[Middleware]
  end

  subgraph "Automation (n8n on Railway)"
    Workflows[n8n Workflows]
    FFmpeg[FFmpeg Service]
  end

  subgraph "AI Services"
    OpenAI[OpenAI - GPT-4o Vision]
    Claude[Anthropic - Claude 3.5]
  end

  subgraph "Core Libraries (lib/)"
    Auth[NextAuth]
    PrismaLib[Prisma Client]
    Email[Resend Email]
    n8nLib[n8n Trigger Lib]
    S3R2[R2 / S3]
    Mpesa[M-Pesa]
    Marketing[Marketing Utils / CAPI]
  end

  subgraph External
    DB[(PostgreSQL - Neon)]
    R2[Cloudflare R2]
    Resend[Resend]
    Klaviyo[Klaviyo Email]
    WhatsApp[WhatsApp Cloud API]
    SMS[Africa's Talking]
    Meta[Meta Pixel / CAPI]
  end

  Browser --> Middleware --> AppRouter
  Browser --> Middleware --> APIRoutes
  AppRouter --> PrismaLib
  APIRoutes --> Auth
  APIRoutes --> PrismaLib
  APIRoutes --> n8nLib
  n8nLib --> Workflows
  Workflows --> Email
  Workflows --> WhatsApp
  Workflows --> Klaviyo
  Workflows --> FFmpeg
  Workflows --> OpenAI
  Workflows --> Claude
  PrismaLib --> DB
  Auth --> DB
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router), React 18 |
| **Language** | TypeScript |
| **Date Formatting** | date-fns (relative timing, dashboard polish) |
| **Styling** | Tailwind CSS, shadcn/ui (Radix), tailwindcss-animate |
| **State** | Zustand (cart, checkout) |
| **Backend** | Next.js API Routes (Railway) |
| **ORM / DB** | Prisma 7, PostgreSQL (Neon) |
| **Auth** | NextAuth.js 4 (**Split Strategy**: `auth-customer.ts` + `auth-admin.ts`) |
| **Security** | Upstash Redis (Rate-limiting), Geographic IP Detection, Impossible Travel Checks |
| **Payments** | M-Pesa (Daraja), Pesapal, Flutterwave, Stripe |
| **File storage** | Cloudflare R2 (S3-compatible); fallback AWS S3 |
| **Email** | Resend |
| **SMS** | Africa's Talking (2FA, notifications) |
| **PDF** | @react-pdf/renderer (invoices, quote PDFs) |
| **AI / ML** | OpenAI (GPT-4o Vision), Anthropic (Claude 3.5), Gemini (Flash), StabilityAI (Mockups), ElevenLabs (Vocal) |
| **Multimedia** | FFmpeg (Sidecar service for n8n; audio/video automation) |
| **Search** | Algolia (Optional) |
| **Monitoring** | Sentry (Full-stack), Railway Metrics |
| **Automation** | **n8n** (Self-hosted on Railway - 34 production-ready workflows) |
| **Marketing** | Klaviyo (Email), WhatsApp Cloud API, Meta/TikTok CAPI |
| **Inventory** | Handled in-database with ERPNext sync scripts |
| **External ERP** | ERPNext (Optional/Docker; finance, inventory) |

---

## 3. Directory Structure

```
Printhub_Africa_ProdV1/
├── app/
│   ├── (public)/           # Customer-facing routes
│   │   ├── page.tsx        # Home
│   │   ├── shop/           # Shop, product [slug]
│   │   ├── services/       # Large-format, 3D printing, get-a-quote
│   │   ├── cart/           # Cart
│   │   ├── checkout/       # Checkout
│   │   ├── order-confirmation/[orderId]/
│   │   ├── pay/[orderId]   # Payment retry / payment link
│   │   ├── account/        # Profile, orders, quotes, support, settings, corporate
│   │   ├── quote/          # Quote forms (3d-print, etc.)
│   │   ├── get-a-quote/
│   │   ├── catalogue/      # POD catalogue
│   │   ├── corporate/      # Corporate apply, status
│   │   ├── careers/        # Job listings, apply
│   │   ├── contact/, faq/, about/
│   │   ├── upload/
│   │   └── [legalSlug]     # Legal pages
│   ├── (auth)/             # Auth routes
│   │   ├── login/          # Login, magic, verify, success
│   │   ├── register/
│   │   ├── forgot-password/, reset-password/
│   │   └── verify-email/
│   ├── (admin)/            # Admin dashboard
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── orders/, quotes/, deliveries/, production-queue/, refunds/
│   │       ├── products/, categories/, reviews/
│   │       ├── customers/
│   │       ├── finance/, invoices/
│   │       ├── inventory/         # Stock, substrates, materials, consumables
│   │       ├── inventory/hardware # Printers assets, maintenance
│   │       ├── catalogue/, coupons/
│   │       ├── staff/, departments/, corporate-accounts/, corporate/applications/
│   │       ├── careers/, support/, uploads/
│   │       ├── content/legal/, content/templates/
│   │       ├── settings/   # Business, payments, shipping, SEO, notifications, audit, users, danger
│   │       ├── reports/, sales/calculator/
│   │       ├── hardware/   # Hardware catalog, bundles, suppliers, warranties
│   │       └── access-denied/, accept-invite/
│   └── api/                # All API routes (see §5)
├── components/
│   ├── ui/                 # shadcn components
│   ├── layout/             # Header, Footer
│   ├── shop/, account/, admin/, services/, upload/, marketing/
│   ├── marketing/          # PixelTracker, ViewContentTracker
│   └── ...
├── lib/                    # Core services and utilities
│   ├── prisma.ts
│   ├── auth-customer.ts, auth-admin.ts # Split auth strategy
│   ├── geo-detection.ts, impossible-travel.ts # Security layers
│   ├── rate-limit.ts, rate-limit-wrapper.ts
│   ├── email.ts, sms.ts
│   ├── s3.ts, r2.ts
│   ├── n8n.ts, n8n-verify.ts   # n8n Integration & Security
│   ├── mpesa.ts, pesapal.ts, stripe/
│   ├── cart-calculations.ts, order-utils.ts, tracking.ts, production-queue.ts
│   ├── marketing/          # event-tracker.ts (client), conversions-api.ts (CAPI), klaviyo.ts, whatsapp.ts
│   ├── cache/              # unstable-cache (business metadata)
│   ├── admin-permissions.ts, admin-api-guard.ts, admin-route-guard.ts, admin-utils.ts
│   ├── twofa-token.ts, audit.ts, constants.ts, db-guard.ts, role-permissions.ts
│   ├── invoice-pdf.ts, quote-pdf.ts, virustotal.ts, backup-utils.ts
│   └── business-public.ts
├── hooks/                  # e.g. useLFRates
├── store/                  # Zustand: checkout-store, cart
├── n8n/                    # Automation infrastructure
│   ├── workflows/          # Domain-driven individual workflow JSON files
│   │   ├── auth-security/
│   │   ├── catalog-inventory/
│   │   ├── commerce-sales/
│   │   ├── customer-support/
│   │   ├── intelligence-reports/
│   │   ├── marketing-content/
│   │   └── notifications/
│   ├── ffmpeg-service/     # Sidecar for media processing
│   ├── railway.toml        # n8n-specific deployment config
│   └── .env.example
├── prisma/
│   ├── schema.prisma       # Full DB schema
│   ├── seed.ts, seeds/
│   ├── migrations/
│   └── scripts/
├── scripts/                # erpnext-*, convert-to-webp, backfill, etc.
├── public/
├── middleware.ts           # Auth, CSRF-style origin check, route protection
├── instrumentation.ts     # Sentry
├── package.json
├── .env.example, .env.local.example
└── docker-compose*.yml     # db, erpnext
```

---

## 4. Data Model & Entity Relationships

The data model is defined in `prisma/schema.prisma`. Below is a structured summary by domain and key relationships.

### 4.1 Entity Relationship Overview (Mermaid)

```mermaid
erDiagram
  User ||--o{ Order : places
  User ||--o{ Address : has
  User ||--o{ Quote : requests
  User ||--o| Staff : "is"
  User ||--o| CorporateTeamMember : "is"
  User ||--o| CorporateAccount : "primaryContact"

  Category ||--o{ Product : contains
  Product ||--o{ ProductVariant : has
  Product ||--o{ ProductImage : has
  Product ||--o{ OrderItem : "ordered as"
  Product ||--o{ ProductReview : has

  Order ||--o{ OrderItem : contains
  Order ||--o| ShippingAddress : has
  Order ||--o{ Payment : has
  Order ||--o{ OrderTimeline : has
  Order ||--o{ OrderTrackingEvent : has
  Order ||--o| Delivery : has
  Order ||--o{ Refund : has
  Order ||--o| Invoice : has
  Order ||--o| Cancellation : has
  Order }o--o| CorporateAccount : "corporate"
  Order }o--o| CorporatePO : "po"

  Payment ||--o| MpesaTransaction : "mpesa"
  Payment ||--o{ Invoice : generates

  Quote ||--o{ UploadedFile : "files"
  Quote ||--o{ QuotePdf : "pdfs"
  Quote }o--o| User : "customer"
  Quote }o--o| User : "assignedStaff"

  CorporateAccount ||--o{ CorporateTeamMember : has
  CorporateAccount ||--o{ CorporatePO : has
  CorporateAccount ||--o{ CorporateInvoice : has
  CorporateAccount ||--o{ CorporateApplication : "application"

  OrderItem ||--o{ ProductionQueue : "queue"
  ProductionQueue }o--o| Machine : "machine"

  Cart }o--o| User : "user"
  Wishlist }o--o| User : "user"
  Wishlist }o--o| Product : "product"

  Product ||--o| CatalogueImportQueue : "import metadata"
  Product ||--o{ AdCopyVariation : "ai copy"
  Product }o--o{ ThreeDConsumable : "materials"
  CatalogueItem ||--o{ CatalogueImportQueue : "source"

  HardwareProduct ||--o{ HardwareVariant : has
  HardwareProduct }o--|| HardwareCategory : in
  HardwareProduct }o--|| Supplier : "supplied by"
  HardwareProduct ||--o{ HardwareBundleItem : "part of"
  HardwareProduct ||--o{ WarrantyRecord : "covered by"
  HardwareBundle ||--o{ HardwareBundleItem : contains
```

### 4.2 Users & Auth

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **User** | Core user: customer, staff, admin. Fields: name, **displayName**, email, **phone**, passwordHash, **role** (CUSTOMER, STAFF, ADMIN, SUPER_ADMIN), 2FA, **loyaltyPoints**, **smsMarketingOptIn**, **marketingConsent**, **isAnonymised**. | → Account[], Session[], Address[], Order[], Quote[], Staff?, CorporateAccount? (primary contact), CorporateTeamMember[], SupportTicket[], AuditLog[], SavedAddress[], SavedMpesaNumber[], SavedCard[], LoyaltyAccount?, UserPermission[] |
| **Account** | OAuth/linked accounts (NextAuth). | → User |
| **Session** | NextAuth customer session. | → User |
| **AdminSession** | Hardened staff session with IP, UserAgent, and **Geo-location** (City/Country) tracking. | → User |
| **KnownAdminDevice** | Trusted device fingerprints for multi-factor admin security. | → User |
| **VerificationToken** | Email verification / magic link tokens. | — |
| **Address** | User address (label, street, city, county, etc.). | → User |

### 4.3 Products & Catalog

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Category** | Tree (parentId), slug, sortOrder, isActive. | → Category[] (children), Product[] |
| **Product** | name, slug, categoryId, **productType**, basePrice, comparePrice, costPrice, sku, stock, images, **27 Social Platform Export Flags** (Google, Meta, TikTok, LinkedIn, Pinterest, X, Snapchat, Youtube, etc.), **AI Content Flags** (aiDescriptionGenerated, aiGeneratedAt). | → Category, ProductVariant[], ProductImage[], ProductReview[], OrderItem[], Wishlist[], Inventory[], CatalogueImportQueue?, AdCopyVariation[], ProductMockup[], ProductVideo[] |
| **ProductVariant** | name, sku, price, stock, attributes (JSON). | → Product, OrderItem[], Inventory[] |
| **ProductImage** | url, storageKey, altText, sortOrder, isPrimary. | → Product |
| **ProductMockup** | AI-generated lifestyle images (DALL-E 3 / Stability AI). | → Product |
| **ProductVideo** | AI-generated marketing videos for social platforms. | → Product |
| **ProductReview** | rating, title, body, isVerified, isApproved. | → Product, User |
| **Wishlist** | User–Product link. | → User, Product |

### 4.4 3D & Large-Format Pricing (Calculator & Cost Engine)

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **PrintMaterial** | 3D: type (PLA, ABS, PETG, RESIN, etc.), pricePerGram, density, leadTimeDays. | — |
| **PrintFinish** | 3D finish price modifier. | — |
| **PrintingMedium** | Large-format: name, pricePerSqMeter, min/max width/height. | — |
| **LaminationType** | Large-format lamination (pricePerSqm). | — |
| **LargeFormatFinishing** | Add-ons per unit (eyelets, hem, etc.). | — |
| **DesignServiceOption** | Design/artwork flat fee. | — |
| **TurnaroundOption** | Rush surcharge % (STD, EXPRESS_1, etc.). | — |
| **LFPrinterSettings** | Printer: speed, depreciation, electricity, ink (cost engine). | — |
| **LFBusinessSettings** | Labour, overhead, waste, profit, VAT (singleton). | — |
| **LFStockItem** | Substrates, lamination, finishing (cost flows to calculator). | → MaintenancePartUsed[] |
| **MachineType** | 3D hourly rate. | — |
| **ThreeDAddon** | 3D post-processing (support removal, finishing). | — |
| **PricingConfig** | Key/value JSON (e.g. vatRate, minOrder). | — |

### 4.5 Orders & Fulfilment

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Order** | orderNumber, userId?, **status** (PENDING→DELIVERED/CANCELLED/REFUNDED), **type** (SHOP, LARGE_FORMAT, THREE_D_PRINT, QUOTE, POD, CUSTOM_PRINT), totals, paymentMethod, paymentStatus, pickupCode, corporateId?, corporatePOId?, isNetTerms, paymentLinkToken, etc. | → User?, OrderItem[], ShippingAddress?, Delivery?, Payment[], Refund[], Invoice[], OrderTimeline[], OrderTrackingEvent[], Cancellation?, PickupLocation?, Courier?, DeliveryZone?, CorporateAccount?, CorporatePO?, CorporateInvoice? |
| **OrderItem** | productId?, variantId?, quantity, unitPrice, customizations, uploadedFileId?, instructions, **itemType** (PRINT_SERVICE, PRODUCT), **isDeposit**, **addInstallation**. | → Order, Product?, ProductVariant?, ProductionQueue[] |
| **OrderTimeline** | status, message, updatedBy. | → Order |
| **OrderTrackingEvent** | status, title, description, isPublic, location, courierRef. | → Order |
| **ShippingAddress** | 1:1 per order (fullName, email, phone, street, city, county, deliveryMethod). | → Order |
| **Delivery** | 1:1 per order when shipping: method (STANDARD/EXPRESS), status, assignedCourier, trackingNumber, proofPhotoKey. | → Order, DeliveryZone?, Courier? |
| **Refund** | amount, reason, status; M-Pesa B2C fields. | → Order |
| **Cancellation** | reason, cancelledBy. | → Order |
| **AdCopyVariation** | AI-generated marketing copy (Hook, Body, CTA) for specific platforms. | → Product |

### 4.6 Payments

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Payment** | provider (MPESA, PESAPAL, FLUTTERWAVE, STRIPE, etc.), amount, status, M-Pesa/card/manual/pickup fields. | → Order, MpesaTransaction?, Invoice[] |
| **MpesaTransaction** | STK/callback: phoneNumber, checkoutRequestId, resultCode, resultDesc, mpesaReceiptNumber. | → Payment |
| **Invoice** | orderId, paymentId?, invoiceNumber, pdfKey/pdfUrl, vatAmount, totalAmount, sentAt. | → Order, Payment? |
| **Counter** | Sequences (e.g. invoice, quote_pdf). | — |
| **SavedMpesaNumber** | User’s saved M-Pesa numbers. | → User |
| **SavedCard** | User’s saved card (Pesapal token, last4, brand). | → User |

### 4.7 Quotes (Unified “Get a Quote”)

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Quote** | quoteNumber, **type** (large_format, three_d_print, design_and_print), status (new→completed/cancelled), customerId?, assignedStaffId?, specifications (JSON), quotedAmount, quotePdfUrl, closedBy. | → User? (customer), User? (assignedStaff), UploadedFile[], QuoteCancellation[], QuotePdf[] |
| **QuoteCancellation** | Reason, cancelled by. | → Quote |
| **QuotePdf** | R2 key for generated PDF. | → Quote |

### 4.8 Uploads & Print Quotes

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **UploadedFile** | userId?, quoteId?, orderId?, storageKey, bucket, **uploadContext** (CUSTOMER_3D_PRINT, CUSTOMER_QUOTE, ADMIN_CATALOGUE_STL, ADMIN_CATALOGUE_PHOTO, ADMIN_PRODUCT_IMAGE, etc.), fileType, status (UPLOADED→APPROVED/REJECTED), virusScanStatus. | → User?, Quote?, Order? (via OrderItem) |
| **PrintQuote** | Legacy 3D/large-format quote (links to uploads). | → User |

### 4.9 Corporate (B2B)

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **CorporateAccount** | primaryUserId, companyName, kraPin, paymentTerms, creditLimit, status, tier. | → User (primary), CorporateTeamMember[], CorporatePO[], CorporateInvoice[], CorporateApplication[], CorporateBrandAsset[], CorporateNote[], CorporateInvite[], BulkQuote[] |
| **CorporateTeamMember** | userId, corporateId, **role** (OWNER, ADMIN, FINANCE, MEMBER), canPlaceOrders, canViewInvoices, canManageTeam. | → User, CorporateAccount |
| **CorporatePO** | PO reference, approval state. | → CorporateAccount, Order[] |
| **CorporateInvoice** | Billing for corporate orders. | → CorporateAccount, Order[] |
| **CorporateApplication** | Company details, contact (pre-approval). | → User, CorporateAccount? |
| **CorporateBrandAsset**, **CorporateNote**, **CorporateInvite**, **BulkQuote** | Supporting B2B data. | → CorporateAccount |

### 4.10 Inventory & Production

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Inventory** | product/variant, quantity, location. | → Product?, ProductVariant? |
| **ShopInventoryMovement** | Stock movements (shop). | → Product? |
| **ShopPurchaseOrder**, **ShopPurchaseOrderLine** | Purchase orders for shop stock. | → Product |
| **ProductionQueue** | orderItemId, status, assignedTo, machineId. | → OrderItem, Machine? |
| **Machine** | Machine used in production (links to PrinterAsset or logical). | → ProductionQueue[] |
| **PrinterAsset** | Physical printer: lifecycle (ACTIVE, IN_MAINTENANCE), maintenance. | → MaintenanceLog[], LFPrinterSettings? |
| **MaintenanceLog**, **MaintenancePartUsed** | Maintenance events and parts. | → PrinterAsset, LFStockItem? |
| **ThreeDConsumable**, **ThreeDConsumableMovement** | 3D consumables and movements. | → User? (performedBy) |
| **InventoryHardwareItem** | Hardware/maintenance/accessories for calculator. | — |

### 4.11 Staff & Admin

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Department** | Department name/code. | → Staff[] |
| **Staff** | userId, departmentId, permissions[], showOnAboutPage. | → User, Department, UserPermission[] |
| **UserPermission** | Granular per-user permission (e.g. orders_view, finance_edit). | → User |
| **AuditLog** | userId, action, entity, entityId, before/after JSON. | → User |

### 4.12 Settings (Singleton / Config)

| Model | Description |
|-------|-------------|
| **BusinessSettings** | Company info, paybill/till, Stripe enabled, etc. |
| **SeoSettings** | Default meta, OG. |
| **ShippingSettings** | Default delivery options. |
| **LoyaltySettings**, **ReferralSettings**, **DiscountSettings** | Loyalty, referral, discounts. |
| **SystemSettings** | App-wide flags/settings. |

### 4.13 Other Domains

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Cart** | userId?/sessionId, items (JSON), abandoned-cart recovery timestamps. | — |
| **Coupon**, **CouponUsage** | Discount codes. | → User |
| **Notification**, **UserNotificationPrefs** | In-app notifications and preferences. | → User |
| **SupportTicket**, **TicketMessage** | Customer support. | → User |
| **FaqCategory**, **Faq** | FAQ. | — |
| **BlogPost** | AI-generated SEO articles with Medium/LinkedIn sync. | — |
| **SmsBroadcast** | Bulk marketing SMS campaigns with product tracking. | — |
| **CatalogueImportQueue** | Metadata for AI-based catalogue ingestion (source URL, AI analysis status, recommended categories). | → Product?, CatalogueItem? |
| **ExternalModel** | Reference to external 3D models (Printables/Thingiverse) used for POD. | → Product?, Category? |
| **JobListing**, **JobApplication** | Careers. | JobListing → JobApplication[] |
| **DeliveryZone**, **Courier**, **PickupLocation** | Logistics. | → Order, Delivery |
| **LoyaltyAccount**, **LoyaltyTransaction**, **ReferralCode** | Loyalty and referrals. | → User |
| **SavedAddress** | User’s saved checkout addresses. | → User |

### 4.14 Templates (Unified Communication)

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **EmailTemplate** | subject, bodyHtml, status (DRAFT/PUBLISHED). | — |
| **WhatsAppTemplate** | category, bodyText (WhatsApp Cloud API format). | — |
| **PdfTemplate** | bodyHtml (HTML-to-PDF pipeline). | — |

### 4.15 Hardware & Equipment

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **HardwareProduct** | name, SKU, price, stock, specs, warranty terms. | → Category, Supplier, Variant[], BundleItem[], Warranty[] |
| **HardwareCategory** | Hierarchy for equipment (Printers, Scanners, etc.). | → HardwareProduct[] |
| **HardwareBundle** | Multi-product equipment packages (e.g., Starter Kit). | → BundleItem[] |
| **Supplier** | Machine vendors and manufacturers (country, contact, lead time). | → HardwareProduct[] |
| **WarrantyRecord** | Individual unit coverage linked to serial number/order. | → HardwareProduct, User |

### 4.16 Monitoring & Logging

| Model | Description |
|-------|-------------|
| **MarketingErrorLog** | Centralized log for n8n/webhook failures (channel, error, payload). |
| **AiServiceLog** | Tracks AI usage, tokens, and costs (service, model, tokens). |

---

## 5. API Layer

All API routes live under `app/api/`. Protection is enforced by **middleware** and/or **getServerSession** / **requireAdminApi** in handlers.

### 5.1 Route Groups (by prefix)

| Prefix | Purpose | Auth |
|--------|---------|------|
| **/api/auth/customer/** | CUSTOMER login, register, OAuth, magic link, verify-email. Uses `printhub.customer.session`. | Public / Session |
| **/api/auth/admin/** | STAFF/ADMIN login, 2FA, 2FA-verify. Uses `printhub.admin.session`. No OAuth. | Public / Admin Session |
| **/api/n8n/** | **Inbound Automation**: Save AdCopy, update descriptions, upload mockups, save video, log audit events, etc. | HMAC Signature required |
| **/api/account/** | profile, settings, addresses, payment-methods, loyalty, support, corporate, refunds | Customer Session |
| **/api/user/** | complete-profile, verify-email (demo/resend) | Customer Session |
| **/api/checkout/** | cart, payment-methods | Optional session |
| **/api/orders/** | create, list, status, invoice | Session/Access |
| **/api/payments/** | mpesa, pesapal, flutterwave, stripe (STK, callbacks, IPNs) | Mixed (Callbacks: public+verify) |
| **/api/admin/** | Full admin: orders, quotes, production, products, finance, inventory, staff, settings | Admin Session + Permissions |
| **/api/admin/email-templates** | Unified CRUD for system templates | Admin Session |
| **/api/admin/hardware** | Lifecycle for equipment catalog | Admin Session |
| **/api/quotes/** | GET/POST quotes, upload, [id] GET/PATCH, PDF | Session/Access |
| **/api/upload/** | presign, confirm, download | Session / Context |
| **/api/branding/favicon** | Dynamic favicon with database caching | Public |
| **/api/shipping/** | fee, pickup-locations, courier-locations | Public |
| **/api/calculator/** | rates (large-format, 3d-print) | Public |
| **/api/catalogue/** | list, categories, featured, [slug] | Public |
| **/api/corporate/** | apply, application/status, account/checkout | apply public; rest session + corporate |
| **/api/careers/** | list, [slug] GET, [slug]/apply POST | Public |
| **/api/contact** | POST (SupportTicket + email) | Public |
| **/api/faq**, **/api/settings/business-public** | Public | Public |
| **/api/coupons/validate** | Validate coupon code | Session / checkout |
| **/api/cron/abandoned-carts** | Abandoned cart emails | CRON_SECRET |
| **/api/health**, **/api/feeds/products** | Health, legacy feeds | Public |
| **/api/products/feed** | Universal JSON product feed for Meta/Pinterest | Public |
| **/api/products/google** | Google Product Feed (XML/RSS) | Public |
| **/api/products/tiktok** | TikTok Catalog Feed (JSON/CSV) | Public |
| **/api/products/[slug]/reviews** | Product reviews | Public |
| **/api/unsubscribe/abandoned-cart** | Opt-out | Public |

### 5.2 Order Creation Flow (API)

- **Customer:** `POST /api/orders` with cart, shipping, delivery method, coupon → creates Order (PENDING), OrderItems, ShippingAddress, optional Delivery; payment then via M-Pesa STK, Pesapal/Flutterwave/Stripe, or manual/pickup.
- **Admin:** `POST /api/admin/orders/create` for manual/phone orders.

---

## 6. Authentication & Authorization

### 6.1 Split-Authentication Strategy

The system uses two isolated NextAuth configurations to decouple customer and administrative access:

1.  **Customer Auth (`lib/auth-customer.ts`):**
    *   **Purpose:** Storefront, account management, and B2B portal.
    *   **Providers:** Credentials, Google, Facebook, Apple, and Email Magic Links.
    *   *CSRF Domain:* Restricted to the main application domain (`printhub.africa`).
    *   *Cookie:* `printhub.customer.session`.

2.  **Admin Auth (`lib/auth-admin.ts`):**
    *   **Purpose:** Hardened administrative access via `admin.printhub.africa` subdomain.
    *   **Providers:** Credentials only (no social login allowed for staff).
    *   *Security Features:* 2FA enforcement, device fingerprinting, and session logging in the `AdminSession` table.
    *   *Session Persistence:* **JWT maxAge set to 8 hours** (improving over the default 30 days).
    *   *Validation:* Hardened via `middleware.ts` which performs real-time database validation of the `AdminSession` record on every request.
    *   *Cookie:* `printhub.admin.session` (HttpOnly, Secure, SameSite=Strict).

### 6.2 Security Infrastructure

*   **Subdomain Isolation:** `middleware.ts` enforces that administrative routes are only accessible via the `admin.*` subdomain. Unauthorized access from the main domain results in a 404 or redirect.
*   **Geographic Security (`lib/geo-detection.ts`):** Every admin login attempt is cross-referenced with `ip-api.com` to capture City and Country.
*   **Impossible Travel (`lib/impossible-travel.ts`):** Logic to detect logins from geographically distant locations within an impossible timeframe. Triggers automatic session revocation and `SUPER_ADMIN` alerts via n8n.
*   **Rate Limiting (`lib/rate-limit.ts`):** Enforced via Upstash Redis. Keyed by IP and Action (e.g., login, refunds, bulk updates).
*   **HMAC Webhook Verification:** All inbound requests from n8n are verified using `lib/n8n-verify.ts`, checking an HMAC-SHA256 signature against the request body and a 5-minute timestamp window.

### 6.3 Authorization (Roles & Permissions)

*   **Roles:** `CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`.
*   **Granular Permissions:** `STAFF` users are assigned specific `PermissionKey`s (e.g., `orders_edit`, `finance_view`). These are checked via `requireAdminApi` and `requireAdminSection`.
*   **Session Expansion:** JWTs include `permissions`, `isCorporate`, `corporateId`, and `emailVerified` status to minimize database hits during route resolution.
*   **Bypass Logic:** `STAFF` and above bypass certain customer-facing restrictions (like email verification gates) for internal efficiency.

- **CSRF-style:** Mutation requests (POST/PUT/PATCH/DELETE) to `/api/*` check `Origin` against allowed origins (request host, NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, localhost).
- **Cron:** `/api/cron/*` secured with CRON_SECRET.
- **Uploads:** Presign/confirm flow; optional VirusTotal scan; UploadedFile status (virus scan, review).

---

## 7. Business Flows

### 7.1 User Onboarding & Verification
1. **Signup:** User registers via `/api/auth/register` (Credentials) or OAuth (Google/Facebook/Apple).
2. **Email Verification:**
   - `CUSTOMER` role users are greeted by a persistent `EmailVerificationBanner`.
   - Backend restricts certain actions (like profile editing) until `emailVerified` is set in the DB.
   - Users can trigger a demo verification via `/api/user/verify-email/demo` or a real resend via `/api/user/verify-email/resend`.
   - `STAFF`/`ADMIN` roles bypass this process for internal efficiency.
3. **Profile Completion:**
   - Users missing `name` or `phone` (common in OAuth flows) are intercepted by the `ProfileCompletionGate` modal.
   - Data is POSTed to `/api/user/complete-profile` and synchronized with the session via an explicit `update()`.

### 7.2 Order Flow (Shop / Custom Print)

1. **Cart:** PATCH `/api/checkout/cart`; cart in DB (Cart) or client (Zustand).
2. **Checkout:** Customer enters shipping, delivery method (Standard/Express/Pickup), coupon. **POST /api/orders** creates Order (PENDING), OrderItems, ShippingAddress, optional Delivery; `createTrackingEvent(orderId, "PENDING")`.
3. **Payment** (one of):
   - **M-Pesa STK:** POST `/api/payments/mpesa/stkpush` → Daraja STK; callback POST `/api/payments/mpesa/callback` updates Payment and Order (paymentStatus CONFIRMED, status CONFIRMED, paidAt).
   - **Pesapal/Flutterwave:** Initiate → redirect → return to order-confirmation; IPN/callback updates payment/order.
   - **Stripe:** create-intent → client confirms → webhook or callback to confirm order.
   - **Manual:** Customer pays Paybill/Till; POST `/api/payments/manual`; admin can confirm-payment.
   - **Pay on pickup:** POST `/api/payments/pickup` (pickup code, confirm).
4. **Recovery:** Payment link (admin) or `/pay/[orderId]` for retry (e.g. resend STK).
5. **Fulfilment:** Order status → PROCESSING, PRINTING, READY_FOR_COLLECTION, SHIPPED, DELIVERED; ProductionQueue for items; Delivery for shipping; OrderTrackingEvent and optional email (lib/tracking).
6. **Marketing Triggers:** On `CONFIRMED` status, system triggers Klaviyo "Placed Order", Meta CAPI "Purchase", TikTok Events API, and WhatsApp confirmation. On `SHIPPED`, triggers WhatsApp update.

### 7.3 Quote Flow (Unified)

1. **Submit:** POST `/api/quotes` (type, customer info, specifications, reference files) or POST `/api/quote/submit` (contact-style).
2. **Uploads:** POST `/api/quotes/upload` (R2 presign/upload); files linked to quote.
3. **Admin:** Assign staff, set quotedAmount, quoteBreakdown, quotePdfUrl; send PDF; status quoted → accepted/rejected.

### 7.4 Catalogue, POD & AI Enrichment

1. **Import/Scrape:** Admin provides a URL (Printables/Thingiverse). `POST /api/admin/catalogue/import` triggers the **AI-7 Catalogue Import** n8n workflow.
2. **AI Analysis:** n8n uses **GPT-4o Vision** to analyze images and **Claude 3.5** to parse specifications, generating a structured `CatalogueImportQueue` entry.
3. **Review:** Admin reviews the AI-generated name, description, and suggested categories in the Admin Portal.
4. **Approval:** `/api/admin/import/[id]/approve` creates a `Product` and triggers **AI-3 Ad Copy Generation** for all **27 Social Platforms**.
5. **STL Management:** `/api/admin/catalogue/[id]/stl` handles manual upload/replacement of 3D model files for approved items.

### 7.5 Production & Inventory

- **ProductionQueue:** Order items queued; status (Queued, In Progress, Printing, Quality Check, Done); assignedTo, machineId.
- **PrinterAsset:** Maintenance logs, parts (MaintenancePartUsed), lifecycle.
- **3D:** ThreeDConsumable movements; calculator uses materials, machine types, addons.
- **Large-format:** LFPrinterSettings, LFBusinessSettings, LFStockItem; calculator uses mediums, lamination, finishing, design options, turnaround.

### 7.6 Refunds & Cancellations

- Admin creates Refund; **process-b2c** for M-Pesa B2C (lib/mpesa-b2c); callback `/api/payments/mpesa/b2c-callback`. Order paymentStatus REFUNDED; status REFUNDED where applicable.

### 7.7 Corporate (B2B)

- **Apply:** POST `/api/corporate/apply` → CorporateApplication; admin approve/reject.
- **On approval:** CorporateAccount + CorporateTeamMember (OWNER); invite flow for team.
- **Checkout:** GET `/api/account/corporate/checkout`; orders can attach corporateId, poReference, corporatePOId, isNetTerms; CorporateInvoice for billing.

### 7.8 Marketing Automation & CAPI (100% Attribution)

1. **Client Events:** `PixelTracker.tsx` tracks `ViewContent`, `AddToCart`, and `InitiateCheckout` on the browser.
2. **Server Events (CAPI):** On successful payment (`CONFIRMED` status), `lib/marketing/conversions-api.ts` sends a server-side event to Meta and TikTok including hashed user data.
3. **Lifecycle Automation (n8n):**
    *   **WhatsApp (3h):** Abandoned cart recovery if checkout not completed.
    *   **WhatsApp (Post-Purchase):** Order confirmation and shipping updates.
    *   **Klaviyo:** Automated email flows for welcome, browse abandonment, and win-back.
    *   **Social Sync:** Bulk export of product feeds to 27 platforms (Google, Meta, TikTok, etc.).

### 7.9 Security Monitoring & Auditing

1. **Geo-Verification:** Every staff login triggers `lib/geo-detection.ts`.
2. **Impossible Travel:** `lib/impossible-travel.ts` checks the distance from the last known `AdminSession`.
3. **Response:** If suspicious, system revokes other sessions and triggers an n8n **Security Alert** to `SUPER_ADMIN`.
4. **Audit Logging:** Every administrative mutation is recorded in `AuditLog` with `before/after` snapshots.

### 7.10 Abandoned Cart (Next.js Cron)

- **Cron:** GET `/api/cron/abandoned-carts` (CRON_SECRET) → finds carts, sends recovery email (Resend); recoveryEmailSent1At / recoveryEmailSent2At; `/api/unsubscribe/abandoned-cart` for opt-out.
- **n8n Fallback:** The **Abandoned Cart Detector** cron in n8n serves as a secondary recovery layer via WhatsApp.

### 7.11 Unified Template Management

1. **System Templates:** Admin manages `EmailTemplate`, `WhatsAppTemplate`, and `PdfTemplate` in the Admin Portal.
2. **Editor:** Full-page editor for HTML/Text content with dynamic variable mapping (e.g., `{{orderNumber}}`).
3. **Draft/Publish:** Templates start as `DRAFT` and are published for use by n8n or the core app.
4. **WhatsApp Approval:** Integrated workflow for submitting templates for Meta review (via n8n).

### 7.12 Hardware & Equipment Lifecycle

1. **Inventory Management:** Full lifecycle tracking for high-value equipment (HardwareProducts) from receipt to sale.
2. **Variants & Bundles:** Equipment can be sold as single units or bundled sets with associated discounts.
3. **Suppliers:** Integrated supplier database managing lead times and vendor contact details.
4. **Warranties:** Digital warranty records created upon sale, including serial number tracking and claim history.

### 7.13 Centralized Automation Monitoring (N8N)

1. **Global Error Handler:** Every n8n workflow is linked to a `Global Error Handler` workflow.
2. **Alerting:** Failures trigger high-priority WhatsApp/Telegram alerts to `STAFF`/`ADMIN`.
3. **Error Logging:** Failures are recorded in `MarketingErrorLog` with full payload for debugging.
4. **AI Usage Logs:** Every AI call (OpenAI, Anthropic, Gemini) is recorded in `AiServiceLog` for cost auditing.

---

## 8. External Integrations

| Service | Purpose | Env / Config | Usage |
|--------|--------|--------------|--------|
| **PostgreSQL** | Primary DB | DATABASE_URL, DIRECT_URL | Prisma; migrations, seed. |
| **Cloudflare R2** | File storage | R2_* (endpoint, keys, buckets, public URL) | lib/r2.ts, lib/s3.ts; presign/confirm; quote files, product/catalogue images, invoices. |
| **Upstash Redis** | Rate limiting / Caching | UPSTASH_REDIS_* | lib/rate-limit.ts; API protection. |
| **Resend** | Email | RESEND_API_KEY, FROM_EMAIL, FROM_NAME | lib/email.ts: verification, password reset, 2FA, order/quote/ticket/refund/cancel, abandoned cart, invoice. |
| **Africa's Talking** | SMS | AT_* | lib/sms.ts: 2FA SMS, test SMS. |
| **M-Pesa (Daraja)** | STK push, B2C refunds | MPESA_* | lib/mpesa.ts; /api/payments/mpesa/*. |
| **Pesapal** | Card/redirect | PESAPAL_* | lib/pesapal.ts; /api/payments/pesapal/*. |
| **Flutterwave** | Card/redirect | FLUTTERWAVE_* | /api/payments/flutterwave/initiate. |
| **Stripe** | Cards, Apple/Google Pay | STRIPE_* | /api/payments/stripe/create-intent. |
| **OpenAI** | AI Vision / GPT-4o | OPENAI_API_KEY | n8n: Catalogue Vision (GPT-4o). |
| **Anthropic** | AI Parsing / Claude | ANTHROPIC_API_KEY | n8n: Specification Parsing (Claude 3.5). |
| **Gemini** | Fast AI Analysis | GEMINI_API_KEY | n8n: Fast sentiment & summaries. |
| **StabilityAI** | Image Generation | STABILITY_API_KEY | n8n: Product mockup generation. |
| **ElevenLabs** | Voice Synthesis | ELEVENLABS_API_KEY | n8n: Voice notes for WhatsApp auto-reply. |
| **Meta / TikTok** | Advertising & Tracking (CAPI) | META_*, TIKTOK_* | conversions-api.ts, TikTok Events API. |
| **WhatsApp** | Order Updates & Marketing | WHATSAPP_* | Cloud API messaging via n8n. |
| **FFmpeg** | Media Processing Sidecar | — | Express service for video automation. |
| **Sentry** | Error tracking | SENTRY_* | instrumentation.ts. |
| **Tawk.to** | Live chat | NEXT_PUBLIC_TAWK_* | Optional; component. |
| **VirusTotal** | Upload scanning | VIRUSTOTAL_API_KEY | Optional; post-upload. |
| **ERPNext** | ERP (finance, inventory, HR) | ERPNEXT_* | Docker; scripts erpnext-setup, erpnext-migrate. |
| **Sanity** | CMS (optional) | NEXT_PUBLIC_SANITY_*, SANITY_* | Env only. |
| **Vercel** | Hosting / cron | VERCEL_* | Build, serverless, cron. |

Payment methods exposed at checkout: **GET /api/checkout/payment-methods** (mpesa, pesapal, flutterwave, stripe, applePay, googlePay, paybill/till from BusinessSettings + PricingConfig).

---

## 9. Deployment & Environment

### 9.1 Infrastructure Overview (Railway)

The platform is deployed as a **multi-service project** on Railway to ensure scalability and isolation:

1. **Next.js App (Service: `web`):**
   - Core storefront, admin portal, and backend API.
   - **Subdomain Routing:** Enforced by middleware for `admin.*` isolation.
   - Connected to Neon (PostgreSQL) and Cloudflare R2.
2. **n8n Automation (Service: `n8n`):**
   - Self-hosted n8n instance for all asynchronous and AI-powered workflows.
   - **Isolation:** Uses a dedicated schema/database for n8n internal data to prevent collision with application data.
   - **Workflow Structure:** Workflows are managed as individual, modular JSON files mapped to domain verticals (e.g., `catalog-inventory`, `commerce-sales`), enabling structured deployment and easier version control.
   - **Networking:** Optimized for Railway with stabilized WebSocket/Push backend connections and custom `n8n/railway.toml` for healthchecks and startup.
3. **FFmpeg Sidecar (Service: `ffmpeg-service`):**
   - Express server providing an API for video/image manipulation.
   - Used by n8n workflows for generating social media assets.

### 9.2 Build & Runtime

- **Build:** `npm run build` runs `prisma generate` and `next build`.
- **Migrations:** Managed via `npx prisma migrate deploy` in the `web` service.
- **Env:** See `.env.example` in both the root and `n8n/` directories for required keys.
- **Default admin:** Seeded by `prisma/seed.ts`.
- **Currency:** KES (Kenya Shillings), 16% VAT.

---

## Related Documentation

- **README.md** — Getting started, scripts, and project structure.
- **docs/RAILWAY_SETUP.md** — Detailed instructions for Railway multi-service provisioning.
- **docs/N8N_INTEGRATION_GUIDE.md** — Guide for managing the 34 automation workflows.
- **docs/TEST_ACCOUNTS.md** — Roles and test accounts for staging.
- **docs/R2_CORS.md** — R2 CORS configuration for browser uploads.
- **Automation Folder/SYSTEM_AUDIT.md** — Complete system remediation and audit status.

*End of System Architecture document.*
