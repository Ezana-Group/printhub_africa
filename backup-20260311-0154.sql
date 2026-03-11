--
-- PostgreSQL database dump
--

\restrict VB9egeuRjEfbBbh2Ye4yeoLfZE83F7KrT95mfZV3OGv2CRVomGpz0SZDbJaO1lT

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 17.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO neon_auth;

--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'ACTIVE',
    'IDLE',
    'IN_MAINTENANCE',
    'AWAITING_PARTS',
    'RETIRED'
);


ALTER TYPE public."AssetStatus" OWNER TO neondb_owner;

--
-- Name: CouponType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CouponType" AS ENUM (
    'PERCENTAGE',
    'FIXED',
    'FREE_SHIPPING'
);


ALTER TYPE public."CouponType" OWNER TO neondb_owner;

--
-- Name: MaintenanceType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."MaintenanceType" AS ENUM (
    'SCHEDULED_SERVICE',
    'BREAKDOWN_REPAIR',
    'CLEANING',
    'CALIBRATION',
    'PART_REPLACEMENT',
    'FIRMWARE_UPDATE',
    'INSPECTION'
);


ALTER TYPE public."MaintenanceType" OWNER TO neondb_owner;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PRINTING',
    'QUALITY_CHECK',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO neondb_owner;

--
-- Name: OrderType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderType" AS ENUM (
    'SHOP',
    'CUSTOM_PRINT',
    'LARGE_FORMAT',
    'THREE_D_PRINT',
    'QUOTE'
);


ALTER TYPE public."OrderType" OWNER TO neondb_owner;

--
-- Name: PaymentProvider; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentProvider" AS ENUM (
    'MPESA',
    'PESAPAL',
    'FLUTTERWAVE',
    'STRIPE',
    'BANK_TRANSFER'
);


ALTER TYPE public."PaymentProvider" OWNER TO neondb_owner;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO neondb_owner;

--
-- Name: PaymentTerms; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentTerms" AS ENUM (
    'NET_30',
    'NET_60',
    'PREPAID'
);


ALTER TYPE public."PaymentTerms" OWNER TO neondb_owner;

--
-- Name: PreferredContact; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PreferredContact" AS ENUM (
    'email',
    'whatsapp',
    'phone'
);


ALTER TYPE public."PreferredContact" OWNER TO neondb_owner;

--
-- Name: PrintMaterialType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PrintMaterialType" AS ENUM (
    'PLA',
    'ABS',
    'PETG',
    'RESIN',
    'NYLON',
    'TPU'
);


ALTER TYPE public."PrintMaterialType" OWNER TO neondb_owner;

--
-- Name: PrintQuoteStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PrintQuoteStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'EXPIRED',
    'REJECTED'
);


ALTER TYPE public."PrintQuoteStatus" OWNER TO neondb_owner;

--
-- Name: PrinterType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PrinterType" AS ENUM (
    'LARGE_FORMAT',
    'FDM',
    'RESIN',
    'HYBRID'
);


ALTER TYPE public."PrinterType" OWNER TO neondb_owner;

--
-- Name: ProductType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ProductType" AS ENUM (
    'READYMADE_3D',
    'LARGE_FORMAT',
    'CUSTOM'
);


ALTER TYPE public."ProductType" OWNER TO neondb_owner;

--
-- Name: QuoteStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."QuoteStatus" AS ENUM (
    'new',
    'reviewing',
    'quoted',
    'accepted',
    'rejected',
    'in_production',
    'completed',
    'cancelled'
);


ALTER TYPE public."QuoteStatus" OWNER TO neondb_owner;

--
-- Name: QuoteType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."QuoteType" AS ENUM (
    'large_format',
    'three_d_print',
    'design_and_print'
);


ALTER TYPE public."QuoteType" OWNER TO neondb_owner;

--
-- Name: UploadedFileStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."UploadedFileStatus" AS ENUM (
    'UPLOADED',
    'REVIEWING',
    'APPROVED',
    'REJECTED',
    'PROCESSING'
);


ALTER TYPE public."UploadedFileStatus" OWNER TO neondb_owner;

--
-- Name: UploadedFileType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."UploadedFileType" AS ENUM (
    'STL',
    'OBJ',
    'FBX',
    'AI',
    'PDF',
    'PSD',
    'PNG',
    'JPEG',
    'SVG',
    'DXF',
    'DWG'
);


ALTER TYPE public."UploadedFileType" OWNER TO neondb_owner;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."UserRole" AS ENUM (
    'CUSTOMER',
    'STAFF',
    'ADMIN',
    'SUPER_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.account OWNER TO neon_auth;

--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


ALTER TABLE neon_auth.invitation OWNER TO neon_auth;

--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


ALTER TABLE neon_auth.jwks OWNER TO neon_auth;

--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.member OWNER TO neon_auth;

--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


ALTER TABLE neon_auth.organization OWNER TO neon_auth;

--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


ALTER TABLE neon_auth.project_config OWNER TO neon_auth;

--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


ALTER TABLE neon_auth.session OWNER TO neon_auth;

--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


ALTER TABLE neon_auth."user" OWNER TO neon_auth;

--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE neon_auth.verification OWNER TO neon_auth;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO neondb_owner;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    county text NOT NULL,
    "postalCode" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    lat double precision,
    lng double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Address" OWNER TO neondb_owner;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    before jsonb,
    after jsonb,
    "ipAddress" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO neondb_owner;

--
-- Name: BulkQuote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."BulkQuote" (
    id text NOT NULL,
    "corporateId" text NOT NULL,
    items jsonb NOT NULL,
    "totalEstimate" numeric(12,2),
    status text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "assignedTo" text
);


ALTER TABLE public."BulkQuote" OWNER TO neondb_owner;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    items jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO neondb_owner;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    "parentId" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "metaTitle" text,
    "metaDescription" text
);


ALTER TABLE public."Category" OWNER TO neondb_owner;

--
-- Name: CorporateAccount; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CorporateAccount" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyName" text NOT NULL,
    "kraPin" text,
    industry text,
    "creditLimit" numeric(12,2),
    "paymentTerms" public."PaymentTerms" DEFAULT 'PREPAID'::public."PaymentTerms",
    "isApproved" boolean DEFAULT false NOT NULL,
    "approvedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CorporateAccount" OWNER TO neondb_owner;

--
-- Name: Coupon; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Coupon" (
    id text NOT NULL,
    code text NOT NULL,
    type public."CouponType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "minOrderAmount" numeric(12,2),
    "maxUses" integer,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "applicableTo" text DEFAULT 'ALL'::text NOT NULL,
    "applicableIds" text[]
);


ALTER TABLE public."Coupon" OWNER TO neondb_owner;

--
-- Name: CouponUsage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CouponUsage" (
    id text NOT NULL,
    "couponId" text NOT NULL,
    "userId" text NOT NULL,
    "orderId" text NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CouponUsage" OWNER TO neondb_owner;

--
-- Name: DesignServiceOption; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DesignServiceOption" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "flatFee" numeric(10,2) DEFAULT 0 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."DesignServiceOption" OWNER TO neondb_owner;

--
-- Name: Inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Inventory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    "lowStockThreshold" integer DEFAULT 5 NOT NULL,
    location text,
    "unitCostKes" double precision,
    "productVariantId" text
);


ALTER TABLE public."Inventory" OWNER TO neondb_owner;

--
-- Name: InventoryHardwareItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."InventoryHardwareItem" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "priceKes" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    location text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "linkedPrinterId" text,
    "timeHours" double precision,
    "hardwareType" text,
    "printerSubType" text,
    model text,
    "maxPrintWidthM" double precision,
    "printSpeedSqmPerHour" double precision,
    "setupTimeHours" double precision,
    "lifespanHours" double precision,
    "annualMaintenanceKes" double precision,
    "powerWatts" double precision,
    "electricityRateKesKwh" double precision,
    "maintenancePerYearKes" double precision,
    "postProcessingTimeHours" double precision
);


ALTER TABLE public."InventoryHardwareItem" OWNER TO neondb_owner;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "paymentId" text,
    "invoiceNumber" text NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueAt" timestamp(3) without time zone,
    "pdfUrl" text,
    "vatAmount" numeric(12,2) NOT NULL,
    "totalAmount" numeric(12,2) NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO neondb_owner;

