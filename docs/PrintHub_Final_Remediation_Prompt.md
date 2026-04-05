# PrintHub Africa — Final Remediation Prompt (Remaining Issues)

> **Instructions for the AI Agent:** These are the final unresolved issues from three rounds of security audits on the PrintHub Africa platform (`Printhub_Africa_ProdV1`). Every item below has been confirmed as NOT yet fixed in the codebase or documentation. Work through each one in order. For every fix: (1) locate the exact file, (2) implement the change, (3) confirm it works, (4) report what was changed. Do not move to the next item until the current one is fully resolved.

---

## 🔴 CRITICAL — Must Be Fixed Before Go-Live

---

### CRIT-1: Server-Side Order Price Recalculation

**Files:**
- `app/api/orders/route.ts` (primary)
- `app/api/admin/orders/create/route.ts` (secondary)
- `lib/cart-calculations.ts` (reference)

**Problem:** The cart lives in Zustand (client state). Across three audit rounds this has never been confirmed fixed. If `POST /api/orders` reads `unitPrice`, `subtotal`, `total`, `deliveryFee`, or `discount` from the request body, a buyer can submit manipulated prices and pay less than the real product price.

**Fix:**

1. Open `app/api/orders/route.ts`. Find the POST handler and identify every price-related field being read from `req.body` or the parsed request payload.

2. Remove ALL of the following from trusted client input:
   - `unitPrice`
   - `subtotal`
   - `total`
   - `discount`
   - `vatAmount`
   - `deliveryFee`
   - Any other monetary value

3. Replace with a complete server-side recalculation function. Implement this as `lib/order-price-calculator.ts`:

```typescript
// lib/order-price-calculator.ts
import { prisma } from './prisma';

interface CartItem {
  productId?: string;
  variantId?: string;
  quantity: number;
}

interface PriceResult {
  items: { productId?: string; variantId?: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  vatAmount: number;
  total: number;
}

export async function calculateOrderPriceServerSide(
  cartItems: CartItem[],
  couponCode: string | null,
  deliveryMethod: string,
  userId?: string
): Promise<PriceResult> {
  // 1. Fetch all product/variant prices from DB — never trust client
  const items = await Promise.all(
    cartItems.map(async (item) => {
      let unitPrice: number;

      if (item.variantId) {
        const variant = await prisma.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
          select: { price: true, stock: true, productId: true },
        });
        if (variant.stock < item.quantity) throw new Error(`Insufficient stock for variant ${item.variantId}`);
        unitPrice = variant.price;
      } else if (item.productId) {
        const product = await prisma.product.findUniqueOrThrow({
          where: { id: item.productId },
          select: { basePrice: true, stock: true },
        });
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${item.productId}`);
        unitPrice = product.basePrice;
      } else {
        throw new Error('Cart item must have productId or variantId');
      }

      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    })
  );

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  // 2. Validate coupon server-side
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        expiresAt: { gte: new Date() },
      },
    });
    if (coupon) {
      if (coupon.usageLimit !== null) {
        const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
        if (usageCount >= coupon.usageLimit) throw new Error('Coupon usage limit reached');
      }
      if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
        throw new Error(`Minimum order amount for this coupon is ${coupon.minimumOrderAmount}`);
      }
      discountAmount = coupon.discountType === 'PERCENTAGE'
        ? Math.round(subtotal * (coupon.discountValue / 100))
        : coupon.discountValue;
    }
  }

  // 3. Calculate delivery fee from DB settings
  const shippingSettings = await prisma.shippingSettings.findFirst();
  const deliveryFee = deliveryMethod === 'PICKUP' ? 0
    : deliveryMethod === 'EXPRESS' ? (shippingSettings?.expressFee ?? 0)
    : (shippingSettings?.standardFee ?? 0);

  // 4. Calculate VAT from DB config
  const pricingConfig = await prisma.pricingConfig.findFirst({ where: { key: 'vatRate' } });
  const vatRate = pricingConfig ? parseFloat(pricingConfig.value) : 0.16;
  const taxableAmount = subtotal - discountAmount + deliveryFee;
  const vatAmount = Math.round(taxableAmount * vatRate);
  const total = taxableAmount + vatAmount;

  return { items, subtotal, discountAmount, deliveryFee, vatAmount, total };
}
```

4. In `app/api/orders/route.ts`, call `calculateOrderPriceServerSide()` BEFORE creating any DB records. Use the returned values for ALL monetary fields in the `Order` and `OrderItem` creation.

5. Apply the same fix to `app/api/admin/orders/create/route.ts`.

6. Add a server-side price mismatch guard — if the client-supplied total differs from the server-calculated total by more than 1 KES (rounding), log a Sentry warning with the userId, IP, and both values. This helps detect exploitation attempts.

7. Update `SYSTEM_ARCHITECTURE.md` §7.2 Order Flow to explicitly state: *"All prices (unitPrice, subtotal, VAT, delivery fee, discount) are recalculated server-side from the database. Client-supplied monetary values are ignored entirely."*

**Verification:**
- Submit an order with `unitPrice: 1` in the payload and confirm the DB order record shows the real product price.
- Submit an order with a valid product and confirm the total matches `basePrice * quantity + VAT + delivery`.

---

### HIGH-2: Catalogue Import — SSRF Prevention

**File:** `app/api/admin/catalogue/import/route.ts`

**Problem:** This endpoint accepts an arbitrary URL from the admin and forwards it to n8n to scrape. A compromised admin account could submit an internal Railway URL (e.g. `http://n8n:5678/`, `http://169.254.169.254/`) to probe internal services.

