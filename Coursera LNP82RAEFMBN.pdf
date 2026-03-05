# 🖨️ PRINTHUB — CURSOR AI MASTER BUILD PROMPT
### Full-Stack Web Platform | printhub.africa | An Ezana Group Company
---

> **READ THIS FIRST:** This is a complete, end-to-end build specification for PrintHub — a Kenya-based large format printing and 3D printing ecommerce platform. Follow every section in order. Do not skip any checklist item. Tick off each item as it is completed. The platform must be production-ready, fully responsive, and deployable.

---

## 📌 PROJECT OVERVIEW

**Business Name:** PrintHub  
**Domain:** printhub.africa  
**Parent Company:** Ezana Group  
**Location:** Nairobi, Kenya  
**Primary Currency:** KES (Kenyan Shilling)  
**Primary Language:** English  
**Business Type:** B2C + B2B printing services + ecommerce  

**Core Services:**
1. Large Format Printing (banners, billboards, signage, vehicle wraps, canvas, flex, etc.)
2. 3D Printing (consumer, industrial, prototyping, custom designs)
3. Online Shop (ready-made 3D printed products for purchase and delivery)
4. Custom File Upload Orders (customers upload their own designs for print/3D)

---

## 🏗️ TECH STACK

```
Frontend:       Next.js 14 (App Router) + TypeScript
Styling:        Tailwind CSS + shadcn/ui
State:          Zustand (global) + React Query (server state)
Backend:        Next.js API Routes + Node.js
Database:       PostgreSQL (via Prisma ORM)
File Storage:   AWS S3 (or Cloudflare R2) — for uploads & assets
Auth:           NextAuth.js (email/password + Google OAuth)
Payments:       M-Pesa (Daraja API), Pesapal, Flutterwave, Stripe
Email:          Resend (transactional) + React Email (templates)
SMS:            Africa's Talking (Kenya SMS notifications)
Search:         Algolia (product search)
Analytics:      Google Analytics 4 + Hotjar
CMS:            Sanity.io (for blog and marketing content)
Deployment:     Vercel (frontend) + Railway or Render (backend services)
Maps:           Google Maps API (delivery zones, store locator)
3D Preview:     Three.js + @react-three/fiber (for 3D file preview)
```

---

## 🎨 BRAND & DESIGN SYSTEM

```
Brand Voice:    Bold, Modern, Kenyan-proud, Professional, Innovative

Primary Color:        #FF4D00  (PrintHub Orange — energy, creativity)
Secondary Color:      #0A0A0A  (Deep Black — premium, contrast)
Accent:               #00C896  (Kenyan Green — trust, local pride)
Background Light:     #FAFAF8
Background Dark:      #111111
Surface:              #FFFFFF / #1A1A1A
Text Primary:         #0A0A0A / #F5F5F5
Text Secondary:       #6B6B6B / #A0A0A0
Error:                #FF3B30
Success:              #34C759
Warning:              #FF9500

Typography:
  Display:    "Cabinet Grotesk" or "Syne" (bold, modern African tech feel)
  Body:       "DM Sans" (clean, readable)
  Mono:       "JetBrains Mono" (for codes, order numbers)
  Accent:     "Playfair Display" (for premium/luxury product cards)

Design Language:
  - Angular cards with 2px radius (sharp, modern)
  - Heavy use of negative space
  - Full-bleed section photography
  - Animated counters and scroll-triggered reveals
  - Orange CTAs on dark backgrounds
  - Kenyan-inspired geometric accent patterns (subtle background textures)
  - Mobile-first, brutally clean navigation
```

---

## 📁 PROJECT STRUCTURE

```
printhub/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Customer-facing routes
│   │   ├── page.tsx              # Homepage
│   │   ├── about/
│   │   ├── services/
│   │   │   ├── large-format/
│   │   │   └── 3d-printing/
│   │   ├── shop/                 # Ecommerce shop
│   │   │   ├── page.tsx
│   │   │   ├── [category]/
│   │   │   └── [slug]/
│   │   ├── upload/               # Custom file upload orders
│   │   ├── quote/                # Quote request tool
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── account/
│   │   ├── orders/
│   │   ├── track/
│   │   ├── blog/
│   │   └── contact/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify-email/
│   ├── (admin)/                  # Admin dashboard
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── quotes/
│   │   ├── uploads/
│   │   ├── finance/
│   │   ├── marketing/
│   │   ├── inventory/
│   │   ├── staff/
│   │   ├── reports/
│   │   └── settings/
│   └── api/                      # API Routes
│       ├── auth/
│       ├── products/
│       ├── orders/
│       ├── payments/
│       │   ├── mpesa/
│       │   ├── pesapal/
│       │   └── flutterwave/
│       ├── uploads/
│       ├── quotes/
│       └── webhooks/
├── components/
│   ├── ui/                       # shadcn base components
│   ├── layout/                   # Header, Footer, Sidebar
│   ├── shop/                     # Product cards, filters, cart
│   ├── upload/                   # File upload + 3D preview
│   ├── checkout/                 # Checkout steps, payment
│   ├── admin/                    # Admin-specific components
│   ├── marketing/                # Hero, banners, testimonials
│   └── shared/                   # Reusable across sections
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── mpesa.ts
│   ├── pesapal.ts
│   ├── flutterwave.ts
│   ├── africas-talking.ts
│   ├── s3.ts
│   ├── email.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── emails/                       # React Email templates
├── public/
└── types/
```

---

## ✅ MASTER BUILD CHECKLIST

---

### PHASE 1: PROJECT SETUP & INFRASTRUCTURE

- [ ] Initialize Next.js 14 project with TypeScript and App Router
- [ ] Configure Tailwind CSS with custom design tokens (colors, fonts, spacing)
- [ ] Install and configure shadcn/ui component library
- [ ] Set up ESLint, Prettier, Husky (pre-commit hooks)
- [ ] Configure absolute imports (`@/components`, `@/lib`, etc.)
- [ ] Set up PostgreSQL database (local dev + production connection string)
- [ ] Initialize Prisma ORM with `prisma init`
- [ ] Create `.env.local` with all environment variable placeholders (documented)
- [ ] Set up AWS S3 or Cloudflare R2 bucket for file storage
- [ ] Configure NextAuth.js with providers (Email + Google)
- [ ] Set up Resend for transactional email
- [ ] Set up Africa's Talking account and SDK for Kenya SMS
- [ ] Initialize Sanity.io CMS project
- [ ] Set up Algolia search indices
- [ ] Configure Google Analytics 4 and Hotjar
- [ ] Deploy skeleton to Vercel with custom domain `printhub.africa`
- [ ] Configure SSL certificate on domain
- [ ] Set up staging environment `staging.printhub.africa`

---

### PHASE 2: DATABASE SCHEMA (Prisma)

Design and migrate the full schema. Every model below must be created:

**Users & Auth**
- [ ] `User` model: id, name, email, phone (Kenya +254 format), passwordHash, role (CUSTOMER | STAFF | ADMIN | SUPER_ADMIN), emailVerified, createdAt, updatedAt, profileImage, loyaltyPoints, preferredLanguage
- [ ] `Address` model: id, userId, label (Home/Office), street, city, county, postalCode, isDefault, coordinates (lat/lng)
- [ ] `Session` model (NextAuth)
- [ ] `Account` model (NextAuth OAuth)
- [ ] `VerificationToken` model

