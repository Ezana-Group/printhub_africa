# 🚀 PRINTHUB — PRODUCTION LAUNCH CHECKLIST
### Cursor AI Prompt | Go Live on printhub.africa — Domain, Credentials, Clean Data
### printhub.africa | An Ezana Group Company
---

> **WHAT THIS PROMPT DOES:**
>
> You have purchased printhub.africa. This prompt takes PrintHub from
> development/testing to fully live production. It covers:
>
>   PART 1 — Connect printhub.africa domain to your hosting (Vercel or Railway)
>   PART 2 — Switch all services from sandbox/test to live credentials
>   PART 3 — Verify and update all production environment variables
>   PART 4 — Clean all dummy/test data from the database
>   PART 5 — Seed production data (real business settings, no placeholders)
>   PART 6 — Final pre-launch checklist
>
> Work through each part in order. Do not skip any step.
> By the end, printhub.africa will be live and ready for real customers.

---

## PART 1 — CONNECT printhub.africa TO YOUR HOSTING

### 1A — If hosting on Vercel

1. Go to **vercel.com** → your PrintHub project → Settings → Domains
2. Click **Add Domain**
3. Type: `printhub.africa`
4. Click **Add**
5. Vercel will show you DNS records to add. You need TWO records:

```
Type:  A
Name:  @  (or leave blank — means root domain)
Value: 76.76.21.21

Type:  CNAME
Name:  www
Value: cname.vercel-dns.com
```

6. Log into your domain registrar (where you bought printhub.africa)
7. Go to DNS settings / DNS management
8. Add both records above
9. Back in Vercel, click **Verify** — may take 5–30 minutes for DNS to propagate
10. Once verified, Vercel automatically issues a free SSL certificate
11. Also add `www.printhub.africa` → redirect to `printhub.africa` (Vercel does this automatically)

**Test:** Open https://printhub.africa — your site should load with a padlock ✓

---

### 1B — If hosting on Railway

1. Go to **railway.app** → your PrintHub project → your web service → Settings
2. Scroll to **Custom Domain**
3. Click **Add Custom Domain**
4. Type: `printhub.africa`
5. Railway shows you a CNAME record:

```
Type:  CNAME
Name:  @  (or root / apex)
Value: [something].railway.app
```

> **Important:** Most registrars don't support CNAME on the apex/root domain (@).
> If yours doesn't, use Railway's provided IP address for an A record instead,
> or use Cloudflare as a DNS proxy (recommended — free, and you already have
> Cloudflare for R2 storage).

**Using Cloudflare DNS (recommended — you already have an account):**
1. Add your domain to Cloudflare (free) — it becomes your DNS provider
2. In Cloudflare DNS → Add record:
```
Type:  CNAME
Name:  @
Value: [your-railway-app].railway.app
Proxy: Orange cloud ON (proxied) ← this enables Cloudflare CDN + DDoS protection
```
3. Add www redirect:
```
Type:  CNAME
Name:  www
Value: @
Proxy: Orange cloud ON
```
4. SSL: Cloudflare SSL → Full (strict)
5. Railway detects the domain and issues its own SSL as well

**Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL in Railway env vars:**
```
NEXTAUTH_URL=https://printhub.africa
NEXT_PUBLIC_APP_URL=https://printhub.africa
```

---

## PART 2 — SWITCH ALL SERVICES FROM SANDBOX TO LIVE

Every service was set up in sandbox/test mode. Each one must be switched
to live before you take real payments or send real emails.

### 2A — M-Pesa Daraja: Sandbox → Production

1. Go to **developer.safaricom.co.ke**
2. Your app → Request to go Live (fill in the business details form)
3. Safaricom reviews and approves (usually 1–3 business days)
4. Once approved, you get **Production** Consumer Key and Consumer Secret
5. Your live shortcode is your actual M-Pesa Paybill or Till number
6. Get your live Passkey from the M-Pesa portal (different from sandbox)