**Fix:**

1. Open `app/api/admin/catalogue/import/route.ts` and find where the URL is received from the request body.

2. Add the following validation function at the top of the file BEFORE the URL is passed to n8n:

```typescript
const ALLOWED_IMPORT_DOMAINS = [
  'printables.com',
  'www.printables.com',
  'thingiverse.com',
  'www.thingiverse.com',
  'myminifactory.com',
  'www.myminifactory.com',
  'cults3d.com',
  'www.cults3d.com',
];

const PRIVATE_IP_REGEX = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/i;

function validateImportUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Only HTTPS URLs are permitted' };
    }

    if (PRIVATE_IP_REGEX.test(parsed.hostname)) {
      return { valid: false, reason: 'Internal/private IP addresses are not permitted' };
    }

    const isAllowed = ALLOWED_IMPORT_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    );

    if (!isAllowed) {
      return { valid: false, reason: `Domain not in allowlist. Permitted: ${ALLOWED_IMPORT_DOMAINS.join(', ')}` };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}
```

3. Apply the validation before the n8n trigger:
```typescript
const validation = validateImportUrl(importUrl);
if (!validation.valid) {
  // Log the attempt for security monitoring
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'BLOCKED_IMPORT_URL',
      entity: 'CatalogueImport',
      after: JSON.stringify({ attemptedUrl: importUrl, reason: validation.reason }),
    },
  });
  return NextResponse.json({ error: validation.reason }, { status: 400 });
}
```

4. Update `SYSTEM_ARCHITECTURE.md` §7.4 to add: *"Import URLs are validated against an allowlist of permitted domains (Printables, Thingiverse, MyMiniFactory, Cults3D). Non-HTTPS URLs and private/internal IP ranges are rejected. All blocked attempts are recorded in AuditLog."*

**Verification:**
- Submit `http://localhost:5678` — should return 400.
- Submit `http://169.254.169.254/latest/meta-data/` — should return 400.
- Submit `https://google.com` — should return 400.
- Submit `https://www.printables.com/model/123` — should pass validation and trigger n8n.

---

## 🟡 MEDIUM — Fix Within First Week

---

### MED-2: BlogPost — Standalone Publish Gate & Sync Trigger

**Files:**
- `prisma/schema.prisma` (BlogPost model)
- `app/api/admin/content/blog/route.ts` (or equivalent)
- n8n workflow: `marketing-content/` (blog sync workflow)
- `SYSTEM_ARCHITECTURE.md` §7.4

**Problem:** BlogPost has AI-generated content that syncs to Medium/LinkedIn. The human review gate is mentioned in the context of catalogue imports but the BlogPost's own independent lifecycle (when created outside of a catalogue import) is undocumented. The exact sync trigger condition is also undocumented.

**Fix:**

1. Confirm `BlogPost` in `prisma/schema.prisma` has the following fields. If any are missing, add them via migration:
```prisma
model BlogPost {
  id          String          @id @default(cuid())
  title       String
  content     String          @db.Text
  status      BlogPostStatus  @default(DRAFT)
  publishedAt DateTime?
  publishedBy String?         // userId of admin who approved
  syncedAt    DateTime?       // when it was synced to external platforms
  syncTargets String[]        // e.g. ["medium", "linkedin"]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum BlogPostStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  REJECTED
}
```

2. In the blog admin API route, enforce this state machine:
   - AI-generated posts must be created with `status: PENDING_REVIEW` — never `PUBLISHED`.
   - Only a `SUPER_ADMIN` or admin with `content_publish` permission can transition `PENDING_REVIEW → PUBLISHED`.
   - Setting `status: PUBLISHED` must also set `publishedAt = new Date()` and `publishedBy = session.user.id`.
   - `PUBLISHED → DRAFT` (unpublish) must be allowed.
   - `PUBLISHED → PENDING_REVIEW` must NOT be allowed (avoid bypassing the review gate).

3. In the n8n blog sync workflow (`marketing-content/`), confirm the trigger condition queries:
```
WHERE status = 'PUBLISHED' AND syncedAt IS NULL
```
Never sync `DRAFT` or `PENDING_REVIEW` posts.