**Products & Catalog**
- [ ] `Category` model: id, name, slug, description, image, parentId (self-relation for subcategories), sortOrder, isActive
- [ ] `Product` model: id, name, slug, description, shortDescription, categoryId, productType (READYMADE_3D | LARGE_FORMAT | CUSTOM), images (array), basePrice, comparePrice, sku, stock, minOrderQty, maxOrderQty, weight, dimensions, materials (array), colors (array), finishes (array), isActive, isFeatured, metaTitle, metaDescription, tags, createdAt, updatedAt
- [ ] `ProductVariant` model: id, productId, name, sku, price, stock, attributes (JSON), image
- [ ] `ProductImage` model: id, productId, url, altText, sortOrder, isPrimary
- [ ] `ProductReview` model: id, productId, userId, rating, title, body, images (array), isVerified, isApproved, createdAt

**3D Printing Specific**
- [ ] `PrintMaterial` model: id, name, description, type (PLA|ABS|PETG|RESIN|NYLON|TPU), colorOptions (array), pricePerGram, leadTimeDays, image, properties (JSON), isActive
- [ ] `PrintFinish` model: id, name, description, priceModifier, isActive

**Large Format Printing**
- [ ] `PrintingMedium` model: id, name (Vinyl|Canvas|Mesh|Fabric|Foam Board|Corflute), pricePerSqMeter, minWidth, maxWidth, minHeight, maxHeight, description, isActive
- [ ] `LaminationType` model: id, name (Gloss|Matte|None), priceModifier

**Orders**
- [ ] `Order` model: id, orderNumber (auto-generated PHUB-XXXXXXX), userId (nullable for guest), status (PENDING|CONFIRMED|PROCESSING|PRINTING|QUALITY_CHECK|SHIPPED|DELIVERED|CANCELLED|REFUNDED), type (SHOP|CUSTOM_PRINT|LARGE_FORMAT|QUOTE), items (relation), subtotal, tax (16% VAT Kenya), shippingCost, discount, total, currency (KES), notes, createdAt, updatedAt, estimatedDelivery
- [ ] `OrderItem` model: id, orderId, productId, variantId, quantity, unitPrice, customizations (JSON), uploadedFileId, instructions
- [ ] `OrderTimeline` model: id, orderId, status, message, timestamp, updatedBy (staff)
- [ ] `ShippingAddress` model: linked to order
- [ ] `Refund` model: id, orderId, amount, reason, status, processedBy, processedAt

**Payments**
- [ ] `Payment` model: id, orderId, provider (MPESA|PESAPAL|FLUTTERWAVE|STRIPE|BANK_TRANSFER), amount, currency, status (PENDING|COMPLETED|FAILED|REFUNDED), reference, providerTransactionId, providerResponse (JSON), paidAt, createdAt
- [ ] `MpesaTransaction` model: id, paymentId, phoneNumber, merchantRequestId, checkoutRequestId, resultCode, resultDesc, mpesaReceiptNumber, transactionDate, amount
- [ ] `Invoice` model: id, orderId, invoiceNumber, issuedAt, dueAt, pdf (S3 url), vatAmount, totalAmount

**Custom File Uploads**
- [ ] `UploadedFile` model: id, userId, orderId (nullable), filename, originalName, mimeType, size, url (S3), thumbnailUrl, fileType (STL|OBJ|FBX|AI|PDF|PSD|PNG|JPEG|SVG|DXF|DWG), status (UPLOADED|REVIEWING|APPROVED|REJECTED|PROCESSING), reviewedBy, reviewNotes, printVolume (for 3D), printWeight (for 3D), printTime (for 3D), dimensions (JSON), createdAt
- [ ] `PrintQuote` model: id, uploadedFileId, userId, material, quantity, dimensions (JSON), area (for large format), estimatedCost, validUntil, status (DRAFT|SENT|ACCEPTED|EXPIRED|REJECTED), staffNotes, createdAt

**Marketing & CRM**
- [ ] `Coupon` model: id, code, type (PERCENTAGE|FIXED|FREE_SHIPPING), value, minOrderAmount, maxUses, usedCount, startDate, expiryDate, isActive, applicableTo (ALL|CATEGORY|PRODUCT)
- [ ] `CouponUsage` model: id, couponId, userId, orderId, usedAt
- [ ] `Newsletter` model: id, email, name, isSubscribed, subscribedAt, source
- [ ] `Wishlist` model: id, userId, productId, addedAt
- [ ] `Cart` model: id, userId (or sessionId for guests), items (JSON), createdAt, updatedAt
- [ ] `Notification` model: id, userId, type, title, message, isRead, link, createdAt
- [ ] `BlogPost` (managed in Sanity but reference id here for SEO)

**B2B / Corporate**
- [ ] `CorporateAccount` model: id, userId, companyName, kraPin, industry, creditLimit, paymentTerms (NET_30|NET_60|PREPAID), isApproved, approvedBy, createdAt
- [ ] `BulkQuote` model: id, corporateId, items (JSON), totalEstimate, status, expiresAt, assignedTo (staff)

**Inventory & Production**
- [ ] `Inventory` model: id, productId, variantId, quantity, lowStockThreshold, location (warehouse shelf)
- [ ] `ProductionQueue` model: id, orderId, orderItemId, assignedTo (staff), status, startedAt, completedAt, machineId, notes
- [ ] `Machine` model: id, name, type (LARGE_FORMAT_PRINTER|3D_PRINTER_FDM|3D_PRINTER_RESIN), status (IDLE|PRINTING|MAINTENANCE), location

**Staff & Admin**
- [ ] `Staff` model: id, userId, department, position, permissions (JSON array)
- [ ] `AuditLog` model: id, userId, action, entity, entityId, before (JSON), after (JSON), ipAddress, timestamp
- [ ] `SupportTicket` model: id, userId, orderId, subject, status, priority, messages (relation), createdAt
- [ ] `TicketMessage` model: id, ticketId, senderId, senderType (CUSTOMER|STAFF), message, attachments, createdAt

**Run all migrations:**
- [ ] `npx prisma migrate dev --name init`
- [ ] Seed database with: categories, sample products, print materials, printing mediums, admin user, coupons

---

### PHASE 3: AUTHENTICATION SYSTEM

- [ ] Implement NextAuth.js with custom Prisma adapter
- [ ] Email/password registration with bcrypt hashing
- [ ] Google OAuth login (configured for printhub.africa domain)
- [ ] Email verification flow (send verification email via Resend)
- [ ] Password reset flow (forgot password → email link → reset page)
- [ ] Session management with JWT + database sessions
- [ ] Role-based access control middleware (`CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`)
- [ ] Guest checkout support (cart persists via cookie/session, account created at checkout optionally)
- [ ] Phone number verification via Africa's Talking OTP (for M-Pesa payments)
- [ ] "Remember me" functionality
- [ ] Account lockout after 5 failed login attempts (15 min lockout)
- [ ] Two-factor authentication (TOTP via `otpauth`) for admin accounts

---

### PHASE 4: CUSTOMER-FACING WEBSITE

#### 4A. GLOBAL LAYOUT & NAVIGATION

