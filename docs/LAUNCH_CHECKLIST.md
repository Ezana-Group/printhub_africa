# 🚀 PrintHub — Production Launch Checklist

**printhub.africa | An Ezana Group Company**

Work through each section in order. Do not launch until all items are ticked.

---

## PART 1 — Domain & hosting

- [ ] **printhub.africa** added in Vercel (or Railway) → Settings → Domains
- [ ] DNS: A record `@` → `76.76.21.21` (Vercel) or CNAME to your host
- [ ] DNS: CNAME `www` → `cname.vercel-dns.com` (or host’s value)
- [ ] https://printhub.africa loads with a valid SSL padlock
- [ ] https://www.printhub.africa redirects to https://printhub.africa
- [ ] http://printhub.africa redirects to https://printhub.africa

---

## PART 2 — Live credentials (no sandbox/test)

### M-Pesa Daraja
- [ ] App approved for **Production** (developer.safaricom.co.ke)
- [ ] Live Consumer Key & Secret in env (replace sandbox)
- [ ] Live Paybill/Till and Passkey in env
- [ ] `MPESA_ENV=production`
- [ ] Callback URL in Daraja portal: `https://printhub.africa/api/payments/mpesa/callback`

### Pesapal
- [ ] KYC verified; live API credentials in env
- [ ] `PESAPAL_ENV=live`
- [ ] `PESAPAL_IPN_URL=https://printhub.africa/api/payments/pesapal/ipn`

### Resend
- [ ] Domain `printhub.africa` added and verified (SPF/DKIM/DMARC)
- [ ] `FROM_EMAIL=hello@printhub.africa` (not onboarding@resend.dev)

### Africa’s Talking
- [ ] Live API key (not sandbox)
- [ ] `AT_USERNAME` = your real username (not "sandbox")
- [ ] `AT_ENV=live`
- [ ] Account topped up (e.g. KES 500+)

### OAuth
- [ ] Google: Authorized redirect URI includes `https://printhub.africa/api/auth/callback/google`
- [ ] Facebook: Valid OAuth Redirect URI includes `https://printhub.africa/api/auth/callback/facebook`; App Domains includes `printhub.africa`

### Sentry
- [ ] `SENTRY_ENVIRONMENT=production`
- [ ] Alert rule in Sentry to email on new errors

---

## PART 3 — Production environment variables

Set in Vercel/Railway (or host) for **Production**:

- [ ] `NEXT_PUBLIC_APP_URL=https://printhub.africa`
- [ ] `NEXTAUTH_URL=https://printhub.africa`
- [ ] `NEXTAUTH_SECRET` = long random string (e.g. `openssl rand -base64 32`)
- [ ] `DATABASE_URL` & `DIRECT_URL` = production Neon (or DB) URLs
- [ ] R2, Resend, AT, M-Pesa, Pesapal, Google/Facebook, Sentry, GA — all set for production (see `.env.example` and Part 2)
- [ ] `ADMIN_EMAIL=admin@printhub.africa`
- [ ] `CRON_SECRET` = random secret for cron routes

---

## PART 4 — Clean test data

**Run once, only against the production DB when you are ready to go live.**

```bash
npx tsx prisma/scripts/clean-test-data.ts
```

- [ ] Script run; orders, quotes, test users, test products/catalogue, support tickets, reviews cleaned
- [ ] Invoice and quote_pdf counters reset

---

## PART 5 — Seed production data

**After Part 4:**

```bash
npx tsx prisma/scripts/seed-production.ts
```

- [ ] Admin account created: `admin@printhub.africa` (default password set)
- [ ] Business settings seeded (address/hours/contact — fill placeholders in Admin)
- [ ] Departments and delivery zones seeded
- [ ] Legal pages seeded if needed: `npx tsx prisma/seeds/legal-pages.ts`

---

## PART 6 — Pre-launch checks

### Domain & SSL
- [ ] https://printhub.africa loads in under ~3 s (e.g. Lighthouse)
- [ ] No mixed content or SSL warnings

### Payments
- [ ] Real KES 1 M-Pesa STK push to your phone succeeds
- [ ] Paybill/Till at checkout is your real number
- [ ] Cash on pickup generates a pickup code
- [ ] Optional: KES 1 card payment via Pesapal (live) works

### Email
- [ ] Test order → confirmation email received
- [ ] “From” shows `hello@printhub.africa`
- [ ] Emails not in spam (check SPF/DKIM if needed)
- [ ] Quote confirmation and admin new-order email work

### SMS
- [ ] Test order → SMS received; sender “PrintHub”
- [ ] AT balance sufficient

### Content & data
- [ ] No “Lorem ipsum” or “Team Member” placeholders on public pages
- [ ] Real Google Maps on /about (no “Map placeholder”)
- [ ] All prices in KES
- [ ] Footer: correct business name, address, phone, email
- [ ] Legal pages published (Privacy, Terms, Refund, Cookie)
- [ ] Cookie consent banner appears for new visitors

### Admin
- [ ] Login at /admin; **change admin password immediately**
- [ ] /admin/orders empty (or only intended data)
- [ ] /admin/customers as expected
- [ ] First real order will be PHUB-000001 (counters reset)
- [ ] Business settings complete (address, logo, hours, map)

### Security
- [ ] No `.env` or secrets in repo: `git log --all -- "*.env"` returns nothing
- [ ] All secrets in host env only; `NEXTAUTH_SECRET` is strong
- [ ] /admin not accessible when logged out (incognito test)

### Monitoring
- [ ] Sentry receives a test error
- [ ] Uptime monitor (e.g. UptimeRobot) on https://printhub.africa; alert to your phone
- [ ] GA4 Realtime shows traffic when you browse

### End-to-end
- [ ] Full test: Register → Shop → Cart → Checkout → M-Pesa → Email + SMS → Order in admin → Status update → Customer sees update
- [ ] One test quote: Submit → Admin responds → Accept
- [ ] /track works with a real order number
- [ ] Mobile view tested on a real device

---

## Scripts reference

| Step        | Command |
|------------|--------|
| Clean test data | `npx tsx prisma/scripts/clean-test-data.ts` |
| Seed production | `npx tsx prisma/scripts/seed-production.ts` |
| Legal pages     | `npx tsx prisma/seeds/legal-pages.ts` |

---

*PrintHub Production Launch — printhub.africa | An Ezana Group Company*
