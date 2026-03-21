Add a complete Hardware & Equipment Sales division to the 
PrintHub Africa Next.js / Prisma platform.

This covers: 3D printers, large-format printers, standard 
printers, accessories, materials/consumables, and spare parts.

The existing print services (banners, 3D printing jobs etc.) 
remain completely unchanged. This is an additive expansion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DATABASE — ADD TO PRISMA SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADD these models to schema.prisma:

model HardwareCategory {
  id          String              @id @default(cuid())
  name        String              // e.g. "3D Printers"
  slug        String              @unique
  description String?
  imageUrl    String?
  parentId    String?
  parent      HardwareCategory?   @relation("SubCategories", fields: [parentId], references: [id])
  children    HardwareCategory[]  @relation("SubCategories")
  products    HardwareProduct[]
  sortOrder   Int                 @default(0)
  isActive    Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model Supplier {
  id              String            @id @default(cuid())
  name            String
  slug            String            @unique
  type            SupplierType      // MANUFACTURER | DISTRIBUTOR | IMPORTER | DEALER
  country         String?
  contactName     String?
  contactEmail    String?
  contactPhone    String?
  website         String?
  apiType         SupplierApiType?  // REST | EDI | FTP | NONE
  apiEndpoint     String?
  apiKeyEncrypted String?           // encrypted — never plaintext
  apiNotes        String?           // e.g. "Send auth header as X-API-Key"
  importTemplate  Json?             // saved column mapping for Excel imports
  leadTimeDays    Int?              // typical delivery lead time
  paymentTerms    String?           // e.g. "Net 30", "Proforma"
  notes           String?           // internal notes
  isActive        Boolean           @default(true)
  isAuthorised    Boolean           @default(false) // authorised reseller
  dealerAgreementUrl String?        // R2 link to signed agreement
  products        HardwareProduct[]
  importLogs      SupplierImportLog[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model HardwareProduct {
  id                String              @id @default(cuid())
  categoryId        String
  category          HardwareCategory    @relation(fields: [categoryId], references: [id])
  supplierId        String?
  supplier          Supplier?           @relation(fields: [supplierId], references: [id])
  
  // Identity
  name              String
  slug              String              @unique
  sku               String?             @unique
  barcode           String?             // EAN/UPC
  mpn               String?             // manufacturer part number
  brand             String?
  model             String?
  
  // Content
  shortDescription  String?
  description       String?             @db.Text
  specifications    Json?               // flexible key-value specs
  imageUrls         String[]
  thumbnailUrl      String?
  videoUrl          String?
  brochureUrl       String?             // R2 link to PDF datasheet
  
  // Pricing
  costPrice         Decimal?            @db.Decimal(12,2) // what we pay supplier
  retailPrice       Decimal             @db.Decimal(12,2) // what customer pays
  salePrice         Decimal?            @db.Decimal(12,2) // discounted price
  vatIncluded       Boolean             @default(true)
  currency          String              @default("KES")
  
  // Inventory
  stockQty          Int                 @default(0)
  reservedQty       Int                 @default(0) // in active carts/orders
  reorderPoint      Int                 @default(1) // alert when stock <= this
  reorderQty        Int                 @default(1) // suggested reorder amount
  warehouseLocation String?             // shelf/bin reference
  
  // Shipping & physical
  weightKg          Decimal?            @db.Decimal(8,2)
  dimensionsCm      Json?               // { l, w, h }
  requiresFreight   Boolean             @default(false) // heavy items
  installationAvailable Boolean         @default(false)
  installationPriceKES Decimal?         @db.Decimal(10,2)
  
  // Warranty
  warrantyMonths    Int?
  warrantyProvider  String?             // "Manufacturer" | "PrintHub Africa"
  warrantyNotes     String?
  
  // Sales options
  allowDeposit      Boolean             @default(false)
  depositPercent    Decimal?            @db.Decimal(5,2) // e.g. 30.00 for 30%
  allowInstalment   Boolean             @default(false)
  instalmentNote    String?             // e.g. "3–12 months via bank financing"
  allowBookDemo     Boolean             @default(false)
  demoNote          String?
  
  // Meta
  tags              String[]
  isFeatured        Boolean             @default(false)
  isActive          Boolean             @default(true)
  publishedAt       DateTime?
  status            HardwareProductStatus @default(DRAFT)
  
  // Relations
  variants          HardwareVariant[]
  bundles           HardwareBundleItem[]
  stockMovements    StockMovement[]
  warrantyRecords   WarrantyRecord[]
  orderItems        HardwareOrderItem[]
  importSource      SupplierImportLog?  @relation(fields: [importLogId], references: [id])
  importLogId       String?
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}

model HardwareVariant {
  id            String          @id @default(cuid())
  productId     String
  product       HardwareProduct @relation(fields: [productId], references: [id])
  name          String          // e.g. "220V / With Installation"
  sku           String?         @unique
  priceDiff     Decimal         @default(0) @db.Decimal(10,2)
  stockQty      Int             @default(0)
  attributes    Json            // e.g. { voltage: "220V", warranty: "extended" }
  isActive      Boolean         @default(true)
}

model HardwareBundle {
  id            String              @id @default(cuid())
  name          String
  slug          String              @unique
  description   String?
  imageUrl      String?
  retailPrice   Decimal             @db.Decimal(12,2)
  isActive      Boolean             @default(true)
  items         HardwareBundleItem[]
  createdAt     DateTime            @default(now())
}

model HardwareBundleItem {
  id         String          @id @default(cuid())
  bundleId   String
  bundle     HardwareBundle  @relation(fields: [bundleId], references: [id])
  productId  String
  product    HardwareProduct @relation(fields: [productId], references: [id])
  qty        Int             @default(1)
}

model StockMovement {
  id          String          @id @default(cuid())
  productId   String
  product     HardwareProduct @relation(fields: [productId], references: [id])
  type        StockMovementType // IN | OUT | RESERVED | UNRESERVED | ADJUSTMENT
  qty         Int
  reason      String?         // "Purchase order", "Sale", "Return", "Damaged"
  reference   String?         // PO number, order ID etc.
  performedBy String          // admin user id
  notes       String?
  createdAt   DateTime        @default(now())
}

model WarrantyRecord {
  id              String          @id @default(cuid())
  productId       String
  product         HardwareProduct @relation(fields: [productId], references: [id])
  orderId         String?         // linked to the sale order
  customerId      String          // who bought it
  serialNumber    String?
  purchaseDate    DateTime
  warrantyEndsAt  DateTime
  status          WarrantyStatus  @default(ACTIVE)
  claimHistory    Json?           // array of claim events
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model DemoBooking {
  id          String        @id @default(cuid())
  productId   String
  customerId  String?       // if logged in
  name        String
  email       String
  phone       String
  company     String?
  preferredDate DateTime
  notes       String?
  status      DemoStatus    @default(PENDING) // PENDING | CONFIRMED | COMPLETED | CANCELLED
  assignedTo  String?       // staff user id
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model SupplierImportLog {
  id            String        @id @default(cuid())
  supplierId    String
  supplier      Supplier      @relation(fields: [supplierId], references: [id])
  method        ImportMethod  // EXCEL | CSV | API | MANUAL
  fileName      String?
  totalRows     Int           @default(0)
  imported      Int           @default(0)
  updated       Int           @default(0)
  skipped       Int           @default(0)
  errors        Json?         // array of { row, error } 
  columnMapping Json?         // the mapping used for this import
  triggeredBy   String        // admin user id
  createdAt     DateTime      @default(now())
  products      HardwareProduct[]
}

// Enums to add:
enum SupplierType {
  MANUFACTURER
  DISTRIBUTOR
  IMPORTER
  DEALER
}

enum SupplierApiType {
  REST
  EDI
  FTP_CSV
  FTP_XML
  NONE
}

enum HardwareProductStatus {
  DRAFT
  ACTIVE
  OUT_OF_STOCK
  DISCONTINUED
  COMING_SOON
}

enum StockMovementType {
  IN
  OUT
  RESERVED
  UNRESERVED
  ADJUSTMENT
  RETURN
  DAMAGED
}

enum WarrantyStatus {
  ACTIVE
  EXPIRED
  CLAIMED
  VOID
}

enum DemoStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum ImportMethod {
  EXCEL
  CSV
  API
  MANUAL
}

After schema changes run:
  npx prisma migrate dev --name add_hardware_equipment_store

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. HARDWARE CATEGORIES — SEED DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to prisma/seed.ts — create these hardware categories:

  Top-level categories:
    3D Printers
      ↳ FDM Printers
      ↳ Resin (SLA/MSLA) Printers
      ↳ 3D Printer Accessories
      ↳ Filaments & Resins
      ↳ 3D Printer Spare Parts
    
    Large-Format Printers
      ↳ Eco-Solvent Printers
      ↳ UV Flatbed Printers
      ↳ Sublimation Printers
      ↳ Large-Format Accessories
      ↳ Inks & Media
      ↳ Spare Parts & Maintenance
    
    Standard & Office Printers
      ↳ Laser Printers
      ↳ Inkjet Printers
      ↳ Label Printers
      ↳ Printer Accessories
      ↳ Ink & Toner
    
    Cutting & Finishing
      ↳ Vinyl Cutters & Plotters
      ↳ Laminators
      ↳ Heat Press Machines
      ↳ Accessories
    
    Consumables & Materials
      ↳ Vinyl & Substrates
      ↳ Transfer Paper
      ↳ Lamination Film
      ↳ Cleaning & Maintenance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CUSTOMER-FACING HARDWARE STOREFRONT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE these public routes under app/(public)/store/:

  /store                    — Hardware store homepage
  /store/[category]         — Category page with filters
  /store/[category]/[slug]  — Product detail page
  /store/bundles            — Bundle deals page
  /store/search             — Search results
  /store/brands/[brand]     — All products by brand
  /store/demo               — Book a demo landing page

STORE HOMEPAGE /store:
  - Hero banner: "PrintHub Equipment Store"
    "Buy the machines behind our prints"
  - Featured categories grid (the 5 top-level categories)
  - Featured/promoted products carousel
  - Bundle deals section
  - "Become a reseller" CTA banner
  - Trust signals: Warranty, Support, Installation, Financing

CATEGORY PAGE /store/[category]:
  - Product grid (3 cols desktop, 2 tablet, 1 mobile)
  - Left sidebar filters:
      Brand (checkbox list)
      Price range (slider — KES)
      In Stock Only (toggle)
      Features (dynamic from product specs)
  - Sort: Featured | Price low-high | Price high-low | 
    Newest | Best selling
  - Sub-category tabs at top if category has children
  - Pagination

PRODUCT DETAIL PAGE /store/[category]/[slug]:

  Layout: Image gallery left, product info right (desktop)

  IMAGE GALLERY:
  - Main image with zoom on hover
  - Thumbnail strip below
  - Video embed if videoUrl is set

  PRODUCT INFO:
  - Brand + Model name
  - SKU / MPN for B2B buyers
  - Price: retailPrice (strike through salePrice if set)
  - Stock status:
      In Stock (green) | Low Stock — X left (amber) |
      Out of Stock (red) | Pre-order | Coming Soon
  - Variant selector if variants exist
    (e.g. dropdown for voltage, warranty tier)

  ADD TO CART section:
  - Quantity selector (max = available stock)
  - [Add to Cart] button
    Adds to the SHARED cart that already handles
    print service items — unified checkout.
  - If requiresFreight: show note:
    "This item requires freight delivery. 
     Shipping cost will be calculated at checkout
     based on your location."
  - If allowDeposit: show option:
    "Pay deposit only (KES X — 30%)" as alternative
    to full payment. Selecting this adds a 
    deposit line item to the cart.
  - If allowBookDemo: show secondary button:
    [Book a Free Demo] → /store/demo?product={id}
  - If installationAvailable: show checkbox:
    "Add professional installation (+KES X)"

  TABS below main section:
  - Description (full HTML/markdown)
  - Specifications (rendered from specs JSON as a table)
  - In the Box (what's included)
  - Warranty & Support
  - Downloads (brochure PDF link, driver links if any)
  - Reviews (use existing review system)

  WARRANTY BLOCK:
  - "X months warranty"
  - "Provided by: [warrantyProvider]"
  - "Register your warranty after purchase in your account"

  RELATED PRODUCTS:
  - Same category, same brand
  - "Frequently bought together" if bundle includes this product

  DEMO BOOKING — if allowBookDemo:
  - Inline form (not a separate page for simple products):
    Name, Email, Phone, Company (optional)
    Preferred date (date picker — business days only)
    Notes
    Submit → creates DemoBooking record
    Confirmation email to customer + notification to sales staff

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. UNIFIED CART & CHECKOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The existing cart (Zustand + DB Cart model) handles 
print service items. Extend it to handle hardware items
in the same cart without breaking existing behaviour.

UPDATE the Cart / CartItem model in Prisma:
  Add to CartItem:
    itemType        CartItemType  @default(PRINT_SERVICE)
    hardwareProductId String?
    hardwareVariantId String?
    hardwareProduct HardwareProduct? @relation(...)
    addInstallation Boolean       @default(false)
    isDeposit       Boolean       @default(false)
    depositAmount   Decimal?      @db.Decimal(10,2)

  enum CartItemType {
    PRINT_SERVICE    // existing items
    HARDWARE         // new equipment/product items
    HARDWARE_DEPOSIT // deposit for hardware
    BUNDLE           // hardware bundle
  }

UPDATE the Zustand cart store to handle both item types.
The cart UI must display both types clearly:
  - Print service items grouped under "Print Services"
  - Hardware items grouped under "Equipment & Products"
  - One combined subtotal
  - One combined VAT line (16%)
  - Shipping: show TWO lines if cart has both types:
      "Print delivery: KES X"
      "Equipment freight: Calculated at checkout" 
       (if any hardware requiresFreight)

CHECKOUT FLOW UPDATES:
  The existing checkout handles print services fine.
  Add these additional steps when cart contains hardware:

  STEP — Freight shipping (only if hardware in cart):
    If any hardware item has requiresFreight = true:
      Show a shipping quote form:
      Customer enters delivery location (county/town)
      System returns a freight estimate:
      Use a simple rate table stored in the database
      (admin configures county → freight rate KES)
      Admin can also set "Contact us for freight quote"
      for very remote locations
    
    If all hardware items are small (requiresFreight = false):
      Use existing courier shipping rates

  STEP — Installation (only if hardware in cart 
    and installationAvailable = true):
    Checkbox: "Add installation service at my premises"
    Show installation price per product
    Ask for installation address if different from delivery
    Installation creates a separate ServiceBooking record

  STEP — Deposit option (only if allowDeposit = true):
    If customer selects deposit payment:
      Order is created with status DEPOSIT_PAID
      Remaining balance stored as outstandingBalance
      Balance due before dispatch
      Admin notified to confirm stock and arrange delivery

  Payment methods remain the same (M-Pesa, card, etc.)
  Corporate accounts can use PO for hardware orders too.

ORDER CONFIRMATION:
  If order contains hardware:
    Show estimated delivery: X–Y business days
    Show warranty registration reminder
    Show: "Our team will contact you within 24 hours 
    to confirm delivery arrangements for your equipment."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. SUPPLIER IMPORT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE /admin/hardware/suppliers — Supplier management

  LIST PAGE:
    Table of all suppliers with:
    Name | Type | Country | Products | Last Import | Status
    [Add Supplier] button

  SUPPLIER DETAIL PAGE /admin/hardware/suppliers/[id]:
    Edit all supplier fields
    View import history
    Configure API integration
    Upload dealer agreement to R2
    [Import Products] button

CREATE /admin/hardware/import — Product import centre

  TAB 1 — EXCEL / CSV IMPORT (most common in Kenya):
  
    This is the primary import method. 
    Implement it as a 4-step wizard:

    STEP 1 — Upload file:
      Drag-and-drop or click to upload .xlsx or .csv
      Select supplier from dropdown (or "New supplier")
      File is parsed server-side using the 
      'xlsx' (SheetJS) package — already in the stack
      Show preview: first 5 rows of the file
      Show detected columns: [Column A, Column B, ...]

    STEP 2 — Map columns:
      For each required field, show a dropdown of 
      the file's column headers:
      
      Required mappings:
        Product Name        → [select column]
        SKU / Part Number   → [select column] or "Generate"
        Retail Price (KES)  → [select column]
      
      Optional mappings:
        Brand               → [select column] or "Use supplier name"
        Model               → [select column]
        Description         → [select column]
        Stock Qty           → [select column]
        Cost Price          → [select column]
        Barcode/EAN         → [select column]
        Category            → [select column]
        Weight (kg)         → [select column]
        Warranty (months)   → [select column]
        Image URL           → [select column]
        MPN                 → [select column]
      
      "Save this mapping for future imports from 
       [supplier name]" checkbox — saves to 
       supplier.importTemplate in DB.
      
      If supplier has a saved mapping: auto-apply it 
      and show "Using saved mapping — [edit]"

    STEP 3 — Review & validate:
      Show a table of all rows with validation status:
        Green row: ready to import
        Yellow row: missing optional fields (importable)
        Red row: missing required fields or invalid data
      
      Validation checks:
        Price must be a positive number
        SKU must be unique (warn if exists — offer update)
        Required fields not empty
      
      Summary: "X products ready | Y warnings | Z errors"
      "Skip error rows" toggle
      
      For each existing SKU found: 
        Show: "This SKU already exists — Update or Skip?"
        Default: Update (overwrite price, description, stock)
        Alternative: Skip (keep existing, do not overwrite)

    STEP 4 — Import:
      Progress bar as rows are processed
      On complete: show summary
      "X products imported | Y updated | Z skipped | W errors"
      Download error report as CSV
      Link to view imported products

  TAB 2 — API IMPORT (Thingiverse-style for suppliers):

    Only shown for suppliers with apiType != NONE
    
    For REST API suppliers:
      Search field + Fetch button
      Results grid with checkboxes
      "Import selected" button
      
    For FTP_CSV suppliers (some major distributors):
      "Fetch latest price list from FTP" button
      Then runs same column mapping + validation 
      flow as Excel import
      Can be scheduled as a cron job:
        /api/cron/supplier-sync — secured with CRON_SECRET
        Runs daily for suppliers with FTP configured
        Creates draft products (status DRAFT) not live ones
        Sends admin email: "X new products from [supplier] 
        ready for review"

  TAB 3 — MANUAL ENTRY:
    
    Full product form — all fields
    For when a supplier sends a PDF catalogue or 
    the admin wants to add a single product manually
    This is the same form used to edit products

  TAB 4 — IMPORT HISTORY:
  
    Table of all SupplierImportLog records
    Columns: Date | Supplier | Method | File | 
    Imported | Updated | Skipped | Errors | By
    Click row to see details and error list
    Re-run import button (uses same file and mapping)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. ADMIN HARDWARE MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE these admin routes:

  /admin/hardware                    — Hardware dashboard
  /admin/hardware/products           — Product list
  /admin/hardware/products/new       — Add product manually
  /admin/hardware/products/[id]      — Edit product
  /admin/hardware/categories         — Category management
  /admin/hardware/suppliers          — Supplier management
  /admin/hardware/suppliers/[id]     — Supplier detail
  /admin/hardware/import             — Import centre (above)
  /admin/hardware/inventory          — Stock management
  /admin/hardware/bundles            — Bundle management
  /admin/hardware/warranty           — Warranty records
  /admin/hardware/demos              — Demo booking management
  /admin/hardware/freight            — Freight rate configuration

HARDWARE DASHBOARD /admin/hardware:
  Stat cards:
    Total active products
    Low stock alerts (products at or below reorderPoint)
    Out of stock count
    Pending demo bookings
    Hardware orders this month (KES)
    Pending warranty claims
  
  Quick actions:
    [Import Products] [Add Product] [View Low Stock] 
    [View Demo Bookings]
  
  Recent hardware orders table
  Low stock alert list

PRODUCT LIST /admin/hardware/products:
  Table with: Thumbnail | Name | SKU | Category | 
  Brand | Price | Stock | Status | Actions
  Bulk actions: Activate | Deactivate | Delete | 
  Export to CSV | Update prices (+/- % or fixed amount)
  Filter: Category | Brand | Status | Stock level | Supplier
  Search: name, SKU, MPN, barcode

STOCK MANAGEMENT /admin/hardware/inventory:
  Table of all products with:
    Product | SKU | In Stock | Reserved | Available | 
    Reorder Point | Status
  
  Per row actions:
    [Adjust Stock] — opens modal:
      Type: IN (received stock) | OUT (manual removal) |
      ADJUSTMENT (correction) | DAMAGED
      Quantity
      Reference (e.g. PO number)
      Notes
      Creates StockMovement record
  
  Low stock filter button — shows only products 
  at or below reorderPoint
  
  Export stock report as Excel

FREIGHT RATE CONFIGURATION /admin/hardware/freight:
  Table of Kenya counties with freight rate per county
  Admin sets: County → Standard rate (KES) | 
  Freight rate (KES) | Notes
  "Contact for quote" toggle per county
  These rates are used in checkout freight calculation

WARRANTY MANAGEMENT /admin/hardware/warranty:
  List of all WarrantyRecord entries
  Filter: Active | Expired | Claimed
  Per record: view customer, product, serial number, 
  expiry date, claim history
  [Record Claim] button — logs a warranty claim event
  Export warranty report

DEMO BOOKINGS /admin/hardware/demos:
  Calendar view + list view of DemoBooking records
  Status pipeline: Pending → Confirmed → Completed
  Assign to staff member
  Add internal notes
  [Confirm] button sends confirmation email to customer
  [Mark Complete] with outcome notes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. WARRANTY SELF-SERVICE IN CUSTOMER ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to /account/warranties:

  List of customer's WarrantyRecord entries
  Each shows: Product | Serial Number | 
  Purchase Date | Warranty Expires | Status
  
  [Register Warranty] form:
    Order ID or proof of purchase
    Serial number (from machine label)
    Purchase date
    Submit → creates WarrantyRecord linked to customer
    Confirmation email with warranty certificate (PDF)
    
  [Request Service] button on active warranties:
    Opens a support ticket pre-tagged as WARRANTY_CLAIM
    Assigned to hardware support queue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. STOCK RESERVATION IN CART FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a customer adds a hardware product to cart:
  Check available stock = stockQty - reservedQty
  If available > 0:
    Increment reservedQty by cart quantity
    Create StockMovement type RESERVED
    Set a 30-minute reservation expiry on the cart item
  If available = 0:
    Do not add to cart
    Show: "Sorry, this item is out of stock."
    Offer: [Notify me when available] 
    → saves email to a waitlist

When cart is abandoned or item removed:
  Decrement reservedQty
  Create StockMovement type UNRESERVED

When order is confirmed and paid:
  Decrement stockQty by order quantity
  Create StockMovement type OUT with order reference

When order is cancelled/refunded:
  Increment stockQty
  Create StockMovement type RETURN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. LOW STOCK ALERTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to the existing cron system:
  /api/cron/stock-alerts — runs daily at 8am EAT

  Query all HardwareProduct where:
    stockQty <= reorderPoint AND isActive = true

  For each:
    Send email to admin/procurement staff:
    Subject: "Low stock alert — [product name]"
    Body: "Current stock: X units
           Reorder point: Y units
           Suggested reorder: Z units
           Supplier: [supplier name]
           [View product] [Create purchase order]"

  Also create an in-app notification visible 
  on the admin hardware dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. NAVIGATION UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE the main customer navigation:

  Current nav likely has: 
    Services | Shop | Catalogue | Corporate | About

  Add:
    Equipment Store (links to /store)
    Dropdown under Equipment Store:
      3D Printers
      Large-Format Printers
      Standard Printers
      Accessories & Materials
      Bundle Deals
      Book a Demo

UPDATE the admin sidebar navigation:
  Add a new section "Hardware & Equipment":
    Dashboard
    Products
    Categories
    Suppliers
    Import Products
    Inventory
    Bundles
    Warranty
    Demo Bookings
    Freight Rates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. THINGS NOT TO CHANGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Do not modify existing print services, 
  large-format booking, or 3D print job flows
- Do not modify existing Product model — 
  HardwareProduct is a completely separate model
- Do not modify existing Order model — 
  extend CartItem only, the order itself 
  handles both types through existing flow
- Do not modify existing checkout payment logic
- Do not modify existing auth system
- Do not modify existing customer account pages 
  except to ADD the warranty section
- TypeScript strict mode throughout
- All monetary values stored as Decimal, 
  never float
- All prices in KES unless currency field says otherwise