- [ ] **Top announcement bar:** Rotating messages (promotions, free delivery threshold, hours). Dismissible. Shows Kenya flag emoji + "Nairobi, Kenya" location tag
- [ ] **Main header:**
  - PrintHub logo (SVG — orange wordmark with a geometric 3D cube icon)
  - Navigation: Home | Services ▾ | Shop ▾ | Upload Design | Get a Quote | Blog | Contact
  - Services dropdown: Large Format Printing, 3D Printing, Corporate Orders
  - Shop dropdown: All Products, By Category, New Arrivals, Best Sellers, Sale
  - Search bar with Algolia InstantSearch (real-time results with product thumbnails)
  - Cart icon with item count badge
  - User icon (shows avatar + name if logged in, or Login/Register)
  - WhatsApp floating button (Kenya number)
- [ ] **Mobile navigation:** Full-screen slide-in menu with all links, search, auth, and contact info
- [ ] **Footer:**
  - Logo + tagline: "Printing the Future, Made in Kenya"
  - "An Ezana Group Company" badge with Ezana Group logo
  - Columns: Company, Services, Shop, Support, Connect
  - Newsletter signup with Mailchimp/Resend integration
  - Payment method badges: M-Pesa, Pesapal, Visa, Mastercard, Bank Transfer
  - Social links: Instagram, Facebook, LinkedIn, TikTok, X/Twitter, YouTube
  - Kenya location map embed (Google Maps)
  - Business hours
  - KRA VAT registration number
  - Copyright: © 2025 PrintHub | Ezana Group. All rights reserved.
  - Links: Privacy Policy | Terms of Service | Cookie Policy | Refund Policy

---

#### 4B. HOMEPAGE

- [ ] **Hero section:**
  - Full-screen video background (printing machine in action) with orange overlay gradient
  - Headline: "Print Anything. Deliver Everywhere." (animated word swap)
  - Subheadline: "Large format printing & 3D printing for Nairobi and all of Kenya"
  - CTAs: "Shop Now" (primary) + "Upload Your Design" (secondary) + "Get a Free Quote"
  - Animated stats bar: "10,000+ prints delivered | 500+ happy clients | 48hr turnaround | Nairobi based"

- [ ] **Services overview section:**
  - Two large cards side by side: "Large Format Printing" and "3D Printing"
  - Each card: full bleed image, service name, short description, 3 bullet points of sub-services, CTA button
  - Hover: cards lift and show more info

- [ ] **How It Works section:**
  - 4-step process with animated icons:
    1. Choose your service or upload your design
    2. Get an instant or custom quote
    3. Pay securely (M-Pesa, card, bank)
    4. We print & deliver to you
  - Timeline connector between steps

- [ ] **Featured Products section:**
  - Heading: "Shop Ready-Made 3D Prints"
  - Horizontal scrollable product cards (8 products, filtered from `isFeatured: true`)
  - Each card: image, name, material tag, price in KES, "Add to Cart" and "Quick View"
  - "View All Products" CTA

- [ ] **Large Format Showcase:**
  - Before/after slider or masonry grid of print examples
  - Categories: Banners, Vehicle Wraps, Signage, Canvas, Events
  - "Request a Print" CTA

- [ ] **3D Printing Showcase:**
  - Interactive 3D model viewer (Three.js) showing a rotating sample print
  - Material selector: PLA, PETG, ABS, Resin — each updates the displayed model color
  - "Upload Your Model" CTA

- [ ] **Instant Price Calculator (teaser):**
  - Embedded mini-calculator on homepage for Large Format Printing
  - Inputs: Width (cm), Height (cm), Material (dropdown), Quantity
  - Live price output in KES
  - "Get Full Quote" button

- [ ] **Why PrintHub section:**
  - Icons + short text: Kenyan-owned, Fast Turnaround, Premium Materials, Nationwide Delivery, Expert Team, Secure Payments

- [ ] **Testimonials / Social Proof:**
  - Video testimonials carousel (embed YouTube)
  - Star ratings + quote cards from verified customers
  - Google Reviews integration (show live rating badge)
  - Logos of corporate clients

- [ ] **Blog preview section:**
  - 3 latest posts from Sanity CMS
  - "Read More" links to full blog

- [ ] **Instagram Feed section:**
  - Live grid of latest Instagram posts via Instagram Basic Display API

- [ ] **CTA Banner:**
  - Full-width orange background, bold text: "Ready to Bring Your Ideas to Life?"
  - Dual CTA: "Start Your Order" + "Talk to Us on WhatsApp"

---

#### 4C. SERVICES PAGES

**Large Format Printing page (`/services/large-format`)**
- [ ] Hero with full-bleed banner image + service headline
- [ ] Services grid with cards:
  - Vinyl Banners & Flex Banners
  - Billboard Printing
  - Vehicle Wraps & Branding
  - Event Backdrops & Photo Walls
  - Canvas Prints
  - Roll-up Banners & Pull-up Stands
  - Mesh Banners
  - Foam Board & Corrugated Plastic (Corflute)
  - Window Graphics & Frosted Vinyl
  - Wallpapers & Wall Murals
  - Floor Graphics
  - Fabric Banners & Textile Printing
- [ ] Technical specs section: max print width, DPI, file format requirements (AI, PDF, PSD, EPS, PNG at 300DPI)
- [ ] File preparation guidelines with downloadable template links
- [ ] Pricing table: per sqm pricing by material type
- [ ] Turnaround times table (Standard 3-5 days, Express 24-48hrs)
- [ ] **Interactive Quote Calculator:**
  - Width (cm) + Height (cm) inputs with live area calculation
  - Material selector with price per sqm shown
  - Lamination option (Gloss/Matte/None)
  - Quantity input
  - Finishing options: Eyelets, Hemming, Pole Pockets
  - Live total price in KES
  - "Add to Cart" or "Request Formal Quote" button
- [ ] FAQ accordion specific to large format
- [ ] CTA to upload design or contact

**3D Printing page (`/services/3d-printing`)**
- [ ] Hero section
- [ ] Technology tabs: FDM Printing, SLA/Resin Printing, SLS (coming soon)
- [ ] Materials section — each material as a card:
  - PLA (Standard) — ideal for prototypes, decor
  - PETG — food-safe, flexible, durable
  - ABS — heat resistant, engineering
  - TPU — rubber-like, flexible
  - Resin — ultra-detail, jewelry, miniatures
  - Nylon — strong, industrial
  - Each shows: color options, layer resolution, strength rating, price per gram
- [ ] **3D Printing Price Calculator:**
  - File upload (STL/OBJ) with Three.js preview
  - Auto-calculate: print volume (cm³), print weight (grams), estimated print time
  - Material selector — updates price live
  - Infill percentage slider (10%–100%)
  - Layer height dropdown (0.1mm, 0.2mm, 0.3mm)
  - Supports: Yes/No
  - Quantity
  - Finish: Raw / Sanded / Painted
  - Total estimated price in KES (with range — actual confirmed after file review)
  - "Submit for Quote" button → sends to admin for review + sends customer email
- [ ] Design specifications and tips
- [ ] Supported file formats: STL, OBJ, FBX, 3MF, STEP
- [ ] File size limits and requirements
- [ ] Applications section: Prototyping, Architecture, Education, Medical, Art, Jewelry, Industrial
- [ ] FAQ accordion

---

#### 4D. ECOMMERCE SHOP

**Shop listing page (`/shop`)**
- [ ] Left sidebar filters:
  - Category (checkbox tree — hierarchical)
  - Product Type (Ready-Made 3D | Custom Options)
  - Material (for 3D products)
  - Price range slider (KES)
  - Color swatches
  - Availability (In Stock / All)
  - Rating filter (4★ and above, etc.)
  - Sort: Featured | Price: Low-High | Price: High-Low | Newest | Best Selling | Top Rated