--
-- Name: LFBusinessSettings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."LFBusinessSettings" (
    id text NOT NULL,
    "labourRateKesPerHour" double precision DEFAULT 200 NOT NULL,
    "finishingTimeEyeletStd" double precision DEFAULT 0.1 NOT NULL,
    "finishingTimeEyeletHeavy" double precision DEFAULT 0.2 NOT NULL,
    "finishingTimeHemAll4" double precision DEFAULT 0.25 NOT NULL,
    "finishingTimeHemTop2" double precision DEFAULT 0.15 NOT NULL,
    "finishingTimePole" double precision DEFAULT 0.2 NOT NULL,
    "finishingTimeRope" double precision DEFAULT 0.1 NOT NULL,
    "monthlyRentKes" double precision NOT NULL,
    "monthlyUtilitiesKes" double precision NOT NULL,
    "monthlyInsuranceKes" double precision NOT NULL,
    "monthlyOtherKes" double precision NOT NULL,
    "workingDaysPerMonth" integer DEFAULT 26 NOT NULL,
    "workingHoursPerDay" integer DEFAULT 8 NOT NULL,
    "wastageBufferPercent" double precision DEFAULT 3 NOT NULL,
    "substrateWasteFactor" double precision DEFAULT 1.05 NOT NULL,
    "rigidSheetWasteFactor" double precision DEFAULT 1.1 NOT NULL,
    "defaultProfitMarginPct" double precision DEFAULT 40 NOT NULL,
    "vatRatePct" double precision DEFAULT 16 NOT NULL,
    "minOrderValueKes" double precision DEFAULT 500 NOT NULL,
    "updatedBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LFBusinessSettings" OWNER TO neondb_owner;

--
-- Name: LFPrinterSettings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."LFPrinterSettings" (
    id text NOT NULL,
    name text NOT NULL,
    model text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "maxPrintWidthM" double precision NOT NULL,
    "printSpeedSqmPerHour" double precision NOT NULL,
    "printSpeedHighQualSqmHr" double precision,
    "setupTimeHours" double precision DEFAULT 0.25 NOT NULL,
    "purchasePriceKes" double precision NOT NULL,
    "lifespanHours" double precision DEFAULT 20000 NOT NULL,
    "annualMaintenanceKes" double precision NOT NULL,
    "powerWatts" double precision NOT NULL,
    "electricityRateKesKwh" double precision DEFAULT 24 NOT NULL,
    "inkChannelSettings" jsonb,
    "updatedBy" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LFPrinterSettings" OWNER TO neondb_owner;

--
-- Name: LFStockItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."LFStockItem" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "unitType" text NOT NULL,
    "rollWidthM" double precision,
    "quantityOnHand" double precision DEFAULT 0 NOT NULL,
    "lowStockThreshold" double precision DEFAULT 0 NOT NULL,
    "costPerUnit" double precision DEFAULT 0 NOT NULL,
    "lastPurchasePriceKes" double precision,
    "averageCostKes" double precision DEFAULT 0 NOT NULL,
    "totalUnitsEverPurchased" double precision DEFAULT 0 NOT NULL,
    "totalCostEverPurchased" double precision DEFAULT 0 NOT NULL,
    "lastReceivedAt" timestamp(3) without time zone,
    "printerAssetId" text,
    "replacementIntervalHours" double precision,
    "lastReplacedAt" timestamp(3) without time zone,
    "nextReplacementDue" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LFStockItem" OWNER TO neondb_owner;

--
-- Name: LaminationType; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."LaminationType" (
    id text NOT NULL,
    slug text,
    name text NOT NULL,
    "pricePerSqm" numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public."LaminationType" OWNER TO neondb_owner;

--
-- Name: LargeFormatFinishing; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."LargeFormatFinishing" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "pricePerUnit" numeric(10,2) NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."LargeFormatFinishing" OWNER TO neondb_owner;

--
-- Name: Machine; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Machine" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'IDLE'::text NOT NULL,
    location text,
    "purchasePriceKes" double precision
);


ALTER TABLE public."Machine" OWNER TO neondb_owner;

--
-- Name: MachineType; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MachineType" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "ratePerHour" numeric(10,2) NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."MachineType" OWNER TO neondb_owner;

--
-- Name: MaintenanceLog; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MaintenanceLog" (
    id text NOT NULL,
    "printerAssetId" text NOT NULL,
    type public."MaintenanceType" NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "performedBy" text NOT NULL,
    "isExternal" boolean DEFAULT false NOT NULL,
    "technicianCompany" text,
    description text NOT NULL,
    "labourHours" double precision DEFAULT 0 NOT NULL,
    "labourCostKes" double precision DEFAULT 0 NOT NULL,
    "totalCostKes" double precision DEFAULT 0 NOT NULL,
    "nextServiceDate" timestamp(3) without time zone,
    "nextServiceHours" double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MaintenanceLog" OWNER TO neondb_owner;

--
-- Name: MaintenancePartUsed; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MaintenancePartUsed" (
    id text NOT NULL,
    "maintenanceLogId" text NOT NULL,
    "lfStockItemId" text,
    "quantityUsed" double precision NOT NULL,
    "unitCostKes" double precision NOT NULL,
    "totalCostKes" double precision NOT NULL
);


ALTER TABLE public."MaintenancePartUsed" OWNER TO neondb_owner;

--
-- Name: MpesaTransaction; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."MpesaTransaction" (
    id text NOT NULL,
    "paymentId" text NOT NULL,
    "phoneNumber" text NOT NULL,
    "merchantRequestId" text,
    "checkoutRequestId" text,
    "resultCode" text,
    "resultDesc" text,
    "mpesaReceiptNumber" text,
    "transactionDate" timestamp(3) without time zone,
    amount numeric(12,2)
);


ALTER TABLE public."MpesaTransaction" OWNER TO neondb_owner;

--
-- Name: Newsletter; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Newsletter" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "isSubscribed" boolean DEFAULT true NOT NULL,
    "subscribedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source text
);


ALTER TABLE public."Newsletter" OWNER TO neondb_owner;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO neondb_owner;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    type public."OrderType" NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    "shippingCost" numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    currency text DEFAULT 'KES'::text NOT NULL,
    notes text,
    "estimatedDelivery" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO neondb_owner;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text,
    quantity integer NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    customizations jsonb,
    "uploadedFileId" text,
    instructions text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "productVariantId" text
);


ALTER TABLE public."OrderItem" OWNER TO neondb_owner;

--
-- Name: OrderTimeline; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderTimeline" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    status text NOT NULL,
    message text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedBy" text
);


ALTER TABLE public."OrderTimeline" OWNER TO neondb_owner;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    provider public."PaymentProvider" NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'KES'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    reference text,
    "providerTransactionId" text,
    "providerResponse" jsonb,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO neondb_owner;

--
-- Name: PricingConfig; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PricingConfig" (
    id text NOT NULL,
    key text NOT NULL,
    "valueJson" text NOT NULL
);


ALTER TABLE public."PricingConfig" OWNER TO neondb_owner;

--
-- Name: PrintFinish; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PrintFinish" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "priceModifier" numeric(10,2) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."PrintFinish" OWNER TO neondb_owner;

--
-- Name: PrintMaterial; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PrintMaterial" (
    id text NOT NULL,
    slug text,
    name text NOT NULL,
    description text,
    type public."PrintMaterialType" NOT NULL,
    "colorOptions" text[],
    "pricePerGram" numeric(10,4) NOT NULL,
    density double precision,
    "minChargeGrams" integer,
    "leadTimeDays" integer DEFAULT 3 NOT NULL,
    image text,
    properties jsonb,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."PrintMaterial" OWNER TO neondb_owner;

--
-- Name: PrintQuote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PrintQuote" (
    id text NOT NULL,
    "uploadedFileId" text,
    "userId" text NOT NULL,
    material text,
    quantity integer DEFAULT 1 NOT NULL,
    dimensions jsonb,
    area double precision,
    "estimatedCost" numeric(12,2),
    "validUntil" timestamp(3) without time zone,
    status public."PrintQuoteStatus" DEFAULT 'DRAFT'::public."PrintQuoteStatus" NOT NULL,
    "staffNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PrintQuote" OWNER TO neondb_owner;

--
-- Name: PrinterAsset; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PrinterAsset" (
    id text NOT NULL,
    "assetTag" text NOT NULL,
    name text NOT NULL,
    manufacturer text,
    model text,
    "serialNumber" text,
    "printerType" public."PrinterType" NOT NULL,
    location text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "maxPrintWidthM" double precision,
    "buildVolumeX" double precision,
    "buildVolumeY" double precision,
    "buildVolumeZ" double precision,
    "powerWatts" double precision NOT NULL,
    "electricityRateKesKwh" double precision DEFAULT 24 NOT NULL,
    "productionSpeed" double precision NOT NULL,
    "highQualitySpeed" double precision,
    "setupTimeHours" double precision DEFAULT 0.25 NOT NULL,
    "postProcessingTimeHours" double precision,
    "compatibleMaterials" text[] DEFAULT ARRAY[]::text[],
    "purchasePriceKes" double precision NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    "supplierName" text,
    "expectedLifespanHours" double precision NOT NULL,
    "annualMaintenanceKes" double precision DEFAULT 0 NOT NULL,
    "warrantyExpiryDate" timestamp(3) without time zone,
    "insurancePolicyRef" text,
    "hoursUsedTotal" double precision DEFAULT 0 NOT NULL,
    "hoursUsedThisMonth" double precision DEFAULT 0 NOT NULL,
    status public."AssetStatus" DEFAULT 'ACTIVE'::public."AssetStatus" NOT NULL,
    "nextScheduledMaintDate" timestamp(3) without time zone,
    "maintenanceIntervalHours" double precision,
    "remainingLifespanHours" double precision,
    "depreciationPerHourKes" double precision,
    "maintenancePerHourKes" double precision
);


