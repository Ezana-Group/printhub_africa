Implement security separation between the customer storefront 
and admin/staff dashboard for PrintHub Africa on Next.js 
deployed on Railway.

Remote staff, mandatory 2FA with 7-day grace period, 
subdomain separation via Railway custom domains.
No IP allowlisting — use device registration and anomaly 
detection instead.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to .env.local (and mirror in Railway Dashboard → 
Service → Variables):

  # Existing — keep as is
  NEXTAUTH_URL=https://printhub.africa
  NEXTAUTH_SECRET=<existing — do not change>

  # New — admin auth (different secret, critical)
  ADMIN_NEXTAUTH_URL=https://admin.printhub.africa
  ADMIN_NEXTAUTH_SECRET=<generate new with: openssl rand -base64 32>

  # URLs
  NEXT_PUBLIC_APP_URL=https://printhub.africa
  NEXT_PUBLIC_ADMIN_URL=https://admin.printhub.africa

  # Admin session — 8 hours
  ADMIN_SESSION_MAX_AGE=28800

  # 2FA grace period — 7 days in seconds
  ADMIN_2FA_GRACE_PERIOD_SECONDS=604800

  # Railway does not need VERCEL_ variables
  # Remove any VERCEL_URL references from auth config

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. RAILWAY CUSTOM DOMAINS — DEVELOPER INSTRUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add a comment block at the top of middleware.ts with 
these Railway setup instructions for the developer.
Do not implement these in code — they are manual steps:

  /*
   * RAILWAY SETUP REQUIRED — do this before deploying:
   *
   * 1. Go to Railway Dashboard → Your Project → 
   *    PrintHub Service → Settings → Domains
   *
   * 2. Add custom domain: printhub.africa
   *    Railway will give you a CNAME or A record.
   *    Add it to your DNS provider.
   *
   * 3. Add second custom domain: admin.printhub.africa
   *    Same Railway service, same deployment.
   *    Add the DNS record your DNS provider.
   *    Railway serves both domains from the same container.
   *
   * 4. Railway → Service → Variables — add all env vars 
   *    from .env.local. They apply on next deploy.
   *
   * 5. Railway free plan supports 1 custom domain.
   *    Upgrade to Hobby ($5/month) before adding 
   *    admin.printhub.africa as the second domain.
   *
   * 6. SSL certificates are automatic on Railway — 
   *    no configuration needed for HTTPS.
   *
   * The Next.js middleware reads the 'host' header 
   * to detect which domain the request came from 
   * and applies the correct auth chain.
   */

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DATABASE ADDITIONS — ADD TO PRISMA SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these models to schema.prisma:

model AdminPreAuthToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model AdminTrustedDevice {
  id           String   @id @default(cuid())
  userId       String
  deviceToken  String   @unique
  deviceName   String?  // e.g. "Chrome on MacOS"
  ipAddress    String?
  country      String?
  city         String?
  lastSeenAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}