4. After successful sync, update `syncedAt = now()` so the post is not synced again on the next run.

5. Update `SYSTEM_ARCHITECTURE.md` §7.4 to add a dedicated Blog section: *"BlogPost content follows a DRAFT → PENDING_REVIEW → PUBLISHED lifecycle. AI-generated posts are always created as PENDING_REVIEW. External sync (Medium/LinkedIn) is triggered only on PUBLISHED posts with syncedAt = null."*

---

### MED-5: Warranty Record — Prevent Serial Number Enumeration

**Files:**
- `app/api/account/warranties/route.ts` (or wherever warranty lookup is handled)
- `app/api/admin/hardware/warranties/route.ts`

**Problem:** `WarrantyRecord` links to `User` but there is no documented enforcement that a customer can only look up their own warranty records. A customer could enumerate serial numbers to find other customers' warranty details.

**Fix:**

1. Find the customer-facing warranty lookup endpoint. Confirm the Prisma query always scopes to the authenticated user:

```typescript
// CORRECT — always scope to session userId
const warranty = await prisma.warrantyRecord.findFirst({
  where: {
    serialNumber: input.serialNumber,
    userId: session.user.id,  // This line is NON-NEGOTIABLE
  },
});

// If not found, always return the same generic 404
// NEVER return "warranty exists but belongs to another user"
if (!warranty) {
  return NextResponse.json({ error: 'Warranty record not found' }, { status: 404 });
}
```