ALTER TABLE public."PrinterAsset" OWNER TO neondb_owner;

--
-- Name: PrintingMedium; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PrintingMedium" (
    id text NOT NULL,
    slug text,
    name text NOT NULL,
    "pricePerSqMeter" numeric(12,2) NOT NULL,
    "minWidth" double precision,
    "maxWidth" double precision,
    "minHeight" double precision,
    "maxHeight" double precision,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."PrintingMedium" OWNER TO neondb_owner;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "shortDescription" text,
    "categoryId" text NOT NULL,
    "productType" public."ProductType" NOT NULL,
    images text[],
    "basePrice" numeric(12,2) NOT NULL,
    "comparePrice" numeric(12,2),
    "costPrice" numeric(12,2),
    sku text,
    stock integer DEFAULT 0 NOT NULL,
    "lowStockThreshold" integer DEFAULT 0 NOT NULL,
    "minOrderQty" integer DEFAULT 1 NOT NULL,
    "maxOrderQty" integer,
    weight numeric(10,3),
    dimensions jsonb,
    materials text[],
    colors text[],
    finishes text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "metaTitle" text,
    "metaDescription" text,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO neondb_owner;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    "altText" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO neondb_owner;

--
-- Name: ProductReview; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductReview" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text NOT NULL,
    rating integer NOT NULL,
    title text,
    body text,
    images text[],
    "isVerified" boolean DEFAULT false NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "ProductReview_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public."ProductReview" OWNER TO neondb_owner;

--
-- Name: ProductVariant; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductVariant" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    sku text,
    price numeric(12,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    attributes jsonb NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductVariant" OWNER TO neondb_owner;

--
-- Name: ProductionQueue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProductionQueue" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "orderItemId" text NOT NULL,
    "assignedTo" text,
    status text NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "machineId" text,
    notes text
);


ALTER TABLE public."ProductionQueue" OWNER TO neondb_owner;

--
-- Name: Quote; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Quote" (
    id text NOT NULL,
    "quoteNumber" text NOT NULL,
    type public."QuoteType" NOT NULL,
    status public."QuoteStatus" DEFAULT 'new'::public."QuoteStatus" NOT NULL,
    "customerId" text,
    "assignedStaffId" text,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text,
    "preferredContact" public."PreferredContact" DEFAULT 'email'::public."PreferredContact" NOT NULL,
    "projectName" text,
    description text,
    "referenceFiles" text[],
    "referenceFilesMeta" jsonb,
    specifications jsonb,
    "budgetRange" text,
    deadline timestamp(3) without time zone,
    "quotedAmount" numeric(12,2),
    "quotedAt" timestamp(3) without time zone,
    "quoteBreakdown" text,
    "quoteValidityDays" integer,
    "quotePdfUrl" text,
    "acceptedAt" timestamp(3) without time zone,
    "rejectedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    notes text,
    "adminNotes" text,
    "referralSource" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Quote" OWNER TO neondb_owner;

--
-- Name: Refund; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Refund" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason text,
    status text NOT NULL,
    "processedBy" text,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Refund" OWNER TO neondb_owner;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO neondb_owner;

--
-- Name: ShippingAddress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ShippingAddress" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "fullName" text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    county text NOT NULL,
    "postalCode" text,
    "deliveryMethod" text,
    lat double precision,
    lng double precision
);


ALTER TABLE public."ShippingAddress" OWNER TO neondb_owner;

--
-- Name: ShopInventoryMovement; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ShopInventoryMovement" (
    id text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    reason text NOT NULL,
    reference text,
    "costPerUnit" numeric(12,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text
);


ALTER TABLE public."ShopInventoryMovement" OWNER TO neondb_owner;

--
-- Name: ShopPurchaseOrder; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ShopPurchaseOrder" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "supplierId" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "totalKes" numeric(12,2),
    "expectedDate" timestamp(3) without time zone,
    "receivedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShopPurchaseOrder" OWNER TO neondb_owner;

--
-- Name: ShopPurchaseOrderLine; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ShopPurchaseOrderLine" (
    id text NOT NULL,
    "shopPurchaseOrderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "unitCostKes" numeric(12,2) NOT NULL,
    "receivedQuantity" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ShopPurchaseOrderLine" OWNER TO neondb_owner;

--
-- Name: Staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Staff" (
    id text NOT NULL,
    "userId" text NOT NULL,
    department text,
    "position" text,
    permissions text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Staff" OWNER TO neondb_owner;

--
-- Name: SupportTicket; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SupportTicket" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "orderId" text,
    subject text NOT NULL,
    status text NOT NULL,
    priority text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportTicket" OWNER TO neondb_owner;

--
-- Name: ThreeDAddon; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ThreeDAddon" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "pricePerUnit" numeric(10,2) NOT NULL,
    category text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ThreeDAddon" OWNER TO neondb_owner;

--
-- Name: ThreeDConsumable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ThreeDConsumable" (
    id text NOT NULL,
    kind text NOT NULL,
    name text NOT NULL,
    specification text,
    quantity integer DEFAULT 0 NOT NULL,
    "lowStockThreshold" integer DEFAULT 2 NOT NULL,
    location text,
    "costPerKgKes" double precision,
    "unitCostKes" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ThreeDConsumable" OWNER TO neondb_owner;

--
-- Name: TicketMessage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."TicketMessage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "senderId" text,
    "senderType" text NOT NULL,
    message text NOT NULL,
    attachments text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketMessage" OWNER TO neondb_owner;

--
-- Name: TurnaroundOption; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."TurnaroundOption" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "surchargePercent" numeric(5,2) DEFAULT 0 NOT NULL,
    "serviceType" text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."TurnaroundOption" OWNER TO neondb_owner;

--
-- Name: UploadedFile; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."UploadedFile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "orderId" text,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    "thumbnailUrl" text,
    "fileType" public."UploadedFileType" NOT NULL,
    status public."UploadedFileStatus" DEFAULT 'UPLOADED'::public."UploadedFileStatus" NOT NULL,
    "reviewedBy" text,
    "reviewNotes" text,
    "printVolume" double precision,
    "printWeight" double precision,
    "printTime" double precision,
    dimensions jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UploadedFile" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    phone text,
    "passwordHash" text,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "profileImage" text,
    "loyaltyPoints" integer DEFAULT 0 NOT NULL,
    "preferredLanguage" text DEFAULT 'en'::text,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO neondb_owner;

--
-- Name: Wishlist; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Wishlist" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Wishlist" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
e42e0b2d-cef8-4b48-9b1c-d7e242599267	Printhub-vercel-db	ep-broad-mud-agxcwt2y	2026-03-10 17:04:23.849+00	2026-03-10 17:04:23.849+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Address" (id, "userId", label, street, city, county, "postalCode", "isDefault", lat, lng, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AuditLog" (id, "userId", action, entity, "entityId", before, after, "ipAddress", "timestamp") FROM stdin;
\.