- [ ] Product grid: 3 columns desktop, 2 tablet, 1 mobile
- [ ] Product card includes: image (hover shows second image), category badge, product name, material tag, price in KES (with compare-at price if on sale), rating stars + review count, "Add to Cart" quick button, Wishlist heart icon, "Quick View" modal trigger
- [ ] Infinite scroll OR pagination (toggle)
- [ ] Active filter tags above grid (removable)
- [ ] Search results highlighting
- [ ] Product count: "Showing 24 of 143 products"
- [ ] Empty state with suggestions if no results

**Product detail page (`/shop/[slug]`)**
- [ ] Image gallery: main image + thumbnail row, zoom on hover, lightbox on click, video tab if available
- [ ] Product name, SKU, rating summary
- [ ] Short description
- [ ] Price in KES (large, prominent). Show VAT note: "Prices include 16% VAT"
- [ ] Variant selector (color swatches, material dropdown, size)
- [ ] Quantity input (min/max enforced)
- [ ] Customization options if applicable (text, color, etc.)
- [ ] "Add to Cart" (primary, orange) and "Add to Wishlist" buttons
- [ ] "Buy Now" button (goes directly to checkout)
- [ ] Stock status: In Stock / Low Stock (X left) / Out of Stock
- [ ] Estimated delivery date (calculates from today + production time + shipping)
- [ ] Share buttons: WhatsApp, Facebook, X, Copy Link
- [ ] Product tabs:
  - Description (rich text from DB)
  - Specifications (table: dimensions, weight, material, finish, etc.)
  - Reviews (star breakdown, review list with pagination, "Write a Review" form for verified buyers)
  - Shipping & Returns
- [ ] Related products horizontal carousel (same category)
- [ ] Recently viewed products
- [ ] WhatsApp "Ask a Question" floating button with product pre-filled

**Cart page (`/cart`)**
- [ ] Cart items list: image, name, variant, quantity input, unit price, line total, remove button
- [ ] Apply coupon code input with validation and success/error feedback
- [ ] Order summary: subtotal, discount, shipping estimate (by county), VAT (16%), total in KES
- [ ] Loyalty points display (if logged in): "You'll earn X points on this order"
- [ ] Proceed to Checkout CTA (large orange button)
- [ ] Continue Shopping link
- [ ] "You may also like" recommendations
- [ ] Cart persistence: saved to DB if logged in, localStorage fallback for guests, merge on login
- [ ] Empty cart state with CTA to shop

**Checkout page (`/checkout`)**
- [ ] Multi-step form with progress indicator: (1) Information → (2) Shipping → (3) Payment → (4) Review
- [ ] Guest checkout option (email only, optional account creation post-order)
- [ ] **Step 1 — Contact Information:**
  - Email address
  - Phone number (+254 format, used for M-Pesa)
  - First name, last name
- [ ] **Step 2 — Shipping:**
  - Address autocomplete (Google Places API)
  - County selector (all 47 Kenya counties)
  - Sub-county / area
  - Postal code
  - Delivery method: Standard Delivery | Express Delivery | Pickup from Nairobi
  - Delivery fee calculated by county (define rates in DB)
  - Estimated delivery date shown
- [ ] **Step 3 — Payment:**
  - Payment method selector (see Payment section below for full implementation)
- [ ] **Step 4 — Review & Place Order:**
  - Full order summary (items, shipping address, payment method, total)
  - Terms of Service checkbox
  - "Place Order" button
- [ ] Order confirmation page after successful payment (with order number, summary, next steps)
- [ ] Confirmation email sent automatically

---

#### 4E. CUSTOM FILE UPLOAD / ORDER PAGE (`/upload`)

- [ ] Page hero: "Upload Your Design — We'll Print It"
- [ ] Service type selector: Large Format Print | 3D Print
- [ ] **Upload component:**
  - Drag-and-drop zone + file picker button
  - Accepted formats shown (and validated):
    - Large Format: AI, PDF, PSD, EPS, PNG (300dpi+), SVG
    - 3D Print: STL, OBJ, FBX, 3MF, STEP
  - Max file size: 500MB per file
  - Multi-file upload support (up to 5 files per order)
  - Upload progress bar per file
  - S3 direct upload via pre-signed URLs
  - File preview:
    - Images: thumbnail preview
    - PDFs: first page preview via pdf.js
    - 3D files: Three.js interactive viewer (rotate, zoom, pan)
- [ ] **Order details form (shown after upload):**
  - For Large Format:
    - Width × Height (cm) input with live sqm calculation
    - Material selection (with price per sqm shown)
    - Lamination
    - Quantity
    - Finishing options (eyelets, hemming, etc.)
    - Special instructions textarea
  - For 3D Print:
    - Material selection
    - Color preference
    - Infill %
    - Layer height
    - Quantity
    - Finish (raw/sanded/painted/custom color)
    - Intended use (prototype, display, functional)
    - Special instructions
- [ ] Price estimate shown (with note: "Estimate only — confirmed after file review by our team")
- [ ] Estimated turnaround shown
- [ ] "Submit Order" button → creates order with status PENDING, sends to admin queue
- [ ] Customer receives: email confirmation with file details + estimated response within 2 business hours
- [ ] After admin reviews: customer gets email/SMS with confirmed price and payment link

---

#### 4F. QUOTE REQUEST PAGE (`/quote`)

- [ ] Two tabs: "Large Format Quote" | "3D Print Quote"
- [ ] Form fields (similar to upload page but without mandatory file)
- [ ] Optional file upload
- [ ] Contact details
- [ ] "Preferred response method": Email | WhatsApp | Phone call
- [ ] Submit → admin sees in Quotes queue → can respond with formal PDF quote
- [ ] Quote tracking: customer gets quote reference number, can check status at `/track?ref=QXXXXXX`

---

#### 4G. USER ACCOUNT SECTION (`/account`)

- [ ] **Dashboard:** Welcome message, quick stats (total orders, points balance, active orders)
- [ ] **My Orders** (`/account/orders`):
  - Order list with: order number, date, status badge, item count, total (KES), action buttons
  - Order detail page: full timeline, items, invoice download (PDF), reorder button
  - Order tracking with visual timeline: Confirmed → Processing → Printing → Quality Check → Shipped → Delivered
- [ ] **My Uploads** (`/account/uploads`): gallery of uploaded files with status (Reviewing/Approved/Quote Sent)
- [ ] **Quotes** (`/account/quotes`): list of quote requests with status, ability to accept quote → create order
- [ ] **Wishlist** (`/account/wishlist`): saved products
- [ ] **Addresses**: manage saved addresses (CRUD)
- [ ] **Profile Settings**: name, email, phone, profile picture upload, password change
- [ ] **Notifications**: in-app notification center (order updates, promotions)
- [ ] **Loyalty Points**: balance, history, how to redeem
- [ ] **Corporate Account**: apply to become corporate client (form → admin approval)
- [ ] **Support Tickets**: view and reply to support tickets

---

#### 4H. BLOG (`/blog`)