Update these environment variables:
```env
# SANDBOX (remove/replace):
MPESA_CONSUMER_KEY=         ← your LIVE consumer key
MPESA_CONSUMER_SECRET=      ← your LIVE consumer secret
MPESA_SHORTCODE=            ← your actual Paybill number (e.g. 522522)
MPESA_PASSKEY=              ← your LIVE passkey from Safaricom portal
MPESA_CALLBACK_URL=https://printhub.africa/api/payments/mpesa/callback
MPESA_ENV=production        ← change from "sandbox" to "production"
```

**Also update the Daraja portal:**
- Log into Safaricom developer portal → your live app
- Set Callback URL to: `https://printhub.africa/api/payments/mpesa/callback`
- Set Validation URL (if STK): `https://printhub.africa/api/payments/mpesa/validate`

**Test with KES 1:** Send a real KES 1 STK push to your own phone to confirm live M-Pesa works.

---

### 2B — Pesapal: Sandbox → Live

1. Go to **pesapal.com** → Merchant Dashboard
2. Complete KYC verification (business registration docs, ID)
3. Once verified, you receive live API credentials
4. Update:
```env
PESAPAL_CONSUMER_KEY=       ← your LIVE key
PESAPAL_CONSUMER_SECRET=    ← your LIVE secret
PESAPAL_IPN_URL=https://printhub.africa/api/payments/pesapal/ipn
PESAPAL_ENV=live            ← change from "sandbox" to "live"
```

---

### 2C — Resend Email: Test → Production Domain

Currently emails send from `onboarding@resend.dev`. Switch to `hello@printhub.africa`.

1. Go to **resend.com** → Domains → Add Domain
2. Type: `printhub.africa`
3. Resend gives you DNS records to add (SPF, DKIM, DMARC):

```
Type:  TXT
Name:  @
Value: v=spf1 include:amazonses.com ~all

Type:  CNAME
Name:  resend._domainkey
Value: [resend-provided CNAME value]

Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=quarantine;
```

4. Add these records in your domain registrar or Cloudflare DNS
5. Click Verify in Resend dashboard (takes 5–30 minutes)
6. Once verified, update:
```env
FROM_EMAIL=hello@printhub.africa    ← change from onboarding@resend.dev
FROM_NAME=PrintHub
```

Now all order confirmation emails, quote emails, and notifications
will come from hello@printhub.africa.

---

### 2D — Africa's Talking SMS: Sandbox → Live

1. Go to **africastalking.com** → your account
2. Top up your AT balance (SMS costs ~KES 0.80 each in Kenya)
3. Generate a **Live** API key (different from sandbox key)
4. Update:
```env
AT_API_KEY=                 ← your LIVE API key (not sandbox)
AT_USERNAME=printhub        ← your AT username (not "sandbox")
AT_SENDER_ID=PrintHub
AT_ENV=live                 ← change from "sandbox" to "live"
```

---

### 2E — Google OAuth: Add production domain

1. Go to **console.cloud.google.com** → your PrintHub project
2. APIs & Services → Credentials → your OAuth Client ID → Edit
3. Add to Authorized redirect URIs:
```
https://printhub.africa/api/auth/callback/google
```
4. Keep the existing localhost and any staging URLs
5. Save

---

### 2F — Facebook OAuth: Add production domain

1. Go to **developers.facebook.com** → your PrintHub app
2. Facebook Login → Settings → Valid OAuth Redirect URIs → Add:
```
https://printhub.africa/api/auth/callback/facebook
```
3. Also update: App Domains → add `printhub.africa`
4. Switch app from Development to Live mode (Facebook requires app review for some permissions)

---

### 2G — Sentry: Set production environment

```env
SENTRY_ENVIRONMENT=production   ← change from "development"
```

In Sentry dashboard → your project → Alerts → make sure you have
an alert rule that emails you on new errors.

---

## PART 3 — PRODUCTION ENVIRONMENT VARIABLES (COMPLETE LIST)