--
-- Data for Name: BulkQuote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BulkQuote" (id, "corporateId", items, "totalEstimate", status, "expiresAt", "assignedTo") FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Cart" (id, "userId", "sessionId", items, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Category" (id, name, slug, description, image, "parentId", "sortOrder", "isActive", "metaTitle", "metaDescription") FROM stdin;
cmml6atku0007k8sm419ckt4u	Large Format Printing	large-format	Banners, signage, vehicle wraps, canvas, and more	\N	\N	1	t	\N	\N
cmml6au580008k8sm84uypnvb	3D Printing	3d-printing	Custom and ready-made 3D printed products	\N	\N	2	t	\N	\N
cmml6auoz0009k8smc0hf8rvn	3D Printed Merchandise	merchandise	Ready-made 3D printed items	\N	cmml6au580008k8sm84uypnvb	1	t	\N	\N
\.


--
-- Data for Name: CorporateAccount; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CorporateAccount" (id, "userId", "companyName", "kraPin", industry, "creditLimit", "paymentTerms", "isApproved", "approvedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Coupon; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Coupon" (id, code, type, value, "minOrderAmount", "maxUses", "usedCount", "startDate", "expiryDate", "isActive", "applicableTo", "applicableIds") FROM stdin;
cmml6b91j002ik8sm2b32fwwz	WELCOME10	PERCENTAGE	10.00	2000.00	100	0	2026-03-10 22:20:13.541	2027-03-10 22:20:13.541	t	ALL	{}
\.


--
-- Data for Name: CouponUsage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CouponUsage" (id, "couponId", "userId", "orderId", "usedAt") FROM stdin;
\.


--
-- Data for Name: DesignServiceOption; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DesignServiceOption" (id, code, name, "flatFee", "sortOrder", "isActive") FROM stdin;
cmml6b2yq001ck8sm4otqjtah	NONE	No design (customer provides file)	0.00	0	t
cmml6b32t001dk8smmv15j34e	DESIGN_MIN	Minor file adjustment	500.00	1	t
cmml6b36w001ek8smxngydsjj	DESIGN_BASIC	Template-based design	1500.00	2	t
cmml6b3b1001fk8sm31cpl490	DESIGN_STD	Custom design (standard)	3500.00	3	t
cmml6b3fe001gk8sm8hdwjaa9	DESIGN_COMP	Custom design (complex)	7500.00	4	t
cmml6b3jg001hk8smv5728vkx	DESIGN_VEC	Vector conversion	1200.00	5	t
\.


--
-- Data for Name: Inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Inventory" (id, "productId", quantity, "lowStockThreshold", location, "unitCostKes", "productVariantId") FROM stdin;
\.


--
-- Data for Name: InventoryHardwareItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."InventoryHardwareItem" (id, name, category, "priceKes", "isActive", "sortOrder", location, "createdAt", "updatedAt", "linkedPrinterId", "timeHours", "hardwareType", "printerSubType", model, "maxPrintWidthM", "printSpeedSqmPerHour", "setupTimeHours", "lifespanHours", "annualMaintenanceKes", "powerWatts", "electricityRateKesKwh", "maintenancePerYearKes", "postProcessingTimeHours") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Invoice" (id, "orderId", "paymentId", "invoiceNumber", "issuedAt", "dueAt", "pdfUrl", "vatAmount", "totalAmount") FROM stdin;
\.


--
-- Data for Name: LFBusinessSettings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LFBusinessSettings" (id, "labourRateKesPerHour", "finishingTimeEyeletStd", "finishingTimeEyeletHeavy", "finishingTimeHemAll4", "finishingTimeHemTop2", "finishingTimePole", "finishingTimeRope", "monthlyRentKes", "monthlyUtilitiesKes", "monthlyInsuranceKes", "monthlyOtherKes", "workingDaysPerMonth", "workingHoursPerDay", "wastageBufferPercent", "substrateWasteFactor", "rigidSheetWasteFactor", "defaultProfitMarginPct", "vatRatePct", "minOrderValueKes", "updatedBy", "updatedAt") FROM stdin;
cmml6b4wj001rk8sm6fe0fjjd	200	0.1	0.2	0.25	0.15	0.2	0.1	35000	8000	4000	3000	26	8	3	1.05	1.1	40	16	500	\N	2026-03-10 22:20:08.467
\.


--
-- Data for Name: LFPrinterSettings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LFPrinterSettings" (id, name, model, "isActive", "isDefault", "maxPrintWidthM", "printSpeedSqmPerHour", "printSpeedHighQualSqmHr", "setupTimeHours", "purchasePriceKes", "lifespanHours", "annualMaintenanceKes", "powerWatts", "electricityRateKesKwh", "inkChannelSettings", "updatedBy", "updatedAt", "createdAt") FROM stdin;
cmml6b4oi001qk8sm5t2z0hf4	Roland VG3-540	VG3-540	t	t	1.52	15	8	0.25	1200000	20000	120000	600	24	{"C": {"costKes": 2200, "bottleMl": 220, "sqmPerBottle": 15}, "K": {"costKes": 2200, "bottleMl": 220, "sqmPerBottle": 15}, "M": {"costKes": 2200, "bottleMl": 220, "sqmPerBottle": 15}, "Y": {"costKes": 2200, "bottleMl": 220, "sqmPerBottle": 15}}	\N	2026-03-10 22:20:08.177	2026-03-10 22:20:08.177
\.


--
-- Data for Name: LFStockItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LFStockItem" (id, code, name, category, "unitType", "rollWidthM", "quantityOnHand", "lowStockThreshold", "costPerUnit", "lastPurchasePriceKes", "averageCostKes", "totalUnitsEverPurchased", "totalCostEverPurchased", "lastReceivedAt", "printerAssetId", "replacementIntervalHours", "lastReplacedAt", "nextReplacementDue", "createdAt", "updatedAt") FROM stdin;
cmml6b5cw001uk8smthic4htz	VINYL_OUTDOOR_152	Outdoor Vinyl (Calendared) 1.52m	SUBSTRATE_ROLL	ROLL_LM	1.52	50	10	178.5	\N	178.5	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.056	2026-03-10 22:20:09.056
cmml6b5h3001vk8sm8t5yluvr	VINYL_INDOOR_152	Indoor Vinyl 1.52m	SUBSTRATE_ROLL	ROLL_LM	1.52	40	10	120	\N	120	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.207	2026-03-10 22:20:09.207
cmml6b5l7001wk8sm981srq0e	LAM_GLOSS	Gloss Lamination Film	LAMINATION	ROLL_LM	1.52	30	5	90	\N	90	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.355	2026-03-10 22:20:09.355
cmml6b5p7001xk8smujcklm6z	LAM_MATTE	Matte Lamination Film	LAMINATION	ROLL_LM	1.52	25	5	95	\N	95	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.499	2026-03-10 22:20:09.499
cmml6b5t8001yk8smtrrxdpfz	EYELET_STD	Eyelets (silver 40mm)	FINISHING	UNIT	\N	500	100	3.5	\N	3.5	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.644	2026-03-10 22:20:09.644
cmml6b5x9001zk8sm9j9pg88d	HEM_TAPE	Hemming tape	FINISHING	ROLL_LM	\N	100	20	12	\N	12	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.789	2026-03-10 22:20:09.789
cmml6b61a0020k8smpwtmav3b	ROPE	Rope / bungee	FINISHING	ROLL_LM	\N	50	10	8	\N	8	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:09.934	2026-03-10 22:20:09.934
cmml6b65a0021k8smw2qy0hxf	POLE_POCKET	Pole pocket webbing	FINISHING	ROLL_LM	\N	30	5	50	\N	50	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:10.078	2026-03-10 22:20:10.078
cmml6b69k0022k8smqvl8f07u	PACKAGING_TUBE	Cardboard tube (packaging)	FINISHING	UNIT	\N	0	0	100	\N	100	0	0	\N	\N	\N	\N	\N	2026-03-10 22:20:10.232	2026-03-10 22:20:10.232
\.


--
-- Data for Name: LaminationType; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LaminationType" (id, slug, name, "pricePerSqm") FROM stdin;
cmml6b0xq000xk8sm9zyr17ba	NONE	None	0.00
cmml6b165000yk8sm9waht203	LAM_GLOSS	Gloss Lamination	300.00
cmml6b1e5000zk8smypk3jpc9	LAM_MATTE	Matte Lamination	350.00
cmml6b1m40010k8sm63i3axt6	LAM_ASCRATCH	Anti-scratch Matte	500.00
\.


--
-- Data for Name: LargeFormatFinishing; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LargeFormatFinishing" (id, code, name, "pricePerUnit", "sortOrder", "isActive") FROM stdin;
cmml6b1q90011k8smupbrv1dh	NONE	No finishing	0.00	0	t
cmml6b1ug0012k8smlvww4ew5	EYELET_STD	Eyelets (every 50cm)	150.00	1	t
cmml6b1yl0013k8smrxhe58k9	EYELET_HD	Eyelets heavy duty (every 30cm)	250.00	2	t
cmml6b22k0014k8smg24tw0af	HEM_4	Hemming (all 4 sides)	200.00	3	t
cmml6b26l0015k8sm14fryc5d	HEM_2	Hemming (top & bottom)	120.00	4	t
cmml6b2ak0016k8sms4qd72i7	POLE_PKT	Pole pockets (top & bottom)	250.00	5	t
cmml6b2ej0017k8sm0hrymqef	POLE_TOP	Pole pocket (top only)	150.00	6	t
cmml6b2ik0018k8sm5yudsyqy	ROPE	Rope / bungee (set of 4)	100.00	7	t
cmml6b2ml0019k8sma3ed3j7o	BATTEN	Wooden batten (top & bottom)	350.00	8	t
cmml6b2qq001ak8smgmavqk1z	ROLLUP	Roll-up cassette	800.00	9	t
cmml6b2up001bk8smj1z5jh2o	GR_ROPE	Grommets + rope combo	200.00	10	t
\.


--
-- Data for Name: Machine; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Machine" (id, name, type, status, location, "purchasePriceKes") FROM stdin;
\.


--
-- Data for Name: MachineType; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MachineType" (id, code, name, "ratePerHour", "sortOrder", "isActive") FROM stdin;
cmml6b6dm0023k8smcpbqrsvi	FDM_STD	FDM (standard)	200.00	0	t
cmml6b6hn0024k8smvxknwelp	FDM_LG	FDM (large format)	300.00	1	t
cmml6b6ll0025k8sm7ttnegch	RESIN	Resin (MSLA)	350.00	2	t
cmml6b6pl0026k8sml13gzajo	FDM_MM	Multi-material FDM	400.00	3	t
\.


--
-- Data for Name: MaintenanceLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MaintenanceLog" (id, "printerAssetId", type, date, "performedBy", "isExternal", "technicianCompany", description, "labourHours", "labourCostKes", "totalCostKes", "nextServiceDate", "nextServiceHours", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: MaintenancePartUsed; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MaintenancePartUsed" (id, "maintenanceLogId", "lfStockItemId", "quantityUsed", "unitCostKes", "totalCostKes") FROM stdin;
\.


--
-- Data for Name: MpesaTransaction; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MpesaTransaction" (id, "paymentId", "phoneNumber", "merchantRequestId", "checkoutRequestId", "resultCode", "resultDesc", "mpesaReceiptNumber", "transactionDate", amount) FROM stdin;
\.


--
-- Data for Name: Newsletter; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Newsletter" (id, email, name, "isSubscribed", "subscribedAt", source) FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Notification" (id, "userId", type, title, message, "isRead", link, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Order" (id, "orderNumber", "userId", status, type, subtotal, tax, "shippingCost", discount, total, currency, notes, "estimatedDelivery", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, "unitPrice", customizations, "uploadedFileId", instructions, "createdAt", "productVariantId") FROM stdin;
\.


--
-- Data for Name: OrderTimeline; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderTimeline" (id, "orderId", status, message, "timestamp", "updatedBy") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Payment" (id, "orderId", provider, amount, currency, status, reference, "providerTransactionId", "providerResponse", "paidAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: PricingConfig; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PricingConfig" (id, key, "valueJson") FROM stdin;
cmml6b443001mk8smigb3bul8	vatRate	0.16
cmml6b485001nk8sm3u07za7x	minOrderLargeFormat	500
cmml6b4c7001ok8sme4usbqqi	minOrder3D	800
cmml6b4g7001pk8smynbje16r	minAreaSqmLargeFormat	0.5
\.


--
-- Data for Name: PrintFinish; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PrintFinish" (id, name, description, "priceModifier", "isActive") FROM stdin;
\.


--
-- Data for Name: PrintMaterial; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PrintMaterial" (id, slug, name, description, type, "colorOptions", "pricePerGram", density, "minChargeGrams", "leadTimeDays", image, properties, "sortOrder", "isActive") FROM stdin;
cmml6aw8k000ck8sm8aybyziq	PLA_STD	PLA (Standard)	\N	PLA	{Black,White,Grey,Orange,Blue,Red}	0.1500	1.24	10	3	\N	\N	0	t
cmml6awgq000dk8smn6yzi4pz	PLA_PLUS	PLA+ (Enhanced)	\N	PLA	{Black,White,Grey,Orange,Blue,Red}	0.1800	1.24	10	3	\N	\N	1	t
cmml6awos000ek8smqnvvflkz	PETG	PETG	\N	PETG	{Black,White,Grey,Orange,Blue,Red}	0.2000	1.27	10	3	\N	\N	2	t
cmml6awwv000fk8smkf8a5zz0	ABS	ABS	\N	ABS	{Black,White,Grey,Orange,Blue,Red}	0.1800	1.05	10	3	\N	\N	3	t
cmml6ax52000gk8sm4m5jbbnr	TPU	TPU (Flexible)	\N	TPU	{Black,White,Grey,Orange,Blue,Red}	0.3500	1.2	10	3	\N	\N	4	t
cmml6axd3000hk8sm1z4lel1p	RESIN_STD	Resin (Standard)	\N	RESIN	{Black,White,Grey,Orange,Blue,Red}	0.4500	1.1	5	3	\N	\N	5	t
\.


--
-- Data for Name: PrintQuote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PrintQuote" (id, "uploadedFileId", "userId", material, quantity, dimensions, area, "estimatedCost", "validUntil", status, "staffNotes", "createdAt") FROM stdin;
\.


--
-- Data for Name: PrinterAsset; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PrinterAsset" (id, "assetTag", name, manufacturer, model, "serialNumber", "printerType", location, notes, "isActive", "isDefault", "createdAt", "updatedAt", "maxPrintWidthM", "buildVolumeX", "buildVolumeY", "buildVolumeZ", "powerWatts", "electricityRateKesKwh", "productionSpeed", "highQualitySpeed", "setupTimeHours", "postProcessingTimeHours", "compatibleMaterials", "purchasePriceKes", "purchaseDate", "supplierName", "expectedLifespanHours", "annualMaintenanceKes", "warrantyExpiryDate", "insurancePolicyRef", "hoursUsedTotal", "hoursUsedThisMonth", status, "nextScheduledMaintDate", "maintenanceIntervalHours", "remainingLifespanHours", "depreciationPerHourKes", "maintenancePerHourKes") FROM stdin;
cmml6b54p001sk8smet7wtn6m	ASSET-LF-001	Roland VG3-540 (default)	Roland	VG3-540	\N	LARGE_FORMAT	Workshop	\N	t	t	2026-03-10 22:20:08.761	2026-03-10 22:20:08.761	1.52	\N	\N	\N	600	24	15	8	0.25	\N	{}	1200000	\N	\N	20000	120000	\N	\N	0	0	ACTIVE	\N	\N	20000	60	48.07692307692308
cmml6b58v001tk8smsunivew3	ASSET-3D-001	FDM Printer (default)	\N	\N	\N	FDM	Workshop	\N	t	f	2026-03-10 22:20:08.911	2026-03-10 22:20:08.911	\N	220	220	250	350	24	18	\N	0.25	0.5	{PLA,PETG,ABS}	180000	\N	\N	5000	24000	\N	\N	0	0	ACTIVE	\N	\N	5000	36	9.615384615384615
\.


--
-- Data for Name: PrintingMedium; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PrintingMedium" (id, slug, name, "pricePerSqMeter", "minWidth", "maxWidth", "minHeight", "maxHeight", description, "sortOrder", "isActive") FROM stdin;
cmml6axl1000ik8sml764gqcm	VINYL_IN	Standard Vinyl (Indoor)	800.00	30	320	\N	\N	\N	1	t
cmml6axtl000jk8sm36c6xgjv	VINYL_OUT	Standard Vinyl (Outdoor)	950.00	30	320	\N	\N	\N	2	t
cmml6ay1i000kk8smd3clzwfb	BACKLIT	Backlit Film	1400.00	30	320	\N	\N	\N	3	t
cmml6ay9e000lk8sm1l0bp4zh	PERF	One-Way Vision / Perforated Vinyl	1600.00	50	320	\N	\N	\N	4	t
cmml6ayha000mk8smze5s7o0u	MESH	Mesh Banner	1100.00	50	500	\N	\N	\N	5	t
cmml6ayp9000nk8smkbt74txw	CANVAS	Canvas (Matte)	1800.00	30	320	\N	\N	\N	6	t
cmml6ayxd000ok8sm9qgoet5z	FABRIC	Fabric / Textile	2200.00	50	320	\N	\N	\N	7	t
cmml6az5l000pk8smqtzphu4p	FLEX_STD	Flex Banner (Standard)	650.00	50	500	\N	\N	\N	8	t
cmml6azds000qk8smn5tlem8w	FLEX_PRE	Flex Banner (Premium)	900.00	50	500	\N	\N	\N	9	t
cmml6azlt000rk8sm31rbdeol	CORF	Corflute / Corrugated Plastic	1200.00	30	150	\N	\N	\N	10	t
cmml6aztp000sk8smmlgkedxf	FOAM_3	Foam Board (3mm)	1500.00	30	120	\N	\N	\N	11	t
cmml6b01r000tk8sms6ilags1	FOAM_5	Foam Board (5mm)	1800.00	30	120	\N	\N	\N	12	t
cmml6b09r000uk8sm03gtaoj6	VEH_WRAP	Vehicle Wrap Vinyl	2500.00	50	160	\N	\N	\N	13	t
cmml6b0hp000vk8smqwkxk0yu	FLOOR	Floor Graphic Vinyl	1900.00	30	150	\N	\N	\N	14	t
cmml6b0pr000wk8sm3rkfu4zg	WALLPPR	Wallpaper (Non-woven)	2000.00	50	320	\N	\N	\N	15	t
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Product" (id, name, slug, description, "shortDescription", "categoryId", "productType", images, "basePrice", "comparePrice", "costPrice", sku, stock, "lowStockThreshold", "minOrderQty", "maxOrderQty", weight, dimensions, materials, colors, finishes, "isActive", "isFeatured", "metaTitle", "metaDescription", tags, "createdAt", "updatedAt") FROM stdin;
cmml6av8r000ak8smv9gbm3or	Sample Vinyl Banner 1m²	sample-banner-1m	Ideal for events and promotions. 1m² vinyl banner with eyelets.	1 square metre vinyl banner, full colour	cmml6atku0007k8sm419ckt4u	LARGE_FORMAT	{}	2500.00	3000.00	\N	LF-VINYL-1M	0	0	1	\N	\N	\N	{Vinyl}	{"Full colour"}	\N	t	t	\N	\N	{banner,vinyl,large-format}	2026-03-10 22:19:55.664	2026-03-10 22:19:55.664
cmml6avsm000bk8smveaahkr6	3D Printed Key Holder	3d-printed-keyholder	Handy key holder for home or office. Printed in PLA.	Modern key holder, PLA	cmml6auoz0009k8smc0hf8rvn	READYMADE_3D	{}	450.00	600.00	\N	3D-KH-001	50	0	1	\N	\N	\N	{PLA}	{Black,White,Orange}	\N	t	t	\N	\N	{3d,keyholder,home}	2026-03-10 22:19:56.377	2026-03-10 22:19:56.377
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductImage" (id, "productId", url, "altText", "sortOrder", "isPrimary") FROM stdin;
\.


--
-- Data for Name: ProductReview; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductReview" (id, "productId", "userId", rating, title, body, images, "isVerified", "isApproved", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductVariant" (id, "productId", name, sku, price, stock, attributes, image, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductionQueue; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProductionQueue" (id, "orderId", "orderItemId", "assignedTo", status, "startedAt", "completedAt", "machineId", notes) FROM stdin;
\.


--
-- Data for Name: Quote; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Quote" (id, "quoteNumber", type, status, "customerId", "assignedStaffId", "customerName", "customerEmail", "customerPhone", "preferredContact", "projectName", description, "referenceFiles", "referenceFilesMeta", specifications, "budgetRange", deadline, "quotedAmount", "quotedAt", "quoteBreakdown", "quoteValidityDays", "quotePdfUrl", "acceptedAt", "rejectedAt", "rejectionReason", notes, "adminNotes", "referralSource", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Refund; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Refund" (id, "orderId", amount, reason, status, "processedBy", "processedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: ShippingAddress; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ShippingAddress" (id, "orderId", "fullName", email, phone, street, city, county, "postalCode", "deliveryMethod", lat, lng) FROM stdin;
\.


--
-- Data for Name: ShopInventoryMovement; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ShopInventoryMovement" (id, "productId", quantity, reason, reference, "costPerUnit", "createdAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: ShopPurchaseOrder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ShopPurchaseOrder" (id, "orderNumber", "supplierId", status, "totalKes", "expectedDate", "receivedAt", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ShopPurchaseOrderLine; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ShopPurchaseOrderLine" (id, "shopPurchaseOrderId", "productId", quantity, "unitCostKes", "receivedQuantity") FROM stdin;
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Staff" (id, "userId", department, "position", permissions, "createdAt", "updatedAt") FROM stdin;
cmml6as030003k8smy2odjtek	cmml6aro30002k8smrvghdhvt	Sales	Sales Rep	{orders_view,orders_edit,products_view,inventory_view}	2026-03-10 22:19:51.747	2026-03-10 22:19:51.747
cmml6aso10005k8smqbpqw1uw	cmml6asc60004k8smjz7k2h4z	Marketing	Marketing Lead	{products_view,products_edit,orders_view,orders_edit}	2026-03-10 22:19:52.609	2026-03-10 22:19:52.609
\.


--
-- Data for Name: SupportTicket; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SupportTicket" (id, "userId", "orderId", subject, status, priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ThreeDAddon; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ThreeDAddon" (id, code, name, "pricePerUnit", category, "sortOrder", "isActive") FROM stdin;
cmml6b7dx002bk8smhkdqlzcu	SUP_RM_NONE	No supports / not needed	0.00	SUPPORT_REMOVAL	0	t
cmml6b7lv002ck8sm71e7ucyc	SUP_RM_BASIC	Basic support removal	200.00	SUPPORT_REMOVAL	1	t
cmml6b7tq002dk8sm2yjjgl49	SUP_RM_HEAVY	Heavy support removal + sanding	500.00	SUPPORT_REMOVAL	2	t
cmml6b81n002ek8smw5v3wa17	FINISH_RAW	Raw print	0.00	FINISHING	3	t
cmml6b89i002fk8smf5pnc3oa	SAND_LT	Light sanding	300.00	FINISHING	4	t
cmml6b8hh002gk8smj5n7h153	SAND_FULL	Full sanding + primer	700.00	FINISHING	5	t
cmml6b8pg002hk8smx2pjqucm	PAINT_1	Single colour spray	1000.00	FINISHING	6	t
\.


--
-- Data for Name: ThreeDConsumable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ThreeDConsumable" (id, kind, name, specification, quantity, "lowStockThreshold", location, "costPerKgKes", "unitCostKes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TicketMessage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."TicketMessage" (id, "ticketId", "senderId", "senderType", message, attachments, "createdAt") FROM stdin;
\.


--
-- Data for Name: TurnaroundOption; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."TurnaroundOption" (id, code, name, "surchargePercent", "serviceType", "sortOrder", "isActive") FROM stdin;
cmml6b3ng001ik8smafst6uns	STD	Standard (3–5 days)	0.00	LARGE_FORMAT	0	t
cmml6b3s2001jk8smuwieyx6v	EXPRESS_1	Next day	30.00	LARGE_FORMAT	1	t
cmml6b3w1001kk8smw3b85q7f	EXPRESS_SD	Same day	60.00	LARGE_FORMAT	2	t
cmml6b401001lk8smrlx8thxq	EXPRESS_WE	Weekend / holiday rush	75.00	LARGE_FORMAT	3	t
cmml6b6tq0027k8smndjrdjq2	STD_3D	Standard (3–7 days)	0.00	THREE_D	0	t
cmml6b6xr0028k8smr8syn0p0	EXPRESS_3D	Express (1–2 days)	40.00	THREE_D	1	t
cmml6b71o0029k8sm0np9rnib	RUSH_3D	Rush (next day)	75.00	THREE_D	2	t
cmml6b75n002ak8sm9xmdhgb7	SAME_DAY_3D	Same day	100.00	THREE_D	3	t
\.


--
-- Data for Name: UploadedFile; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."UploadedFile" (id, "userId", "orderId", filename, "originalName", "mimeType", size, url, "thumbnailUrl", "fileType", status, "reviewedBy", "reviewNotes", "printVolume", "printWeight", "printTime", dimensions, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, name, email, phone, "passwordHash", role, "emailVerified", "createdAt", "updatedAt", "profileImage", "loyaltyPoints", "preferredLanguage", "failedLoginAttempts", "lockedUntil") FROM stdin;
cmml6ar440001k8smwc3i984p	PrintHub Admin	admin2@printhub.africa	\N	$2b$12$ygRLmQldPco2pmjzvdc/1utltLGv38zxuWEQr9X5oay6SHnYMUcC6	ADMIN	2026-03-10 22:19:50.31	2026-03-10 22:19:50.315	2026-03-10 22:19:50.315	\N	0	en	0	\N
cmml6aro30002k8smrvghdhvt	Sales User	sales@printhub.africa	\N	$2b$12$ygRLmQldPco2pmjzvdc/1utltLGv38zxuWEQr9X5oay6SHnYMUcC6	STAFF	2026-03-10 22:19:51.026	2026-03-10 22:19:51.031	2026-03-10 22:19:51.031	\N	0	en	0	\N
cmml6asc60004k8smjz7k2h4z	Marketing User	marketing@printhub.africa	\N	$2b$12$ygRLmQldPco2pmjzvdc/1utltLGv38zxuWEQr9X5oay6SHnYMUcC6	STAFF	2026-03-10 22:19:51.896	2026-03-10 22:19:51.896	2026-03-10 22:19:51.896	\N	0	en	0	\N
cmml6at040006k8sm6c4v3zek	Test Customer	customer@printhub.africa	\N	$2b$12$ygRLmQldPco2pmjzvdc/1utltLGv38zxuWEQr9X5oay6SHnYMUcC6	CUSTOMER	2026-03-10 22:19:52.758	2026-03-10 22:19:52.76	2026-03-10 22:19:52.76	\N	0	en	0	\N
cmml6aqk00000k8smliv5iiw4	PrintHub Super Admin	admin@printhub.africa	\N	$2b$12$L7zxooxHcf7vTAxxixctl.M9z.3FQx1Rz4HpLZ/VZ.vyY4tW4Wka.	SUPER_ADMIN	2026-03-10 22:19:48.586	2026-03-10 22:19:48.687	2026-03-10 22:24:43.674	\N	0	en	0	\N
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: Wishlist; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Wishlist" (id, "userId", "productId", "addedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6db6543d-b104-4703-bd26-561d178ab0d3	19793520ccb30aa8dda898fb4ccc6e01d4b822c534dcf86f5f328ded2284fa5e	2026-03-10 22:17:28.096349+00	20250310000000_baseline	\N	\N	2026-03-10 22:16:58.621009+00	1
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BulkQuote BulkQuote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BulkQuote"
    ADD CONSTRAINT "BulkQuote_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: CorporateAccount CorporateAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CorporateAccount"
    ADD CONSTRAINT "CorporateAccount_pkey" PRIMARY KEY (id);


--
-- Name: CouponUsage CouponUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_pkey" PRIMARY KEY (id);


--
-- Name: Coupon Coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Coupon"
    ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY (id);


--
-- Name: DesignServiceOption DesignServiceOption_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DesignServiceOption"
    ADD CONSTRAINT "DesignServiceOption_pkey" PRIMARY KEY (id);


--
-- Name: InventoryHardwareItem InventoryHardwareItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."InventoryHardwareItem"
    ADD CONSTRAINT "InventoryHardwareItem_pkey" PRIMARY KEY (id);


--
-- Name: Inventory Inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: LFBusinessSettings LFBusinessSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."LFBusinessSettings"
    ADD CONSTRAINT "LFBusinessSettings_pkey" PRIMARY KEY (id);


--
-- Name: LFPrinterSettings LFPrinterSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."LFPrinterSettings"
    ADD CONSTRAINT "LFPrinterSettings_pkey" PRIMARY KEY (id);


--
-- Name: LFStockItem LFStockItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."LFStockItem"
    ADD CONSTRAINT "LFStockItem_pkey" PRIMARY KEY (id);


--
-- Name: LaminationType LaminationType_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."LaminationType"
    ADD CONSTRAINT "LaminationType_pkey" PRIMARY KEY (id);


--
-- Name: LargeFormatFinishing LargeFormatFinishing_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."LargeFormatFinishing"
    ADD CONSTRAINT "LargeFormatFinishing_pkey" PRIMARY KEY (id);


--
-- Name: MachineType MachineType_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MachineType"
    ADD CONSTRAINT "MachineType_pkey" PRIMARY KEY (id);


--
-- Name: Machine Machine_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Machine"
    ADD CONSTRAINT "Machine_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceLog MaintenanceLog_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MaintenanceLog"
    ADD CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY (id);


--
-- Name: MaintenancePartUsed MaintenancePartUsed_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MaintenancePartUsed"
    ADD CONSTRAINT "MaintenancePartUsed_pkey" PRIMARY KEY (id);


--
-- Name: MpesaTransaction MpesaTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MpesaTransaction"
    ADD CONSTRAINT "MpesaTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Newsletter Newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Newsletter"
    ADD CONSTRAINT "Newsletter_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: OrderTimeline OrderTimeline_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderTimeline"
    ADD CONSTRAINT "OrderTimeline_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PricingConfig PricingConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PricingConfig"
    ADD CONSTRAINT "PricingConfig_pkey" PRIMARY KEY (id);


--
-- Name: PrintFinish PrintFinish_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrintFinish"
    ADD CONSTRAINT "PrintFinish_pkey" PRIMARY KEY (id);


--
-- Name: PrintMaterial PrintMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrintMaterial"
    ADD CONSTRAINT "PrintMaterial_pkey" PRIMARY KEY (id);


--
-- Name: PrintQuote PrintQuote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrintQuote"
    ADD CONSTRAINT "PrintQuote_pkey" PRIMARY KEY (id);


--
-- Name: PrinterAsset PrinterAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrinterAsset"
    ADD CONSTRAINT "PrinterAsset_pkey" PRIMARY KEY (id);


--
-- Name: PrintingMedium PrintingMedium_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrintingMedium"
    ADD CONSTRAINT "PrintingMedium_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductReview ProductReview_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductReview"
    ADD CONSTRAINT "ProductReview_pkey" PRIMARY KEY (id);


--
-- Name: ProductVariant ProductVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ProductionQueue ProductionQueue_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductionQueue"
    ADD CONSTRAINT "ProductionQueue_pkey" PRIMARY KEY (id);


--
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- Name: Refund Refund_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: ShippingAddress ShippingAddress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShippingAddress"
    ADD CONSTRAINT "ShippingAddress_pkey" PRIMARY KEY (id);


--
-- Name: ShopInventoryMovement ShopInventoryMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShopInventoryMovement"
    ADD CONSTRAINT "ShopInventoryMovement_pkey" PRIMARY KEY (id);


--
-- Name: ShopPurchaseOrderLine ShopPurchaseOrderLine_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShopPurchaseOrderLine"
    ADD CONSTRAINT "ShopPurchaseOrderLine_pkey" PRIMARY KEY (id);


--
-- Name: ShopPurchaseOrder ShopPurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShopPurchaseOrder"
    ADD CONSTRAINT "ShopPurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: SupportTicket SupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY (id);


--
-- Name: ThreeDAddon ThreeDAddon_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ThreeDAddon"
    ADD CONSTRAINT "ThreeDAddon_pkey" PRIMARY KEY (id);


--
-- Name: ThreeDConsumable ThreeDConsumable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ThreeDConsumable"
    ADD CONSTRAINT "ThreeDConsumable_pkey" PRIMARY KEY (id);


--
-- Name: TicketMessage TicketMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_pkey" PRIMARY KEY (id);


--
-- Name: TurnaroundOption TurnaroundOption_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TurnaroundOption"
    ADD CONSTRAINT "TurnaroundOption_pkey" PRIMARY KEY (id);


--
-- Name: UploadedFile UploadedFile_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UploadedFile"
    ADD CONSTRAINT "UploadedFile_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Wishlist Wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: Address_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Address_userId_idx" ON public."Address" USING btree ("userId");


--
-- Name: AuditLog_entity_entityId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_entity_entityId_idx" ON public."AuditLog" USING btree (entity, "entityId");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: Cart_sessionId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Cart_sessionId_idx" ON public."Cart" USING btree ("sessionId");


--
-- Name: Cart_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Cart_userId_idx" ON public."Cart" USING btree ("userId");


--
-- Name: Category_parentId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Category_parentId_idx" ON public."Category" USING btree ("parentId");


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: CorporateAccount_userId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "CorporateAccount_userId_key" ON public."CorporateAccount" USING btree ("userId");


--
-- Name: CouponUsage_couponId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CouponUsage_couponId_idx" ON public."CouponUsage" USING btree ("couponId");


--
-- Name: CouponUsage_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CouponUsage_userId_idx" ON public."CouponUsage" USING btree ("userId");


--
-- Name: Coupon_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Coupon_code_key" ON public."Coupon" USING btree (code);


--
-- Name: DesignServiceOption_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "DesignServiceOption_code_key" ON public."DesignServiceOption" USING btree (code);


--
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Invoice_orderId_idx" ON public."Invoice" USING btree ("orderId");


--
-- Name: LFStockItem_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "LFStockItem_code_key" ON public."LFStockItem" USING btree (code);


--
-- Name: LaminationType_slug_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "LaminationType_slug_key" ON public."LaminationType" USING btree (slug);


--
-- Name: LargeFormatFinishing_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "LargeFormatFinishing_code_key" ON public."LargeFormatFinishing" USING btree (code);


--
-- Name: MachineType_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "MachineType_code_key" ON public."MachineType" USING btree (code);


--
-- Name: MaintenanceLog_printerAssetId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "MaintenanceLog_printerAssetId_idx" ON public."MaintenanceLog" USING btree ("printerAssetId");


--
-- Name: MaintenancePartUsed_maintenanceLogId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "MaintenancePartUsed_maintenanceLogId_idx" ON public."MaintenancePartUsed" USING btree ("maintenanceLogId");


--
-- Name: MpesaTransaction_mpesaReceiptNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "MpesaTransaction_mpesaReceiptNumber_key" ON public."MpesaTransaction" USING btree ("mpesaReceiptNumber") WHERE ("mpesaReceiptNumber" IS NOT NULL);


--
-- Name: MpesaTransaction_paymentId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "MpesaTransaction_paymentId_key" ON public."MpesaTransaction" USING btree ("paymentId");


--
-- Name: Newsletter_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Newsletter_email_key" ON public."Newsletter" USING btree (email);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderTimeline_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderTimeline_orderId_idx" ON public."OrderTimeline" USING btree ("orderId");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: PricingConfig_key_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PricingConfig_key_key" ON public."PricingConfig" USING btree (key);


--
-- Name: PrintMaterial_slug_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PrintMaterial_slug_key" ON public."PrintMaterial" USING btree (slug);


--
-- Name: PrintQuote_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PrintQuote_userId_idx" ON public."PrintQuote" USING btree ("userId");


--
-- Name: PrinterAsset_assetTag_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PrinterAsset_assetTag_key" ON public."PrinterAsset" USING btree ("assetTag");


--
-- Name: PrintingMedium_slug_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PrintingMedium_slug_key" ON public."PrintingMedium" USING btree (slug);


--
-- Name: ProductImage_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductImage_productId_idx" ON public."ProductImage" USING btree ("productId");


--
-- Name: ProductReview_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductReview_productId_idx" ON public."ProductReview" USING btree ("productId");


--
-- Name: ProductReview_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductReview_userId_idx" ON public."ProductReview" USING btree ("userId");


--
-- Name: ProductVariant_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductVariant_productId_idx" ON public."ProductVariant" USING btree ("productId");


--
-- Name: ProductVariant_sku_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON public."ProductVariant" USING btree (sku);


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_isFeatured_isActive_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_isFeatured_isActive_idx" ON public."Product" USING btree ("isFeatured", "isActive");


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- Name: Product_slug_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Product_slug_idx" ON public."Product" USING btree (slug);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: ProductionQueue_machineId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductionQueue_machineId_idx" ON public."ProductionQueue" USING btree ("machineId");


--
-- Name: ProductionQueue_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ProductionQueue_orderId_idx" ON public."ProductionQueue" USING btree ("orderId");


--
-- Name: Quote_assignedStaffId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Quote_assignedStaffId_idx" ON public."Quote" USING btree ("assignedStaffId");


--
-- Name: Quote_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Quote_createdAt_idx" ON public."Quote" USING btree ("createdAt");


--
-- Name: Quote_customerId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Quote_customerId_idx" ON public."Quote" USING btree ("customerId");


--
-- Name: Quote_quoteNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON public."Quote" USING btree ("quoteNumber");


--
-- Name: Quote_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Quote_status_idx" ON public."Quote" USING btree (status);


--
-- Name: Quote_type_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Quote_type_idx" ON public."Quote" USING btree (type);


--
-- Name: Refund_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Refund_orderId_idx" ON public."Refund" USING btree ("orderId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: ShippingAddress_orderId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ShippingAddress_orderId_key" ON public."ShippingAddress" USING btree ("orderId");


--
-- Name: ShopInventoryMovement_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ShopInventoryMovement_createdAt_idx" ON public."ShopInventoryMovement" USING btree ("createdAt");


--
-- Name: ShopInventoryMovement_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ShopInventoryMovement_productId_idx" ON public."ShopInventoryMovement" USING btree ("productId");


--
-- Name: ShopPurchaseOrderLine_productId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ShopPurchaseOrderLine_productId_idx" ON public."ShopPurchaseOrderLine" USING btree ("productId");


--
-- Name: ShopPurchaseOrderLine_shopPurchaseOrderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ShopPurchaseOrderLine_shopPurchaseOrderId_idx" ON public."ShopPurchaseOrderLine" USING btree ("shopPurchaseOrderId");


--
-- Name: ShopPurchaseOrder_orderNumber_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ShopPurchaseOrder_orderNumber_key" ON public."ShopPurchaseOrder" USING btree ("orderNumber");


--
-- Name: Staff_userId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Staff_userId_key" ON public."Staff" USING btree ("userId");


--
-- Name: ThreeDAddon_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ThreeDAddon_code_key" ON public."ThreeDAddon" USING btree (code);


--
-- Name: TicketMessage_ticketId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "TicketMessage_ticketId_idx" ON public."TicketMessage" USING btree ("ticketId");


--
-- Name: TurnaroundOption_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "TurnaroundOption_code_key" ON public."TurnaroundOption" USING btree (code);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Wishlist_userId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Wishlist_userId_idx" ON public."Wishlist" USING btree ("userId");


--
-- Name: Wishlist_userId_productId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON public."Wishlist" USING btree ("userId", "productId");


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Address Address_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BulkQuote BulkQuote_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BulkQuote"
    ADD CONSTRAINT "BulkQuote_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BulkQuote BulkQuote_corporateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."BulkQuote"
    ADD CONSTRAINT "BulkQuote_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES public."CorporateAccount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CorporateAccount CorporateAccount_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CorporateAccount"
    ADD CONSTRAINT "CorporateAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CouponUsage CouponUsage_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public."Coupon"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CouponUsage CouponUsage_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CouponUsage CouponUsage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inventory Inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Inventory Inventory_productVariantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES public."ProductVariant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LFStockItem LFStockItem_printerAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."LFStockItem"
    ADD CONSTRAINT "LFStockItem_printerAssetId_fkey" FOREIGN KEY ("printerAssetId") REFERENCES public."PrinterAsset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaintenanceLog MaintenanceLog_printerAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MaintenanceLog"
    ADD CONSTRAINT "MaintenanceLog_printerAssetId_fkey" FOREIGN KEY ("printerAssetId") REFERENCES public."PrinterAsset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MaintenancePartUsed MaintenancePartUsed_lfStockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MaintenancePartUsed"
    ADD CONSTRAINT "MaintenancePartUsed_lfStockItemId_fkey" FOREIGN KEY ("lfStockItemId") REFERENCES public."LFStockItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaintenancePartUsed MaintenancePartUsed_maintenanceLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MaintenancePartUsed"
    ADD CONSTRAINT "MaintenancePartUsed_maintenanceLogId_fkey" FOREIGN KEY ("maintenanceLogId") REFERENCES public."MaintenanceLog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MpesaTransaction MpesaTransaction_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."MpesaTransaction"
    ADD CONSTRAINT "MpesaTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_productVariantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES public."ProductVariant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderTimeline OrderTimeline_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderTimeline"
    ADD CONSTRAINT "OrderTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PrintQuote PrintQuote_uploadedFileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrintQuote"
    ADD CONSTRAINT "PrintQuote_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES public."UploadedFile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrintQuote PrintQuote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PrintQuote"
    ADD CONSTRAINT "PrintQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductReview ProductReview_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductReview"
    ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductReview ProductReview_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductReview"
    ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductVariant ProductVariant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductionQueue ProductionQueue_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductionQueue"
    ADD CONSTRAINT "ProductionQueue_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public."Machine"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductionQueue ProductionQueue_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductionQueue"
    ADD CONSTRAINT "ProductionQueue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductionQueue ProductionQueue_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ProductionQueue"
    ADD CONSTRAINT "ProductionQueue_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quote Quote_assignedStaffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Refund Refund_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShippingAddress ShippingAddress_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShippingAddress"
    ADD CONSTRAINT "ShippingAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShopInventoryMovement ShopInventoryMovement_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShopInventoryMovement"
    ADD CONSTRAINT "ShopInventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShopPurchaseOrderLine ShopPurchaseOrderLine_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShopPurchaseOrderLine"
    ADD CONSTRAINT "ShopPurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShopPurchaseOrderLine ShopPurchaseOrderLine_shopPurchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ShopPurchaseOrderLine"
    ADD CONSTRAINT "ShopPurchaseOrderLine_shopPurchaseOrderId_fkey" FOREIGN KEY ("shopPurchaseOrderId") REFERENCES public."ShopPurchaseOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Staff Staff_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportTicket SupportTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketMessage TicketMessage_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketMessage TicketMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."SupportTicket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UploadedFile UploadedFile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."UploadedFile"
    ADD CONSTRAINT "UploadedFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wishlist Wishlist_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wishlist Wishlist_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict VB9egeuRjEfbBbh2Ye4yeoLfZE83F7KrT95mfZV3OGv2CRVomGpz0SZDbJaO1lT