- [ ] Blog listing with category filter
- [ ] Featured post (full-width hero card)
- [ ] Post cards with image, category tag, date, read time, excerpt, author avatar
- [ ] Single post page: full content, author bio, table of contents, social share, related posts
- [ ] CMS powered by Sanity.io (admin edits content in Sanity Studio)
- [ ] SEO: meta tags, og tags, JSON-LD schema per post
- [ ] Comment section (optional: Disqus or custom)

---

#### 4I. CONTACT PAGE (`/contact`)

- [ ] Contact form: name, email, phone, subject, message, file attachment option
- [ ] Business info: Address, Phone, WhatsApp, Email
- [ ] Business hours (Monday–Saturday, with Kenya public holidays note)
- [ ] Embedded Google Map showing physical location in Nairobi
- [ ] WhatsApp Click-to-Chat button (+254 number)
- [ ] Instagram, Facebook, LinkedIn links
- [ ] FAQ section (quick answers to common questions)

---

### PHASE 5: PAYMENT INTEGRATIONS (KENYA-FOCUSED)

#### 5A. M-PESA (Primary — Safaricom Daraja API)

- [ ] Register on Safaricom Developer Portal (developer.safaricom.co.ke)
- [ ] Set up Lipa Na M-Pesa Online (STK Push) — Paybill/Till Number
- [ ] Implement **STK Push (C2B):** Customer enters phone number → M-Pesa prompt sent to phone → Customer enters PIN → Payment confirmed
- [ ] Create `/api/payments/mpesa/stkpush` endpoint:
  - Input: phone (format to 254XXXXXXXXX), amount (integer KES), orderId, accountReference
  - Call Daraja API OAuth to get token
  - Call STK Push endpoint
  - Store `MerchantRequestID` and `CheckoutRequestID` in `MpesaTransaction`
- [ ] Create `/api/payments/mpesa/callback` endpoint (must be publicly accessible HTTPS URL):
  - Receives Daraja callback
  - Parse result: success (ResultCode: 0) or failure
  - On success: update `Payment` status to COMPLETED, update `Order` status to CONFIRMED
  - Save `MpesaReceiptNumber`, `TransactionDate`, `Amount` to `MpesaTransaction`
  - Trigger order confirmation email + SMS to customer
- [ ] Create `/api/payments/mpesa/query` endpoint (STK Push Query) for polling payment status
- [ ] Frontend: M-Pesa payment step in checkout:
  - Input: phone number (pre-filled from account if available)
  - "Pay KES X,XXX via M-Pesa" button
  - Show animated waiting state: "Check your phone for the M-Pesa prompt..."
  - Poll `/api/payments/mpesa/query` every 5 seconds for up to 2 minutes
  - Success → order confirmation. Timeout → show retry option
- [ ] C2B Validation & Confirmation URL registration (for direct Paybill payments)
- [ ] M-Pesa B2C (for refunds): implement Daraja B2C API to send refunds to customer phone
- [ ] Handle M-Pesa errors gracefully: wrong PIN, insufficient funds, phone offline, timeout

#### 5B. PESAPAL

- [ ] Register at pesapal.com as merchant
- [ ] Implement Pesapal v3 API
- [ ] Create `/api/payments/pesapal/initiate` endpoint:
  - Register IPN (Instant Payment Notification) URL
  - Submit order to Pesapal → receive redirect URL
  - Redirect customer to Pesapal hosted page (supports Visa, Mastercard, Airtel Money, M-Pesa, bank)
- [ ] Create `/api/payments/pesapal/ipn` endpoint (IPN handler):
  - Receives payment notification
  - Query Pesapal for transaction status
  - Update `Payment` and `Order` accordingly
- [ ] Handle Pesapal redirect back to site (success/cancel URLs)
- [ ] Display Pesapal as "Pay with Card or Mobile Money" option at checkout
- [ ] Support currencies: KES

#### 5C. FLUTTERWAVE

- [ ] Register at flutterwave.com
- [ ] Implement Flutterwave Standard (redirect) or Inline (popup)
- [ ] Create `/api/payments/flutterwave/initiate` endpoint
- [ ] Create `/api/payments/flutterwave/webhook` endpoint
- [ ] Support: M-Pesa Kenya, Card (Visa/Mastercard), Bank Transfer
- [ ] Use Flutterwave as fallback/alternative to Pesapal
- [ ] Display as "Pay with Flutterwave" option

#### 5D. STRIPE (International Cards)

- [ ] Set up Stripe account
- [ ] Implement Stripe Payment Intents API
- [ ] Stripe Elements (card input) embedded in checkout
- [ ] Create `/api/payments/stripe/create-intent` endpoint
- [ ] Create `/api/payments/stripe/webhook` endpoint (handle `payment_intent.succeeded`, `payment_intent.failed`)
- [ ] Show Stripe for customers paying in USD or with international cards
- [ ] Currency: KES (Stripe supports KES)

#### 5E. BANK TRANSFER

- [ ] Show bank details (Account Name: PrintHub Ltd | Bank: [bank name] | Account: XXXXXXXX | Branch: Nairobi)
- [ ] Customer uploads proof of payment (image/PDF)
- [ ] Admin manually confirms and updates order
- [ ] Available for orders above KES 10,000 or corporate accounts

#### 5F. PAYMENT UI

- [ ] Payment method selector with icons (M-Pesa logo, Pesapal logo, Flutterwave logo, Visa, Mastercard, Bank)
- [ ] M-Pesa: most prominent (primary payment method for Kenya)
- [ ] Show total with VAT breakdown before payment
- [ ] Payment security badge: "256-bit SSL Secured Payments"
- [ ] All prices in KES with KES symbol (not Ksh)

---

### PHASE 6: ADMIN DASHBOARD

> Route: `/admin/*` — accessible only to STAFF, ADMIN, SUPER_ADMIN roles. Protected by middleware.

#### 6A. ADMIN NAVIGATION & LAYOUT

- [ ] Dark sidebar navigation with PrintHub logo
- [ ] Menu items with icons:
  - Dashboard (overview)
  - Orders
  - Products
  - Customers
  - Quotes & Uploads
  - Finance
  - Inventory
  - Production Queue
  - Marketing
  - Staff
  - Reports
  - Settings
- [ ] Top bar: logged-in admin name, notifications bell, quick search, theme toggle
- [ ] Breadcrumbs on all pages
- [ ] Mobile-responsive admin layout

#### 6B. ADMIN DASHBOARD (Overview)

- [ ] **KPI cards** (today / this week / this month toggles):
  - Total Revenue (KES)
  - Total Orders
  - Pending Orders (requires action)
  - New Customers
  - Conversion Rate
  - Average Order Value
  - Quotes Pending
  - Files Awaiting Review
- [ ] **Revenue chart:** Line chart — daily revenue for current month (Recharts or Chart.js)
- [ ] **Orders by status donut chart**
- [ ] **Recent orders table** (last 10, with status badges and links)
- [ ] **Recent uploads awaiting review** (thumbnail, filename, type, customer name, time)
- [ ] **Low stock alerts**
- [ ] **Payment method breakdown** (M-Pesa vs Card vs Bank — pie chart)
- [ ] **Top selling products** (this month)
- [ ] **New customer list** (last 5 signups)
- [ ] **Production queue status** (how many jobs in printing, how many idle machines)
- [ ] **Notifications panel** (unread system alerts)

#### 6C. ORDER MANAGEMENT