Set ALL of these in your hosting platform's environment variables panel
(Vercel: Project → Settings → Environment Variables, or Railway: Variables tab).

```env
# ── APP ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://printhub.africa
NEXT_PUBLIC_APP_NAME=PrintHub
NODE_ENV=production

# ── NEXTAUTH ──────────────────────────────────────────────────────
NEXTAUTH_URL=https://printhub.africa
NEXTAUTH_SECRET=[generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"]

# ── DATABASE (Neon — use POOLED URL for runtime) ──────────────────
DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.neon.tech/printhub?sslmode=require
DIRECT_URL=postgresql://[user]:[password]@[endpoint].neon.tech/printhub?sslmode=require

# ── FILE STORAGE (Cloudflare R2) ──────────────────────────────────
R2_ENDPOINT=https://[ACCOUNT_ID].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=[your R2 access key]
R2_SECRET_ACCESS_KEY=[your R2 secret key]
R2_UPLOADS_BUCKET=printhub-uploads
R2_PUBLIC_BUCKET=printhub-public
R2_PUBLIC_URL=https://assets.printhub.africa   ← OR https://pub-[hash].r2.dev

# ── EMAIL (Resend — verified domain) ─────────────────────────────
RESEND_API_KEY=[your Resend API key]
FROM_EMAIL=hello@printhub.africa
FROM_NAME=PrintHub

# ── SMS (Africa's Talking — LIVE) ─────────────────────────────────
AT_API_KEY=[your LIVE AT API key]
AT_USERNAME=[your AT username — NOT "sandbox"]
AT_SENDER_ID=PrintHub
AT_ENV=live

# ── M-PESA (Daraja — PRODUCTION) ─────────────────────────────────
MPESA_CONSUMER_KEY=[LIVE consumer key]
MPESA_CONSUMER_SECRET=[LIVE consumer secret]
MPESA_SHORTCODE=[your actual Paybill number]
MPESA_PASSKEY=[LIVE passkey]
MPESA_CALLBACK_URL=https://printhub.africa/api/payments/mpesa/callback
MPESA_ENV=production

# ── PESAPAL (LIVE) ────────────────────────────────────────────────
PESAPAL_CONSUMER_KEY=[LIVE key]
PESAPAL_CONSUMER_SECRET=[LIVE secret]
PESAPAL_IPN_URL=https://printhub.africa/api/payments/pesapal/ipn
PESAPAL_ENV=live

# ── GOOGLE OAUTH ──────────────────────────────────────────────────
GOOGLE_CLIENT_ID=[your Google OAuth client ID]
GOOGLE_CLIENT_SECRET=[your Google OAuth client secret]

# ── FACEBOOK OAUTH ────────────────────────────────────────────────
FACEBOOK_CLIENT_ID=[your Facebook app ID]
FACEBOOK_CLIENT_SECRET=[your Facebook app secret]
NEXT_PUBLIC_FACEBOOK_APP_ID=[your Facebook app ID]

# ── SENTRY ────────────────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=[your Sentry DSN]
SENTRY_AUTH_TOKEN=[your Sentry auth token]
SENTRY_ORG=ezana-group
SENTRY_PROJECT=printhub
SENTRY_ENVIRONMENT=production

# ── ANALYTICS ────────────────────────────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-[your GA4 ID]

# ── INTERNAL ──────────────────────────────────────────────────────
ADMIN_EMAIL=admin@printhub.africa
CRON_SECRET=[generate a new random secret for production]
```

---

## PART 4 — CLEAN ALL DUMMY AND TEST DATA

Run this script to wipe all test/dummy data from the database while
preserving the core configuration data (categories, materials, settings).