model AdminLoginEvent {
  id          String   @id @default(cuid())
  userId      String
  ipAddress   String
  userAgent   String?
  country     String?
  city        String?
  success     Boolean
  failReason  String?  // 'wrong_password' | 'invalid_2fa' | 'locked'
  deviceToken String?  // present if known device
  isNewDevice Boolean  @default(false)
  isNewLocation Boolean @default(false)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

Add these fields to the existing User model:

  // Admin 2FA
  adminTwoFactorSecret      String?
  adminTwoFactorEnabled     Boolean   @default(false)
  adminTwoFactorVerifiedAt  DateTime?
  adminTwoFactorBackupCodes String[]  // store as bcrypt hashes
  adminTwoFactorGraceEndsAt DateTime? // set on first admin login
  
  // Admin account security
  adminLastLoginAt          DateTime?
  adminLastLoginIP          String?
  adminFailedLoginCount     Int       @default(0)
  adminLockedUntil          DateTime?
  adminForceLogoutAt        DateTime? // set this to invalidate all sessions

  // Relations
  adminPreAuthTokens  AdminPreAuthToken[]
  adminTrustedDevices AdminTrustedDevice[]
  adminLoginEvents    AdminLoginEvent[]

After adding these, output this command for the developer:
  npx prisma migrate dev --name admin_security_separation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. SEPARATE NEXTAUTH CONFIGURATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE lib/auth-customer.ts:

  Export a NextAuth config for customers only.
  
  - Providers: Credentials, Google, Facebook, Apple, 
    Email Magic Link (existing providers — no changes)
  - Secret: process.env.NEXTAUTH_SECRET
  - Cookie name: 
      production:  __Host-ph-customer
      development: ph-customer-dev
  - Session maxAge: 30 days (existing)
  - Callbacks:
      signIn: reject if role is STAFF/ADMIN/SUPER_ADMIN
        return '/login?error=use-admin-portal'
      jwt: only include:
        id, role, isCorporate, corporateId, 
        emailVerified, displayName, phone
      session: map jwt to session shape (existing)
  - Pages: { signIn: '/login', error: '/login' }

CREATE lib/auth-admin.ts:

  Export a NextAuth config for staff/admin only.
  
  - Providers: Credentials ONLY
    No Google, Facebook, Apple or Magic Link for admin.
    Social login is a security risk for privileged accounts.
  - Secret: process.env.ADMIN_NEXTAUTH_SECRET
  - Cookie name:
      production:  __Host-ph-admin
      development: ph-admin-dev
  - Session maxAge: process.env.ADMIN_SESSION_MAX_AGE (8hrs)
  - Callbacks:
      signIn: 
        1. Reject if role is CUSTOMER
           return '/admin/login?error=customer-account'
        2. Check adminLockedUntil — if locked, reject
           return '/admin/login?error=account-locked'
        3. Check adminTwoFactorEnabled:
           - If enabled: require twoFactorVerified 
             flag in the credentials payload
             If not present: reject with 
             return '/admin/login/verify-2fa'
           - If NOT enabled: check grace period
             If adminTwoFactorGraceEndsAt is null:
               Set it to now + 7 days
               Allow login but flag mustSetup2FA = true
             If grace period has expired:
               Reject with return '/admin/setup/2fa'
             If still in grace period:
               Allow login, set mustSetup2FA = true
      jwt: include:
        id, role, permissions, displayName, email,
        mustSetup2FA, adminForceLogoutAt
      session:
        Check adminForceLogoutAt — if it is set 
        and is after the token's iat (issued at),
        invalidate the session by returning null.
        This allows SUPER_ADMIN to force-logout 
        a specific staff member immediately.
  - Pages: 
      { signIn: '/admin/login', error: '/admin/login' }

UPDATE app/api/auth/[...nextauth]/route.ts:

  import { NextRequest } from 'next/server'
  import NextAuth from 'next-auth'
  import customerAuthConfig from '@/lib/auth-customer'
  import adminAuthConfig from '@/lib/auth-admin'

  function isAdminRequest(req: NextRequest): boolean {
    const host = req.headers.get('host') ?? ''
    // Railway serves both domains from same container
    // Detect by subdomain in host header
    return (
      host.startsWith('admin.') ||
      host.includes('admin.printhub.africa') ||
      // Local development fallback:
      (process.env.NODE_ENV === 'development' && 
       req.nextUrl.searchParams.get('_admin') === '1')
    )
  }

  const handler = async (req: NextRequest, ctx: any) => {
    const config = isAdminRequest(req) 
      ? adminAuthConfig 
      : customerAuthConfig
    return NextAuth(config)(req, ctx)
  }

  export { handler as GET, handler as POST }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ADMIN LOGIN FLOW — STEP BY STEP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE app/(admin)/admin/login/page.tsx:

  Clean, minimal login form. No social buttons.
  Fields: Email, Password.
  Button: "Sign In"
  
  On submit: call NextAuth signIn('credentials', ...)
  
  On success:
    If mustSetup2FA is true in session:
      Show a yellow banner: 
      "Please set up two-factor authentication.
       You have [X days] remaining. [Set up now]"
      Still allow access to admin — grace period.
    
    If twoFactorRequired (2FA is enabled but not 
    yet verified this session):
      Redirect to /admin/login/verify-2fa
    
    Otherwise: redirect to /admin/dashboard
  
  Error messages — always generic:
    Any failure → "Invalid email or password."
    Never say which field is wrong.
    account-locked error → "This account has been 
    temporarily locked. Please try again later or 
    contact your administrator."
    customer-account error → "This email is registered 
    as a customer account. Please visit 
    printhub.africa to sign in."
    use-admin-portal error → show nothing on this page 
    (this error is for the customer login page)
  
  Footer: small grey text:
    "Customer? → printhub.africa"

CREATE app/(admin)/admin/login/verify-2fa/page.tsx:

  Single input for 6-digit TOTP code or SMS code.
  Title: "Two-Factor Verification"
  Subtitle: "Enter the code from your authenticator app"
  
  On submit: POST /api/admin/auth/verify-2fa
    { preAuthToken, code }
  
  On success: redirect to /admin/dashboard
  On failure (wrong code): 
    Show: "Incorrect code. Please try again."
    After 3 failures: 
      Lock the pre-auth token
      Show: "Too many attempts. Please sign in again."
      Redirect to /admin/login
  
  "Use a backup code instead" link below the input.
  "Resend SMS code" link if they use SMS 2FA.

CREATE app/(admin)/admin/setup/2fa/page.tsx:

  Force-shown to staff who have not set up 2FA 
  after their grace period expires, or when they 
  choose to set it up during grace period.
  
  STEP 1 — Show QR code:
    Generate TOTP secret with otplib
    Display QR code (use qrcode package)
    Display manual entry code for users who 
    cannot scan
    Instructions: "Scan with Google Authenticator, 
    Authy, or any TOTP app"
  
  STEP 2 — Verify setup:
    Input for 6-digit code
    "Verify and Enable" button
    On success: 
      Save secret to adminTwoFactorSecret
      Set adminTwoFactorEnabled = true
      Generate 8 backup codes (random, hash and store)
      Show backup codes once with download button:
      "Save these backup codes somewhere safe. 
       They will not be shown again."
    On failure: "Code incorrect. Try again."
  
  STEP 3 — Backup codes shown:
    List of 8 one-time backup codes
    "Download as text file" button
    "I have saved my backup codes" checkbox 
    must be ticked before they can continue
    On continue: redirect to /admin/dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. DEVICE REGISTRATION & ANOMALY DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On every successful admin login, run this logic 
in a server action or API route called immediately 
after session creation:

CREATE lib/admin-device-check.ts:

  export async function checkAdminLoginDevice(
    userId: string,
    req: NextRequest,
    sessionId: string
  ) {
    const ip = req.headers.get('x-forwarded-for')
              ?.split(',')[0]?.trim() 
              ?? req.headers.get('x-real-ip') 
              ?? 'unknown'
    
    const userAgent = req.headers.get('user-agent') ?? ''
    
    // Get approximate location from IP
    // Use ip-api.com free tier (no key needed, 
    // 45 req/min — sufficient for admin logins):
    let country = 'Unknown', city = 'Unknown'
    try {
      const geo = await fetch(
        `http://ip-api.com/json/${ip}?fields=country,city,status`,
        { signal: AbortSignal.timeout(3000) }
      ).then(r => r.json())
      if (geo.status === 'success') {
        country = geo.country
        city = geo.city
      }
    } catch { /* geo lookup is non-critical, never fail login */ }

    // Check for known device cookie
    const deviceToken = req.cookies.get('ph-admin-device')?.value
    const knownDevice = deviceToken 
      ? await prisma.adminTrustedDevice.findUnique({
          where: { deviceToken }
        }) 
      : null

    const isNewDevice = !knownDevice
    
    // Check if new location vs previous logins
    const previousLogin = await prisma.adminLoginEvent.findFirst({
      where: { userId, success: true, country },
      orderBy: { createdAt: 'desc' }
    })
    const isNewLocation = !previousLogin && country !== 'Unknown'

    // Log the login event
    await prisma.adminLoginEvent.create({
      data: {
        userId, ipAddress: ip, userAgent,
        country, city, success: true,
        deviceToken: knownDevice?.deviceToken,
        isNewDevice, isNewLocation,
      }
    })

    // Register device if new
    if (isNewDevice) {
      const newDeviceToken = crypto.randomUUID()
      await prisma.adminTrustedDevice.create({
        data: {
          userId,
          deviceToken: newDeviceToken,
          deviceName: parseDeviceName(userAgent),
          ipAddress: ip,
          country, city,
        }
      })
      // Return new device token to be set as cookie
      // in the response (7 day cookie)
    }

    // Send alert emails
    if (isNewDevice || isNewLocation) {
      await sendAdminSecurityAlert({
        userId,
        type: isNewDevice ? 'new_device' : 'new_location',
        ip, country, city,
        deviceName: parseDeviceName(userAgent),
        timestamp: new Date(),
      })
      // Also notify SUPER_ADMIN if new location
      if (isNewLocation) {
        await notifySuperAdmins({
          subject: `[Security] New location login — ${city}, ${country}`,
          userId, ip, country, city,
        })
      }
    }

    return { isNewDevice, newDeviceToken: isNewDevice ? newToken : null }
  }

  The security alert email to the staff member should:
    Subject: "New sign-in to your PrintHub Admin account"
    Body: "A new sign-in was detected on your account.
           Time: [timestamp]
           Location: [city, country]
           Device: [browser/OS]
           IP Address: [ip]
           
           If this was you, no action is needed.
           If this was NOT you, click here immediately:
           [Secure my account — signs out all sessions]"
    
    The "Secure my account" link calls a route that:
      Sets adminForceLogoutAt = now() on the user
      This invalidates all active sessions immediately
      (the JWT callback checks this field)
      Sends another email confirming all sessions ended

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. CONCURRENT SESSION CONTROL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Admin accounts may only have ONE active session at a time.

When an admin successfully logs in:
  1. Set adminForceLogoutAt = null (clear any old lockout)
  2. Store the new sessionId in the user record:
     Add field adminActiveSessionId String? to User model
  3. Set adminActiveSessionId = new session ID

In the JWT callback of auth-admin.ts:
  On every token refresh, check:
    If token.sessionId !== user.adminActiveSessionId:
      Return null (invalidates this session)
      The middleware will redirect to login with message:
      "You were signed in from another device. 
       This session has been ended."

  This means if a staff member logs in on their phone 
  while already logged in on their laptop, the laptop 
  session ends immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. INACTIVITY TIMEOUT — ADMIN FRONTEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE components/admin/SessionTimeoutGuard.tsx:

  Client component — wrap the entire admin layout with this.
  
  const INACTIVITY_LIMIT_MS = 30 * 60 * 1000  // 30 minutes
  const WARNING_BEFORE_MS   = 60 * 1000         // warn 60s before

  - Track last activity: update on mousemove, keydown, 
    click, touchstart (throttled to once per 30 seconds 
    to avoid excessive state updates)
  - Store lastActivity in a ref (not state — no re-renders)
  - setInterval every 30 seconds to check elapsed time
  - When (now - lastActivity) > (INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS):
      Show modal: "Still there?"
      "Your session will expire in [countdown] seconds 
       due to inactivity."
      Button: "Keep me signed in"
      If clicked: reset lastActivity, close modal
  - When (now - lastActivity) > INACTIVITY_LIMIT_MS:
      Call signOut({ callbackUrl: '/admin/login?reason=inactivity' })
  
  On /admin/login page, if reason=inactivity in URL:
    Show: "You were signed out due to inactivity."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. MIDDLEWARE — SUBDOMAIN DETECTION FOR RAILWAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE middleware.ts:

  Railway sets the correct host header automatically
  when you have both domains pointing to the same service.
  The middleware detects which chain to use from the 
  host header — no additional Railway configuration needed.

  export async function middleware(req: NextRequest) {
    const host = req.headers.get('host') ?? ''
    const pathname = req.nextUrl.pathname

    // Detect admin context
    // Works on Railway because Railway forwards 
    // the original domain in the host header
    const isAdminHost = host.startsWith('admin.')
    const isAdminPath = pathname.startsWith('/admin')

    // On admin subdomain: ONLY serve admin routes
    if (isAdminHost && !isAdminPath) {
      // Redirect bare admin.printhub.africa to dashboard
      return NextResponse.redirect(
        new URL('/admin/dashboard', req.url)
      )
    }

    // On customer domain: block /admin/* entirely
    if (!isAdminHost && isAdminPath) {
      // Return 404 — do not reveal admin exists 
      // on the customer domain
      return new NextResponse(null, { status: 404 })
    }

    if (isAdminHost || isAdminPath) {
      return handleAdminMiddleware(req)
    }

    return handleCustomerMiddleware(req)
  }

  async function handleAdminMiddleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    // Public admin routes — no auth needed
    const publicAdminRoutes = [
      '/admin/login',
      '/admin/login/verify-2fa',
      '/admin/auth',  // NextAuth callbacks
    ]
    if (publicAdminRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.next()
    }

    // 2FA setup page — allowed if session exists 
    // even without 2FA (for grace period users)
    if (pathname.startsWith('/admin/setup/2fa')) {
      // Just check they have any admin session
      // The page itself handles the rest
      return NextResponse.next()
    }

    // All other admin routes — require full session
    // Use existing requireAdminSection logic here
    // adapted to use the admin cookie name
    const session = await getAdminServerSession(req)
    if (!session) {
      return NextResponse.redirect(
        new URL('/admin/login', req.url)
      )
    }

    return NextResponse.next()
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. 7-DAY 2FA GRACE PERIOD IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a STAFF/ADMIN user logs in for the first time 
after this system is deployed, and they do not have 
adminTwoFactorEnabled = true:

  1. Check adminTwoFactorGraceEndsAt:
     - If null: set it to now + 7 days, save to DB
     - If set and in the future: grace period active
     - If set and in the past: grace period expired

  2. Grace period ACTIVE:
     - Allow login
     - Set mustSetup2FA = true in the session JWT
     - Show persistent yellow banner on every admin page:
       "ACTION REQUIRED: Set up two-factor authentication.
        Your grace period expires in [X days, Y hours].
        [Set Up 2FA Now →]"
     - The banner cannot be dismissed
     - All admin functionality still works normally

  3. Grace period EXPIRED:
     - Do NOT allow login
     - Redirect immediately to /admin/setup/2fa
     - They cannot access anything else until 2FA is set up
     - Show: "Two-factor authentication is required 
       for all staff accounts. Please set it up to continue."

  4. 2FA ENABLED (normal state):
     - Login proceeds normally through verify-2fa step
     - No banner shown

  IMPORTANT: Run a migration script once at deployment 
  that sets adminTwoFactorGraceEndsAt = now + 7 days 
  for ALL existing STAFF/ADMIN/SUPER_ADMIN users who 
  do not yet have adminTwoFactorEnabled = true.
  This gives the whole team exactly 7 days from 
  deployment day to set up 2FA.

  CREATE scripts/set-2fa-grace-period.ts:
    import { PrismaClient } from '@prisma/client'
    const prisma = new PrismaClient()
    
    async function main() {
      const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const result = await prisma.user.updateMany({
        where: {
          role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
          adminTwoFactorEnabled: false,
          adminTwoFactorGraceEndsAt: null,
        },
        data: { adminTwoFactorGraceEndsAt: graceEnd }
      })
      console.log(`Set grace period for ${result.count} users`)
      console.log(`Grace period ends: ${graceEnd.toISOString()}`)
    }
    main()

  Output the command to run this script:
    npx ts-node scripts/set-2fa-grace-period.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. SUPER ADMIN SECURITY DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add a page at /admin/settings/security (SUPER_ADMIN only):

  SECTION 1 — Staff 2FA Status:
    Table of all STAFF/ADMIN users showing:
    Name | Role | 2FA Enabled | Grace Period Ends | 
    Last Login | Last Login Location | Actions
    
    Actions per row:
    "Force 2FA Setup" — sets grace period to expired, 
      forcing them to set up on next login
    "Reset 2FA" — clears their 2FA secret so they 
      must set up a new authenticator (use if they 
      lose their phone)
    "Force Sign Out" — sets adminForceLogoutAt = now()
      immediately ends all their active sessions

  SECTION 2 — Recent Login Events:
    Table of last 50 AdminLoginEvent records across 
    all staff, newest first.
    Highlight rows where isNewDevice or isNewLocation is true.
    Show: Staff Name | Time | Location | Device | 
    Success/Failed | New Device? | New Location?

  SECTION 3 — Active Sessions:
    List of staff currently logged in 
    (adminActiveSessionId is not null and 
    session would not yet be expired).
    Show: Name | Login Time | Location | Device
    "End Session" button per row.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. DO NOT CHANGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Do not change any customer-facing routes, checkout, 
  M-Pesa, order flow, or existing customer auth
- Do not change admin UI pages — only auth layers change
- Do not remove the existing role/permission system
- Do not change any existing API routes
- Do not change anything related to Stripe, Pesapal, 
  Flutterwave or Africa's Talking integrations
- Railway-specific: do not add any Vercel-specific 
  packages or APIs (no @vercel/edge-config, 
  no @vercel/analytics unless already present,
  no VERCEL_ environment variable references in 
  new code)
- TypeScript strict mode throughout — no 'any' types