- [ ] Orders list with columns: Order # | Customer | Type | Items | Total (KES) | Payment Status | Order Status | Date | Actions
- [ ] Advanced filters: status, date range, payment method, order type, search by order# or customer
- [ ] Bulk actions: mark as processing, mark as shipped, export selected
- [ ] **Order detail page:**
  - Full order summary (items, quantities, prices, customizations)
  - Customer info with link to customer profile
  - Shipping address on map
  - Payment history (all attempts, successful one highlighted)
  - Invoice (view + send to customer)
  - Order timeline (editable — add events manually)
  - Status update dropdown → auto-sends email + SMS to customer on change
  - Assign to production queue
  - View uploaded files (with download)
  - Staff notes (internal, not visible to customer)
  - Refund button (partial or full) → triggers M-Pesa B2C or Stripe refund
  - Print packing slip
  - Print job ticket (for production team)

#### 6D. PRODUCT MANAGEMENT

- [ ] Products list with: image, name, category, type, price, stock, status, actions
- [ ] **Add/Edit Product form:**
  - Basic info: name, slug (auto-generated), description (rich text editor — Tiptap or Quill), short description
  - Category assignment (hierarchical)
  - Product type
  - Images: upload multiple, drag to reorder, set primary
  - Pricing: base price, compare price, cost price (for margin tracking)
  - Inventory: SKU, stock quantity, low stock threshold, track inventory toggle
  - Variants: add variant types (color, material, size) and individual variant pricing/stock
  - Customization options builder
  - SEO tab: meta title, meta description, OG image
  - Status: active/inactive, featured toggle
- [ ] **Category management:** tree view, drag-to-reorder, add/edit/delete
- [ ] **Product reviews management:** list, approve/reject, respond to reviews
- [ ] **Bulk product import:** CSV upload with column mapping
- [ ] **Product export:** CSV/Excel download

#### 6E. CUSTOMER MANAGEMENT

- [ ] Customer list: name, email, phone, orders count, total spent, joined date, role, status
- [ ] Search and filter customers
- [ ] **Customer detail page:**
  - Profile info
  - Order history (with links)
  - Upload history
  - Quotes history
  - Payment history
  - Loyalty points balance + history
  - Support tickets
  - Notes (internal)
  - Segment tags (VIP, Corporate, Regular)
  - Block/unblock customer
  - Manually adjust loyalty points
  - Send email or SMS to customer from admin
- [ ] Corporate accounts list: pending approval queue, approve/reject, set credit limit
- [ ] **Customer segments:** tag customers, used for targeted marketing

#### 6F. QUOTES & UPLOADS MANAGEMENT

- [ ] **Uploads queue:**
  - List of uploaded files awaiting review
  - Filters: type (3D/Large Format), status, date
  - Click file → preview + details
  - For 3D files: show auto-calculated volume, weight, print time estimate
  - For large format: show dimensions, material
  - Review actions: Approve | Request Clarification | Reject (with reason)
  - After approval: create quote → set price → send quote to customer
  - Quote sent → customer gets email with quote PDF and payment link

- [ ] **Quotes list:**
  - Status: Draft | Sent | Accepted | Rejected | Expired
  - Click → view quote, edit, resend, convert to order
  - Accept/reject tracking

- [ ] **Quote PDF generator:**
  - Auto-generates professional PDF quote using React-PDF or Puppeteer
  - Includes: PrintHub logo, Ezana Group footer, quote number, items, prices, VAT, validity date, bank details, M-Pesa paybill, terms

#### 6G. FINANCE & PAYMENTS

- [ ] Revenue dashboard with date range picker
- [ ] Transactions list: all payments (M-Pesa, Card, Bank) with provider reference
- [ ] Filter by payment method, status, date
- [ ] Individual transaction detail with provider raw response
- [ ] **Refunds management:** initiate, track, and reconcile refunds
- [ ] **VAT report:** monthly VAT collected (16% Kenya VAT) — exportable
- [ ] **Revenue by product/category report**
- [ ] **Payout tracking** (for any partner/reseller commissions)
- [ ] **Invoice management:** list, send, download all invoices
- [ ] **M-Pesa reconciliation:** match STK push transactions with orders
- [ ] **Financial summary export:** Excel/CSV for accounting (Xero or QuickBooks compatible)

#### 6H. INVENTORY MANAGEMENT

- [ ] Inventory dashboard per product/variant
- [ ] Low stock alerts list
- [ ] Stock adjustment (add stock, adjust, write-off — with reason and audit trail)
- [ ] **Print materials inventory:**
  - Roll materials (vinyl, canvas, etc.) — track by sqm remaining
  - 3D print filaments — track by kg remaining
  - Alert when below threshold
- [ ] Inventory log (all changes with user, timestamp, reason)
- [ ] Purchase orders (create PO for restocking — not full procurement but tracking)

#### 6I. PRODUCTION QUEUE

- [ ] **Production board (Kanban style):**
  - Columns: Queued | In Progress | Printing | Quality Check | Done
  - Each job card: order number, product, quantity, material, customer name, deadline
  - Drag to move between columns
  - Assign to specific machine
  - Assign to staff member
- [ ] **Machine status panel:** each printer listed with current job and status
- [ ] **Job ticket print:** printable sheet for production team with all order specs + file QR code
- [ ] **Daily production schedule view:** timeline/calendar of all jobs
- [ ] **Production metrics:** jobs completed per day, average print time, machine utilization

#### 6J. MARKETING MODULE

- [ ] **Coupons management:**
  - Create coupon: code, type (%, fixed, free shipping), value, min order, max uses, validity, applicable products/categories
  - List with usage stats (used/total)
  - Enable/disable coupons
  - View coupon usage (which orders used it)

- [ ] **Newsletter management:**
  - Subscriber list (name, email, subscribed date, source)
  - Unsubscribe management
  - Export CSV for use in Mailchimp or direct send
  - Create and send newsletter via Resend API
  - Newsletter templates (HTML email builder)

- [ ] **Banner/Announcement manager:**
  - Manage homepage announcement bar text and links
  - Schedule start/end dates for announcements

- [ ] **SEO tools:**
  - View all pages' meta titles and descriptions
  - Edit directly from admin
  - Sitemap generation status
  - Robots.txt editor

- [ ] **Promotions / Flash Sales:**
  - Create flash sale: select products, discount %, start/end datetime
  - Auto-applies discount on products in that window

- [ ] **Email campaign manager:**
  - Compose email to selected customer segments
  - Schedule or send immediately
  - Track opens/clicks (via Resend webhooks)

- [ ] **Loyalty program settings:**
  - Points earned per KES spent (e.g., 1 point per KES 10)
  - Points value (e.g., 100 points = KES 10 discount)
  - Enable/disable program
  - Bonus points rules (e.g., double points on weekends)

- [ ] **Referral program:**
  - Each customer gets unique referral code
  - Track referrals and reward both referrer and new customer
  - Referral dashboard

#### 6K. STAFF MANAGEMENT

- [ ] Staff list: name, email, role, department, status, last active
- [ ] Invite new staff (email invite → they set password)
- [ ] Edit staff role and permissions
- [ ] **Permissions matrix:** granular permissions per section (view/edit/delete/approve)
- [ ] Deactivate staff account
- [ ] **Activity log:** every action taken by staff in the system
- [ ] Staff performance dashboard: orders processed, quotes sent, files reviewed (this month)

#### 6L. REPORTS & ANALYTICS