```typescript
// prisma/scripts/clean-test-data.ts
// Run: npx ts-node prisma/scripts/clean-test-data.ts
// ⚠ ONLY RUN ONCE — BEFORE LAUNCH — IRREVERSIBLE

import { prisma } from '@/lib/prisma'

async function cleanTestData() {
  console.log('🧹 Cleaning test data from PrintHub database...')
  console.log('⚠  This is irreversible. Are you on the PRODUCTION database?')
  console.log('   DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 40))
  console.log('')

  // Safety pause — 5 seconds to ctrl+C if wrong database
  await new Promise(resolve => setTimeout(resolve, 5000))
  console.log('Proceeding...')

  // ── 1. DELETE ALL TEST ORDERS ─────────────────────────────────
  // This cascades to: OrderItems, OrderTimeline, Payment, Delivery etc.
  const deletedOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { orderNumber: { startsWith: 'PHUB-' } },  // all orders
        { orderNumber: { contains: 'TEST' } },
      ]
    }
  })
  console.log(`✓ Deleted ${deletedOrders.count} test orders`)

  // ── 2. DELETE ALL TEST QUOTES ─────────────────────────────────
  const deletedQuotes = await prisma.printQuote.deleteMany({})
  console.log(`✓ Deleted ${deletedQuotes.count} test quotes`)

  // ── 3. DELETE ALL TEST UPLOADED FILES ─────────────────────────
  const deletedFiles = await prisma.uploadedFile.deleteMany({})
  console.log(`✓ Deleted ${deletedFiles.count} test uploaded files`)

  // ── 4. DELETE ALL TEST CUSTOMERS ─────────────────────────────
  // Keep only admin and staff users — delete test customers
  const deletedCustomers = await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER',  // only delete customer accounts
      email: {
        // Delete known test emails
        in: [
          'test@test.com',
          'customer@test.com',
          'testcustomer@gmail.com',
          'corporate@printhub.africa',  // test corporate account
          'moses@test.com',
          // Add any other test emails you used
        ]
      }
    }
  })
  console.log(`✓ Deleted ${deletedCustomers.count} test customer accounts`)

  // ── 5. DELETE ALL TEST CORPORATE ACCOUNTS ─────────────────────
  const deletedCorpApps = await prisma.corporateApplication.deleteMany({
    where: {
      companyName: { contains: 'Test', mode: 'insensitive' }
    }
  })
  console.log(`✓ Deleted ${deletedCorpApps.count} test corporate applications`)

  const deletedCorpAccounts = await prisma.corporateAccount.deleteMany({
    where: {
      companyName: { contains: 'Test', mode: 'insensitive' }
    }
  })
  console.log(`✓ Deleted ${deletedCorpAccounts.count} test corporate accounts`)

  // ── 6. DELETE ALL TEST SUPPORT TICKETS ────────────────────────
  const deletedTickets = await prisma.supportTicket.deleteMany({}).catch(() => ({ count: 0 }))
  console.log(`✓ Deleted ${deletedTickets.count} test support tickets`)

  // ── 7. DELETE ALL TEST REVIEWS ────────────────────────────────
  const deletedReviews = await prisma.productReview.deleteMany({}).catch(() => ({ count: 0 }))
  console.log(`✓ Deleted ${deletedReviews.count} test reviews`)

  // ── 8. DELETE TEST CATALOGUE ITEMS ────────────────────────────
  // Only delete items with "Test" or "Sample" in the name
  const deletedCatalogue = await prisma.catalogueItem.deleteMany({
    where: {
      OR: [
        { name: { contains: 'Test',   mode: 'insensitive' } },
        { name: { contains: 'Sample', mode: 'insensitive' } },
        { name: { contains: 'Dummy',  mode: 'insensitive' } },
      ]
    }
  })
  console.log(`✓ Deleted ${deletedCatalogue.count} test catalogue items`)

  // ── 9. DELETE TEST PRODUCTS ────────────────────────────────────
  // Only delete explicitly named test products — keep real ones
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [
        { name: { contains: 'Test',   mode: 'insensitive' } },
        { name: { contains: 'Sample', mode: 'insensitive' } },
        { name: { contains: 'Dummy',  mode: 'insensitive' } },
        { name: { contains: 'Lorem',  mode: 'insensitive' } },
      ]
    }
  })
  console.log(`✓ Deleted ${deletedProducts.count} test products`)

  // ── 10. RESET ORDER NUMBER COUNTER ────────────────────────────
  // So first real order is PHUB-000001 (not PHUB-000050 from testing)
  await prisma.counter.upsert({
    where:  { id: 'order' },
    update: { value: 0 },
    create: { id: 'order', value: 0 }
  }).catch(() => {})  // skip if counter model doesn't exist
  console.log('✓ Order number counter reset to 0')

  // ── 11. RESET QUOTE NUMBER COUNTER ────────────────────────────
  await prisma.counter.upsert({
    where:  { id: 'quote' },
    update: { value: 0 },
    create: { id: 'quote', value: 0 }
  }).catch(() => {})
  console.log('✓ Quote number counter reset to 0')

  console.log('')
  console.log('✅ Test data cleaned. Database is ready for production.')
  console.log('   Next step: run the production seed script.')
}

cleanTestData()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

Run it:
```bash
npx ts-node prisma/scripts/clean-test-data.ts
```

---

## PART 5 — SEED REAL PRODUCTION DATA

After cleaning test data, seed the database with real business information.
**Replace every placeholder below with your actual details.**

```typescript
// prisma/scripts/seed-production.ts
// Run: npx ts-node prisma/scripts/seed-production.ts

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function seedProduction() {
  console.log('🌱 Seeding PrintHub production data...')

  // ── 1. SUPER ADMIN ────────────────────────────────────────────
  // IMPORTANT: Change this password immediately after first login
  const adminHash = await bcrypt.hash('ChangeMe2026!', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@printhub.africa' },
    update: { passwordHash: adminHash },
    create: {
      name:          'PrintHub Admin',
      email:         'admin@printhub.africa',
      passwordHash:  adminHash,
      role:          'SUPER_ADMIN',
      emailVerified: new Date(),
    }
  })
  console.log('✓ Admin account ready: admin@printhub.africa')
  console.log('  ⚠ CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN')

  // ── 2. BUSINESS SETTINGS ──────────────────────────────────────
  // Replace ALL placeholder values with your real details
  await prisma.businessSettings.upsert({
    where:  { id: 'default' },
    update: {
      businessName:    'PrintHub',
      tagline:         'Professional Printing in Nairobi. Large Format, 3D Printing, Custom Branding.',
      email:           'hello@printhub.africa',
      phone:           '+254 727 410 320',
      whatsapp:        '254727410320',       // no spaces, no +
      addressLine1:    '',    // ← FILL IN: e.g. "2nd Floor, Westgate Mall"
      addressLine2:    '',    // ← FILL IN: e.g. "Westlands"
      city:            'Nairobi',
      county:          'Nairobi County',
      country:         'Kenya',
      hoursWeekdays:   'Monday – Friday: 8:00am – 6:00pm',
      hoursSaturday:   'Saturday: 9:00am – 3:00pm',
      hoursSunday:     'Sunday: Closed',
      hoursHolidays:   'Public holidays: Closed',
      googleMapsUrl:   '',    // ← FILL IN: paste Google Maps embed src URL
      kraPin:          '',    // ← FILL IN: your KRA PIN
      vatNumber:       '',    // ← FILL IN: your VAT number if registered
      vatRegistered:   true,
      vatRate:         16,
      orderPrefix:     'PHUB',
      currencyCode:    'KES',
      facebookUrl:     'https://facebook.com/printhub.africa',
      instagramUrl:    'https://instagram.com/printhub.africa',
    },
    create: {
      id:              'default',
      businessName:    'PrintHub',
      email:           'hello@printhub.africa',
      phone:           '+254 727 410 320',
      whatsapp:        '254727410320',
      city:            'Nairobi',
      country:         'Kenya',
      hoursWeekdays:   'Monday – Friday: 8:00am – 6:00pm',
      hoursSaturday:   'Saturday: 9:00am – 3:00pm',
      vatRegistered:   true,
      vatRate:         16,
      orderPrefix:     'PHUB',
      currencyCode:    'KES',
    }
  })
  console.log('✓ Business settings seeded')

  // ── 3. DEPARTMENTS ────────────────────────────────────────────
  const departments = [
    { name: 'Management',       colour: '#0A0A0A', sortOrder: 1 },
    { name: 'Production',       colour: '#FF4D00', sortOrder: 2 },
    { name: 'Design',           colour: '#7C3AED', sortOrder: 3 },
    { name: 'Sales',            colour: '#059669', sortOrder: 4 },
    { name: 'Delivery',         colour: '#2563EB', sortOrder: 5 },
    { name: 'Finance',          colour: '#D97706', sortOrder: 6 },
    { name: 'Customer Support', colour: '#DB2777', sortOrder: 7 },
  ]
  for (const dept of departments) {
    await prisma.department.upsert({
      where:  { name: dept.name },
      update: {},
      create: dept
    }).catch(() => {})
  }
  console.log('✓ Departments seeded')

  // ── 4. DELIVERY ZONES ─────────────────────────────────────────
  const zones = [
    { name: 'Nairobi',   counties: ['Nairobi'],                                          standardFee: 200,  expressFee: 400,  estimatedDays: 1, expressHours: 4  },
    { name: 'Central',   counties: ['Kiambu','Murang\'a','Nyeri','Kirinyaga','Nyandarua'], standardFee: 400,  expressFee: 700,  estimatedDays: 2, expressHours: 8  },
    { name: 'Coast',     counties: ['Mombasa','Kilifi','Kwale','Taita Taveta'],           standardFee: 600,  expressFee: 1000, estimatedDays: 3, expressHours: 24 },
    { name: 'Western',   counties: ['Kisumu','Kakamega','Vihiga','Bungoma','Busia'],      standardFee: 600,  expressFee: 1000, estimatedDays: 3, expressHours: 24 },
    { name: 'Rift Valley',counties: ['Nakuru','Uasin Gishu','Kericho','Nandi'],           standardFee: 500,  expressFee: 800,  estimatedDays: 2, expressHours: 12 },
    { name: 'Eastern',   counties: ['Machakos','Makueni','Kitui','Embu','Meru'],          standardFee: 550,  expressFee: 900,  estimatedDays: 2, expressHours: 12 },
    { name: 'North Eastern',counties: ['Garissa','Wajir','Mandera','Marsabit','Isiolo'], standardFee: 800,  expressFee: 1400, estimatedDays: 5, expressHours: 48 },
    { name: 'Pickup',    counties: ['Nairobi'],                                           standardFee: 0,    expressFee: 0,    estimatedDays: 0, expressHours: 0  },
  ]
  for (const zone of zones) {
    await prisma.deliveryZone.upsert({
      where:  { name: zone.name },
      update: zone,
      create: zone
    }).catch(() => {})
  }
  console.log('✓ Delivery zones seeded')

  // ── 5. LEGAL PAGES ────────────────────────────────────────────
  // Run separately if you haven't already:
  // npx ts-node prisma/seeds/legal-pages.ts
  console.log('ℹ Run legal pages seed separately if needed:')
  console.log('  npx ts-node prisma/seeds/legal-pages.ts')

  // ── 6. NOTIFICATION SETTINGS ──────────────────────────────────
  await prisma.notificationSettings.upsert({
    where:  { id: 'default' },
    update: {},
    create: {
      id:                  'default',
      emailOnNewOrder:     true,
      emailOnOrderShipped: true,
      emailOnLowStock:     true,
      emailOnQuoteRequest: true,
      smsOnNewOrder:       false,
      smsOnOrderShipped:   true,
      adminAlertEmail:     'admin@printhub.africa',
      lowStockAlertEmail:  'admin@printhub.africa',
    }
  })
  console.log('✓ Notification settings seeded')

  console.log('')
  console.log('✅ Production seed complete.')
  console.log('')
  console.log('🔔 CHECKLIST — fill in these placeholders in Admin → Settings:')
  console.log('   □ Physical address (addressLine1, addressLine2)')
  console.log('   □ Google Maps embed URL')
  console.log('   □ KRA PIN')
  console.log('   □ VAT number')
  console.log('   □ Business logo (upload in Settings → Business Profile)')
  console.log('   □ Change admin password immediately after first login')
}