2. Apply rate limiting to the warranty lookup endpoint using `lib/rate-limit.ts`:
```typescript
const rateLimitResult = await rateLimit({
  key: `warranty-lookup:${session.user.id}`,
  limit: 10,
  window: '1h',
});
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

3. Log failed warranty lookups (serial number not found for this user) in `AuditLog` — repeated failures from the same user indicate enumeration attempts.

4. In the admin warranty endpoint (`/api/admin/hardware/warranties/`), confirm admin lookups are also audited and require `inventory_view` permission.

---

### MED-6: Corporate Routes — DB-Level Role Enforcement

**Files:**
- `app/api/corporate/team/invite/route.ts`
- `app/api/account/corporate/checkout/route.ts`
- `app/api/account/corporate/invoices/route.ts`
- Any other `/api/corporate/*` or `/api/account/corporate/*` route

**Problem:** The JWT includes `corporateRole` and `isCorporate` claims. For write operations, these must never be trusted alone — a stale or crafted JWT could allow a `MEMBER` to perform `OWNER`-level actions.

**Fix:**

1. Create a shared corporate auth helper in `lib/corporate-auth.ts`:

```typescript
// lib/corporate-auth.ts
import { prisma } from './prisma';

export async function getCorporateMemberFromDB(
  userId: string,
  corporateId: string
) {
  // Always re-fetch from DB — never trust JWT claims for write operations
  const member = await prisma.corporateTeamMember.findFirst({
    where: {
      userId,
      corporateId,
      // Ensure the corporate account is still active
      corporateAccount: { status: 'ACTIVE' },
    },
    select: {
      role: true,
      canPlaceOrders: true,
      canViewInvoices: true,
      canManageTeam: true,
    },
  });
  return member; // null if not a member or account inactive
}
```

2. Apply to each route as follows:

```typescript
// POST /api/corporate/team/invite
const member = await getCorporateMemberFromDB(session.user.id, corporateId);
if (!member || !member.canManageTeam) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// GET /api/account/corporate/checkout (place order)
const member = await getCorporateMemberFromDB(session.user.id, corporateId);
if (!member || !member.canPlaceOrders) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// GET /api/account/corporate/invoices
const member = await getCorporateMemberFromDB(session.user.id, corporateId);
if (!member || (!member.canViewInvoices && member.role !== 'OWNER' && member.role !== 'FINANCE')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

3. Audit every other `/api/corporate/*` and `/api/account/corporate/*` route and confirm each one calls `getCorporateMemberFromDB()` before any write or sensitive read operation.

4. Never rely on `session.user.corporateRole` alone for authorization decisions on these routes.

---

## 🔵 DOCUMENTATION — Update Three Documents

---

### DOC-1: SECURITY.md — Add Four Missing Sections

Open `docs/SECURITY.md` and add the following:

**A. After Section 2 (Key Rotation), add n8n HMAC to the rotation table:**
```markdown
| **Automation Webhooks** | N8N_WEBHOOK_SECRET (HMAC key) | Every 90 Days |
```
And add to the rotation procedure: *"For n8n HMAC key rotation: update `N8N_WEBHOOK_SECRET` in Railway, update the corresponding secret in n8n credentials, and verify a test webhook call succeeds before deactivating the old key."*

**B. Define "On-Demand" rotation triggers in Section 2:**
Add after the rotation table:
```markdown
### On-Demand Rotation Triggers
Immediately rotate any key if any of the following occur:
- A team member with access to credentials is offboarded
- A suspected or confirmed credential leak (e.g. key found in logs, Git history, or error messages)
- A Railway service is compromised or redeployed with exposed environment variables
- Any third-party provider reports unauthorized usage on the account
```

**C. Add ODPC 72-hour notification window to Section 4.3 (Data Leakage):**
```markdown
**ODPC Notification Timeline:** Under Kenya's Data Protection Act, the Office of the Data Protection Commissioner (ODPC) must be notified within **72 hours** of becoming aware of a personal data breach. This notification must include: the nature of the breach, categories and approximate number of data subjects affected, likely consequences, and measures taken or proposed to address the breach. Contact: www.odpc.go.ke
```

**D. Fix the two minor issues:**
- Section 1.2: Change heading from "Hardware Security" to "Multi-Factor Authentication (2FA)"
- Section 4.2: Fix typo "reactivaton" → "reactivation"

---

### DOC-2: SYSTEM_ARCHITECTURE.md — Add Three Missing Statements

**A. §7.2 Order Flow — add after step 2:**
> *"**Price Integrity:** All monetary values (unitPrice, subtotal, VAT, delivery fee, coupon discount) are recalculated entirely server-side using `lib/order-price-calculator.ts`. Any price values supplied in the client request payload are ignored. A Sentry warning is logged if a client-supplied total deviates from the server-calculated total."*

**B. §7.4 Catalogue Import — add to step 1:**
> *"Import URLs are validated against an allowlist of permitted domains (Printables, Thingiverse, MyMiniFactory, Cults3D) before the n8n workflow is triggered. Non-HTTPS URLs and requests targeting private/internal IP ranges are rejected with a 400 error and recorded in AuditLog."*

**C. §7.4 — add a new step 6 for BlogPost:**
> *"**Blog Content Lifecycle:** AI-generated BlogPosts are created with `status: PENDING_REVIEW`. Only admins with `content_publish` permission can transition to `PUBLISHED`. External platform sync (Medium/LinkedIn) is triggered exclusively on `PUBLISHED` posts where `syncedAt` is null, and `syncedAt` is set immediately after sync to prevent duplicate publishing."*

---

## ✅ FINAL SIGN-OFF — Complete Checklist

Run through every item below. All must be confirmed before this audit is closed:

**Critical**
- [ ] `POST /api/orders` — submit order with `unitPrice: 1`, confirm DB shows real product price
- [ ] `lib/order-price-calculator.ts` exists and is called from both order creation routes
- [ ] Sentry warning fires when client-supplied total != server-calculated total
- [ ] `POST /api/admin/catalogue/import` with `http://localhost:5678` returns 400
- [ ] `POST /api/admin/catalogue/import` with `http://169.254.169.254` returns 400
- [ ] `POST /api/admin/catalogue/import` with `https://www.printables.com/model/123` succeeds
- [ ] Blocked import URLs are recorded in AuditLog

**Medium**
- [ ] `BlogPost.status` enum exists in schema with `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`
- [ ] AI-generated blog posts are created as `PENDING_REVIEW` — never `PUBLISHED` directly
- [ ] n8n blog sync workflow only queries `status = PUBLISHED AND syncedAt IS NULL`
- [ ] `syncedAt` is set after successful sync
- [ ] Warranty lookup scopes to `userId = session.user.id`
- [ ] Warranty lookup returns identical 404 whether serial doesn't exist or belongs to another user
- [ ] Warranty lookup rate limited to 10 attempts/hour per user
- [ ] `lib/corporate-auth.ts` created with `getCorporateMemberFromDB()`
- [ ] All corporate write routes call `getCorporateMemberFromDB()` — not JWT claims alone
- [ ] Corporate invite requires `canManageTeam = true` from DB
- [ ] Corporate checkout requires `canPlaceOrders = true` from DB
- [ ] Corporate invoice access requires `canViewInvoices = true` or OWNER/FINANCE role from DB

**Documentation**
- [ ] `N8N_WEBHOOK_SECRET` added to key rotation table in SECURITY.md
- [ ] On-demand rotation triggers defined in SECURITY.md
- [ ] ODPC 72-hour notification window added to SECURITY.md
- [ ] "Hardware Security" heading fixed to "Multi-Factor Authentication (2FA)"
- [ ] "reactivaton" typo fixed
- [ ] §7.2 of SYSTEM_ARCHITECTURE.md updated with price integrity statement
- [ ] §7.4 of SYSTEM_ARCHITECTURE.md updated with SSRF allowlist statement
- [ ] §7.4 of SYSTEM_ARCHITECTURE.md updated with BlogPost lifecycle statement