- [ ] **Sales report:** by day/week/month/custom range — chart + data table — export CSV/Excel
- [ ] **Product performance report:** top sellers, least sold, return rate
- [ ] **Customer report:** new vs returning, by county, average LTV
- [ ] **Payment method report:** M-Pesa vs card vs bank split
- [ ] **Production report:** jobs by type, material consumption, machine utilization
- [ ] **Quote conversion report:** quotes sent vs accepted vs rejected
- [ ] **Marketing report:** coupon usage, newsletter performance
- [ ] **VAT/Tax report:** monthly — formatted for KRA compliance
- [ ] All reports exportable as Excel and PDF

#### 6M. SETTINGS

- [ ] **General settings:**
  - Business name, logo upload, tagline
  - Business address, phone, email, WhatsApp number
  - Business hours
  - Social media URLs
  - KRA PIN, VAT number

- [ ] **Shipping settings:**
  - Delivery zones: define rates per county (47 counties)
  - Free shipping threshold (KES amount)
  - Express shipping surcharge
  - Pickup option toggle + address

- [ ] **Payment settings:**
  - M-Pesa: enter Paybill/Till, passkey, callback URL
  - Pesapal: API key + secret
  - Flutterwave: public + secret keys
  - Stripe: publishable + secret keys
  - Bank transfer: bank details text

- [ ] **Tax settings:**
  - VAT rate (default 16% Kenya VAT)
  - Toggle prices as VAT-inclusive or VAT-exclusive
  - VAT registration number display

- [ ] **Email settings:**
  - Resend API key
  - "From" email address
  - Email footer content
  - Toggle which events trigger emails

- [ ] **SMS settings:**
  - Africa's Talking API key
  - Sender ID
  - Toggle which events trigger SMS

- [ ] **Notification settings:** which system events trigger in-app admin notifications

- [ ] **Maintenance mode:** toggle site offline with custom message

---

### PHASE 7: EMAIL & SMS NOTIFICATIONS

Design and implement all transactional communications:

**Email Templates (React Email — all branded with PrintHub logo, orange accent, Ezana Group footer):**