seedProduction()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

Run it:
```bash
npx ts-node prisma/scripts/seed-production.ts
```

---

## PART 6 — PRE-LAUNCH FINAL CHECKLIST

Work through every item. Do not launch until all are ticked.

### Domain and SSL
```
□ https://printhub.africa loads your site (no SSL warning)
□ https://www.printhub.africa redirects to https://printhub.africa
□ http://printhub.africa redirects to https://printhub.africa
□ Page loads in under 3 seconds (run Lighthouse in Chrome DevTools)
```

### Payments
```
□ Send a real KES 1 M-Pesa STK push to your own phone → confirm it works
□ M-Pesa callback URL is set to https://printhub.africa/api/payments/mpesa/callback
   in the Safaricom Daraja portal (not localhost, not ngrok)
□ Paybill number showing correctly at checkout is your REAL Till/Paybill
□ Pickup option works — generates a pickup code
□ Test a KES 1 card payment via Pesapal (live mode)
```

### Email
```
□ Place a test order → order confirmation email arrives at your email
□ "From" address shows: hello@printhub.africa (not onboarding@resend.dev)
□ Emails don't land in spam (if they do, check SPF/DKIM records)
□ Quote submission confirmation email works
□ Admin notification email works (new order → admin@printhub.africa)
```

### SMS
```
□ Place a test order → SMS arrives on your real Kenyan phone number
□ SMS shows sender as "PrintHub" (not a random number)
□ AT account has sufficient balance (top up at least KES 500 to start)
```

