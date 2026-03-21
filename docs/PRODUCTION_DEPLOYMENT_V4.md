# Production Deployment Guide — PrintHub Africa (V4 Security Edition)

This guide provides step-by-step instructions for deploying the PrintHub Africa application (V1.3+) with the new **isolated Admin Security Architecture**.

## 1. Prerequisites
- **Hosting**: Vercel (recommended for Next.js 15 App Router).
- **Database**: PostgreSQL (Neon is recommended for its serverless pooling and direct URL support).
- **Domain**: Access to your DNS provider (e.g., Cloudflare, GoDaddy) to configure subdomains.
- **File Storage**: Cloudflare R2 bucket (S3-compatible).
- **Email**: Resend API key for transaction emails and 2FA.

---

## 2. Environment Variables Configuration

Copy the following into your Vercel/Railway environment settings. All variables are required for a fully functional production environment.

### 2.1 Core & Database
- `NODE_ENV`: `production`
- `DATABASE_URL`: Your pooled PostgreSQL connection string (Neon port 5432 or 6543).
- `DIRECT_URL`: Your direct PostgreSQL connection string (required for Prisma migrations).

### 2.2 Customer Authentication (www.printhub.africa)
- `NEXTAUTH_URL`: `https://www.printhub.africa`
- `NEXTAUTH_SECRET`: A long, unique random string (generate with `openssl rand -base64 32`).
- `NEXT_PUBLIC_APP_URL`: `https://www.printhub.africa`

### 2.3 Admin Authentication (admin.printhub.africa)
- `ADMIN_NEXTAUTH_URL`: `https://admin.printhub.africa`
- `ADMIN_NEXTAUTH_SECRET`: A **different** unique random string compared to the customer secret.
- `NEXT_PUBLIC_ADMIN_URL`: `https://admin.printhub.africa`
- `ADMIN_SESSION_MAX_AGE`: `1800` (In seconds; 30 minutes for inactivity logout).
- `ADMIN_2FA_GRACE_PERIOD_SECONDS`: `604800` (7 days for new staff 2FA setup).

### 2.4 External Integrations
- `RESEND_API_KEY`: Your Resend API key.
- `R2_BUCKET_NAME`: Name of your Cloudflare R2 bucket.
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`: Your R2 credentials.
- `R2_ENDPOINT`: Your R2 endpoint URL.
- `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET`: Daraja Portal keys.
- `MPESA_PASSKEY`: STK Push passkey.
- `AT_USERNAME` / `AT_API_KEY`: Africa's Talking credentials (if using SMS 2FA).

---

## 3. Subdomain & DNS Setup

The new security model relies on **Subdomain Isolation** to separate session cookies.

### 3.1 DNS Records
Create the following `A` or `CNAME` records pointing to your Vercel deployment:
1. `www.printhub.africa` -> (Pointing to Vercel)
2. `admin.printhub.africa` -> (Pointing to Vercel)
3. `printhub.africa` -> (Optional: Redirect to www)

### 3.2 Vercel Domain Settings
In the Vercel Dashboard under **Settings > Domains**:
- Add `www.printhub.africa`.
- Add `admin.printhub.africa`.
- Ensure **Middleware** is enabled (it handles the internal routing based on these hostnames).

---

## 4. Database Setup & Migrations

### 4.1 Apply Migrations
The deployment requires the new schema fields for admin security (`adminTwoFactorEnabled`, `adminLockedUntil`, etc.). From your local terminal with the production `DIRECT_URL` set:
```bash
# Verify the types are generated locally first
npx prisma generate

# Apply migrations to the production database
npx prisma migrate deploy
```

### 4.2 Seed Initial Data (Optional)
If this is a fresh database, run the seed script to create the initial categories and the Super Admin user:
```bash
npx prisma db seed
```

### 4.3 Backfill Staff 2FA Grace Period
For existing staff accounts that need to be transitioned to the new 2FA requirement, run the migration script:
```bash
npx ts-node scripts/set-2fa-grace-period.ts
```
*Note: Ensure the local environment where you run this has the production `DATABASE_URL` accessible.*

---

## 5. Deployment Steps (Vercel)

1. **Connect GitHub**: Connect the `ProdV4_Sec` branch to your Vercel project.
2. **Build Configuration**:
   - Build Command: `npm run build` (This automatically runs `prisma generate && next build`).
   - Output Directory: `.next`
3. **Deploy**: Trigger the deployment.

---

## 6. Post-Deployment Verification

1. **Customer Side**: Visit [www.printhub.africa](https://www.printhub.africa). Log in with a standard customer account and ensure the session cookie is named `next-auth.session-token`.
2. **Admin Side**: Visit [admin.printhub.africa](https://admin.printhub.africa).
   - Log in with staff credentials. 
   - Verify you are prompted for **2FA Setup** (if not done) or **2FA Verification**.
   - Ensure the session cookie is named `admin-auth.session-token`.
3. **Isolation Check**: Log in as an admin on `admin.`. Then visit `www.`. You should **not** be automatically logged into the customer storefront as an admin, as the cookies are isolated by subdomain.
4. **Inactivity Check**: Wait 30 minutes (or temporarily lower `ADMIN_SESSION_MAX_AGE`) to confirm the `SessionTimeoutGuard` correctly redirects to the login page.

---

## 7. Troubleshooting

- **CORS Errors**: Ensure `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_ADMIN_URL` are set correctly, as the API origin checks against these.
- **NextAuth Token Mismatch**: If you see "Invalid Session" errors, verify that `ADMIN_NEXTAUTH_SECRET` is set and distinct from the customer secret.
- **Subdomain Routing Failures**: If `admin.` redirects to the storefront home page, verify the `Host` header is being passed correctly through your CDN/Vercel (it usually is by default).

*End of Deployment Guide.*