- [ ] Welcome email (after registration)
- [ ] Email verification
- [ ] Password reset
- [ ] Order confirmed (with order summary, items, total KES, estimated delivery)
- [ ] Payment received (with M-Pesa receipt or card reference)
- [ ] Order status update (for each status change — one template, dynamic status)
- [ ] Order shipped (with tracking info)
- [ ] Order delivered
- [ ] Quote sent (with link to view and accept quote, PDF attached)
- [ ] Quote accepted / rejected
- [ ] File upload received (we'll review within 2 business hours)
- [ ] File review complete (approved / needs changes / rejected)
- [ ] Invoice email (with PDF attached)
- [ ] Refund initiated
- [ ] Refund completed
- [ ] Abandoned cart reminder (1 hour, 24 hours)
- [ ] Back-in-stock notification
- [ ] Loyalty points earned
- [ ] Loyalty points redeemed
- [ ] Newsletter (template for marketing)
- [ ] Corporate account approved
- [ ] Staff: new order notification
- [ ] Staff: new upload requires review
- [ ] Staff: new quote request
- [ ] Staff: low stock alert

**SMS Templates (Africa's Talking — keep under 160 chars for single SMS):**

- [ ] M-Pesa payment received: "PrintHub: Payment of KES X received for Order #PHUB-XXXXX. Thank you! Track at printhub.africa/track"
- [ ] Order confirmed: "PrintHub: Order #PHUB-XXXXX confirmed. Est. delivery: [date]. Track: printhub.africa/track"
- [ ] Order shipped: "PrintHub: Your order #PHUB-XXXXX is on its way! Delivery by [date]."
- [ ] Order delivered: "PrintHub: Order #PHUB-XXXXX delivered. Enjoy! Review us at printhub.africa"
- [ ] Quote ready: "PrintHub: Your quote is ready. View & accept: printhub.africa/account/quotes"
- [ ] Payment reminder (for bank transfer orders pending payment)

---

### PHASE 8: SEO & PERFORMANCE

- [ ] Next.js Metadata API: dynamic `generateMetadata()` for all pages (title, description, og:image, og:type, canonical URL)
- [ ] JSON-LD structured data:
  - `Organization` schema (PrintHub, Ezana Group parent)
  - `LocalBusiness` schema (Nairobi location, hours, services)
  - `Product` schema on all product pages
  - `BreadcrumbList` on all pages
  - `FAQPage` on service pages and FAQ sections
  - `Article` schema on blog posts
- [ ] `sitemap.xml` generated dynamically (Next.js sitemap)
- [ ] `robots.txt` (block /admin/*, /api/*)
- [ ] Open Graph images generated dynamically (Next.js OG image)
- [ ] Canonical URLs
- [ ] 301 redirects for old URL structures
- [ ] Image optimization: Next.js `<Image>` component on all images, WebP conversion, responsive srcset
- [ ] Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, FID < 100ms
- [ ] Lazy loading for below-fold content
- [ ] Code splitting per route
- [ ] Font optimization (next/font with subset)
- [ ] Google Analytics 4 event tracking:
  - Page views
  - Product views
  - Add to cart
  - Begin checkout
  - Purchase (with value in KES)
  - File upload
  - Quote request
  - Search queries
- [ ] Hotjar heatmaps and session recordings (exclude /admin/*)

---

### PHASE 9: SECURITY

- [ ] HTTPS enforced everywhere
- [ ] All API routes protected by authentication middleware (check session/JWT)
- [ ] Role-based authorization on all admin routes
- [ ] Input validation on all forms (Zod schemas)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React escaping + Content Security Policy headers)
- [ ] CSRF protection (Next.js built-in + custom token for non-Next forms)
- [ ] Rate limiting on auth endpoints (login, register, forgot password) — 5 attempts per 15 min
- [ ] Rate limiting on payment endpoints
- [ ] File upload security:
  - Validate MIME type on server (not just extension)
  - Virus scan uploaded files (ClamAV or VirusTotal API)
  - Restrict file types strictly (no executable formats)
  - Store in private S3 bucket (generate signed URLs for access)
- [ ] M-Pesa callback: validate that callback is from Safaricom IP ranges
- [ ] Pesapal/Flutterwave webhooks: validate signature headers
- [ ] Stripe webhooks: validate with `stripe.webhooks.constructEvent`
- [ ] Audit log every admin action (who, what, when, before/after state)
- [ ] Secrets in environment variables only — never hardcoded
- [ ] Dependency vulnerability scan (`npm audit`)
- [ ] Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

---

### PHASE 10: ACCESSIBILITY & UX POLISH

- [ ] WCAG 2.1 AA compliance across all pages
- [ ] Semantic HTML (proper heading hierarchy, landmark elements)
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation for all menus, modals, forms, and cart
- [ ] Focus visible indicators
- [ ] Color contrast ratio ≥ 4.5:1 for all text
- [ ] Alt text on all images (auto-generated from product name + category, editable in admin)
- [ ] Skip to main content link
- [ ] Form error messages clear and linked to fields
- [ ] Loading skeletons on all data-fetched components
- [ ] Toast notifications for all user actions (add to cart, coupon applied, etc.)
- [ ] Confirm dialogs for destructive actions (delete, cancel order)
- [ ] WhatsApp floating button on all pages (mobile-first)
- [ ] Back to top button
- [ ] Cookie consent banner (GDPR-lite, Kenya context)
- [ ] 404 page: custom branded, with search and popular links
- [ ] 500 error page: custom branded, with support contact

---

### PHASE 11: MOBILE & PWA

- [ ] Fully responsive on all screen sizes (320px to 2560px)
- [ ] Test on: iPhone SE, iPhone 14, Samsung Galaxy, iPad, desktop
- [ ] Progressive Web App (PWA):
  - `manifest.json` with app name, icons, theme color
  - Service worker for offline caching of static assets
  - "Add to Home Screen" prompt for mobile users
  - Push notifications setup (for order updates)
- [ ] Mobile-specific UX:
  - Bottom navigation bar on mobile for: Home, Shop, Cart, Account
  - Swipe gestures on image galleries
  - M-Pesa number auto-detected from profile on mobile checkout
  - Click-to-call phone number links

---

### PHASE 12: TESTING

- [ ] Unit tests (Jest + React Testing Library) for all utility functions
- [ ] Component tests for: ProductCard, CartItem, CheckoutStepper, PaymentSelector
- [ ] API route tests for: auth, orders, payments, uploads
- [ ] E2E tests (Playwright or Cypress):
  - Full customer journey: browse → product → add to cart → checkout → M-Pesa payment
  - Custom upload order flow
  - Quote request flow
  - Admin order management
  - Admin product creation
- [ ] M-Pesa payment flow: test with Safaricom Sandbox (simulate success and failure)
- [ ] Payment webhook tests (simulate Pesapal and Flutterwave webhooks)
- [ ] Load testing (k6 or Artillery): checkout page at 100 concurrent users
- [ ] Accessibility audit (axe-core + manual screen reader test)
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge

---

### PHASE 13: DEVOPS & DEPLOYMENT

- [ ] Vercel deployment for Next.js (connected to GitHub main branch for auto-deploy)
- [ ] Preview deployments on every PR
- [ ] Environment variables set in Vercel dashboard (never in repo)
- [ ] PostgreSQL: provision on Neon, Supabase, or Railway
- [ ] S3/R2 bucket: separate buckets for dev and production
- [ ] Separate .env for development, staging, production
- [ ] Database migrations run automatically on deploy (Prisma migrate deploy)
- [ ] Vercel Edge Functions for geolocation (detect Kenya users, show KES by default)
- [ ] CDN: Vercel Edge Network handles static assets
- [ ] Domain: configure DNS on printhub.africa → Vercel
- [ ] www redirect → apex domain
- [ ] Monitoring: Vercel Analytics + Sentry for error tracking
- [ ] Uptime monitoring (Better Uptime or UptimeRobot): alert on downtime
- [ ] Database backups: daily automated backups (7-day retention)
- [ ] Log retention: 30 days

---

### PHASE 14: CONTENT & COPY

- [ ] Homepage all sections copy written (using provided brand voice)
- [ ] Services pages full copy
- [ ] About page: PrintHub story, Ezana Group background, team section (placeholder)
- [ ] All product descriptions (placeholders for demo products)
- [ ] Blog: 3 starter posts (SEO-targeted for Kenya printing market):
  1. "How to Prepare Your Files for Large Format Printing in Kenya"
  2. "The Complete Guide to 3D Printing Materials: Which One is Right for Your Project?"
  3. "Why Nairobi Businesses Are Switching to Digital Printing for Their Branding"
- [ ] FAQ page with 20+ Q&As covering printing, 3D printing, payments, delivery
- [ ] Privacy Policy (Kenya Data Protection Act 2019 compliant)
- [ ] Terms of Service
- [ ] Refund & Returns Policy (clear policy for printed goods — note that custom prints are non-refundable unless defective)
- [ ] Cookie Policy

---

### PHASE 15: LAUNCH CHECKLIST

- [ ] All environment variables set in production
- [ ] M-Pesa Daraja: switch from sandbox to production credentials
- [ ] Pesapal: switch to live credentials
- [ ] Flutterwave: switch to live credentials
- [ ] Stripe: switch to live keys
- [ ] Africa's Talking: switch to live account
- [ ] Resend: verify sending domain (printhub.africa)
- [ ] Google Analytics: verify data flowing in
- [ ] Sentry: verify error reporting working
- [ ] All webhook URLs updated to production domain
- [ ] M-Pesa callback URL whitelisted in Daraja (must be HTTPS)
- [ ] Run full E2E test on production (including real M-Pesa transaction of KES 1)
- [ ] Seed production DB with: real categories, real products, real pricing, admin account
- [ ] Create first admin account (SUPER_ADMIN role)
- [ ] Google Search Console: submit sitemap
- [ ] Google My Business: set up/verify listing for PrintHub Nairobi
- [ ] Load test checkout page
- [ ] Security audit (check for exposed env vars, open admin routes, etc.)
- [ ] 404 and 500 pages verified
- [ ] Cookie consent working
- [ ] Social media pages created and linked
- [ ] WhatsApp Business number configured and linked

---

## 🔑 ENVIRONMENT VARIABLES REFERENCE

```env
# App
NEXT_PUBLIC_APP_URL=https://printhub.africa
NEXT_PUBLIC_APP_NAME=PrintHub
NEXTAUTH_URL=https://printhub.africa
NEXTAUTH_SECRET=

# Database
DATABASE_URL=postgresql://...

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# M-Pesa (Daraja)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=          # Paybill or Till number
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://printhub.africa/api/payments/mpesa/callback
MPESA_ENV=production      # sandbox | production

# Pesapal
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_IPN_URL=https://printhub.africa/api/payments/pesapal/ipn
PESAPAL_ENV=live          # sandbox | live

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_WEBHOOK_SECRET=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AWS S3 / Cloudflare R2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET_NAME=
NEXT_PUBLIC_S3_URL=

# Resend (Email)
RESEND_API_KEY=
FROM_EMAIL=hello@printhub.africa

# Africa's Talking (SMS)
AT_API_KEY=
AT_USERNAME=
AT_SENDER_ID=PrintHub

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Hotjar
NEXT_PUBLIC_HOTJAR_ID=
```

---

## 🏁 FINAL NOTES FOR CURSOR AI

1. **Build in phases** — complete Phase 1–3 before building any UI. A solid foundation prevents costly rewrites.
2. **M-Pesa first** — prioritize M-Pesa payment integration above all other payment methods. It is the primary payment method in Kenya and must work flawlessly.
3. **Mobile first** — over 80% of Kenyan web traffic is mobile. Design every component for mobile first, then expand to desktop.
4. **KES everywhere** — never default to USD. All prices, invoices, and payment amounts must be in KES.
5. **Kenya phone numbers** — all phone inputs must accept and store Kenya format (+254XXXXXXXXX / 0XXXXXXXXX — normalize to 254XXXXXXXXX before M-Pesa API calls).
6. **VAT compliance** — Kenya VAT is 16%. Show VAT on all invoices and receipts. Display "Prices include 16% VAT" on the shop.
7. **Ezana Group branding** — include "An Ezana Group Company" in the footer and on invoices/quotes.
8. **File security** — all uploaded files (especially customer designs) must be stored in private S3/R2, never publicly accessible. Generate time-limited signed URLs for access.
9. **Print-ready output** — job tickets and packing slips must be print-ready (clean layout, no UI chrome).
10. **Audit everything** — every financial transaction, admin action, and status change must be logged with timestamp and user.

---

*PrintHub | printhub.africa | An Ezana Group Company | Built for Kenya, Built for the World*