### Data and content
```
□ No "Lorem ipsum" text visible on any public page
□ No "Team Member" placeholder names visible on /about
□ No "Map placeholder" visible on /about (replace with real Google Maps embed)
□ All product prices are in KES (not $)
□ Business name, address, phone, email show correctly in footer
□ All legal pages are published (Privacy Policy, Terms, Refund Policy, Cookie Policy)
□ Cookie consent banner appears for new visitors
□ KRA PIN and VAT number shown on invoices
```

### Admin
```
□ Log into /admin → change admin password immediately
□ /admin/orders shows empty (no test orders)
□ /admin/customers shows empty or only real staff accounts
□ Order number counter reset to 0 (first real order = PHUB-000001)
□ Business settings complete (address, logo, hours, Google Maps)
```

### Security
```
□ No API keys or passwords in the GitHub repository
   Run: git log --all --full-history -- "*.env*" (should return nothing)
□ All environment variables are in Vercel/Railway dashboard, NOT in code
□ NEXTAUTH_SECRET is a long random string (not "secret" or "password")
□ Admin login requires a strong password (change from seed default)
□ /admin is not accessible without login (test in incognito browser)
```

### Monitoring
```
□ Sentry is receiving events (trigger a test error and check Sentry dashboard)
□ Set up an uptime monitor at uptimerobot.com:
   - Monitor: https://printhub.africa (every 5 minutes)
   - Alert: SMS to your phone if site goes down
□ Google Analytics is tracking (check Realtime report in GA4)
```

### Before announcing to customers
```
□ Place one complete test order end-to-end as a new customer:
   Register → Browse shop → Add to cart → Checkout →
   Pay via M-Pesa STK → Receive confirmation email + SMS →
   Check order appears in admin → Update order status →
   Customer receives status update
□ Submit one test quote → Admin responds → Customer accepts
□ Test the /track page with a real order number
□ Test mobile view on your actual phone (not just browser dev tools)
```

---

*PrintHub Production Launch — printhub.africa*
*Go live checklist | An Ezana Group Company*
