# PrintHub Africa — Security Policy & Incident Response

This document outlines the security procedures, key rotation policies, and incident response steps for the PrintHub Africa platform.

## 1. Mandatory Security Controls

### 1.1 Virus Scanning (VirusTotal)
- **Status:** MANDATORY in production.
- **Enforcement:** The application will fail to boot if `VIRUSTOTAL_API_KEY` is not present in a production environment.
- **Behavior:** All file uploads are scanned. Files marked `PENDING` or `INFECTED` are blocked from public download and administrative use.

### 1.2 Administrative Access
- **Isolation:** Admin portal is accessible ONLY via the `admin.*` subdomain.
- **Session TTL:** 
  - Standard Admin: 8 hours
  - Super Admin: 4 hours
- **Hardware Security:** 2FA is mandatory for all administrative accounts.

### 1.3 Order Integrity (Price Recalculation)
- **Status:** MANDATORY.
- **Enforcement:** All orders (Storefront & Admin) must use `calculateOrderPriceServerSide`.
- **Behavior:** The server ignores price data from the client, recalculating the final total from the ground truth database (Product pricing, Variant overrides, Dynamic VAT, Corporate discounts).
- **Audit:** Any detected mismatch between client-sent prices and server-calculated prices is logged as `ORDER_PRICE_MISMATCH` with severity `SECURITY_CRITICAL`.

### 1.4 SSRF Prevention (Catalogue Import)
- **Status:** MANDATORY.
- **Enforcement:** Strict URL validation in the import API.
- **Behavior:** Blocks internal/private IP addresses (127.0.0.1, localhost, VPC ranges) and enforces a strict domain allowlist for external imports.
- **Audit:** Blocked attempts are recorded in the `AuditLog` as `BLOCKED_IMPORT_URL`.

### 1.5 Warranty Data Scoping
- **Status:** MANDATORY.
- **Enforcement:** All warranty lookups are strictly scoped to the `customerId` from the session.
- **Rate Limiting:** Maximum 10 lookups per hour per user/IP to prevent serial number enumeration.
- **Audit:** Failed lookups (serial numbers not found for the user) are logged to detect brute-force activity.

---

## 2. Key Rotation Policy

To minimize the impact of credential leakage, the following rotation schedule is enforced:

| Service Category | Examples | Rotation Frequency |
|------------------|----------|--------------------|
| **AI Services** | OpenAI, Anthropic, ElevenLabs | Every 90 Days |
| **Payment Gateways** | M-Pesa, Pesapal, Stripe | Every 180 Days |
| **Communication** | Resend, Africa's Talking | Every 180 Days |
| **Infrastructure** | Database, R2, Redis | Annually / On-Demand |

### Rotation Procedure
1. Generate new key in the provider dashboard.
2. Update environment variables in Railway (Production & Staging).
3. Update n8n credentials if applicable.
4. Verify system health and integration logs.
5. Deactivate the old key.

---

## 3. Operational Controls & Limits

### 3.1 AI Spend Limits
- **ElevenLabs:** Monthly character limit is set in the `BusinessSettings` and enforced via `AiServiceLog` monitoring.
- **OpenAI/Claude:** Hard monthly spend limits are configured in the respective provider dashboards.

### 3.2 SMS Broadcasts
- **Opt-In:** Sending is strictly restricted to users with `smsMarketingOptIn: true`.
- **Rate Limiting:** Maximum 1 broadcast per hour per admin to prevent accidental spam or CA enforcement.
- **Audit:** All broadcasts are logged in the `AuditLog` including message content and recipient count.

### 3.3 Content Lifecycle (Human review gate)
- **Status:** MANDATORY for Blog Posts.
- **Workflow:** `DRAFT` -> `PENDING_REVIEW` -> `PUBLISHED` (requires explicit staff approval).
- **Enforcement:** The `PUBLISHED` status cannot be set via standard `PATCH` routes; it requires a dedicated `/publish` endpoint which logs the authorizing administrator.

---

## 4. Incident Response Plan

In the event of a suspected security breach:

1.  **Credential Compromise:**
    - Immediately rotate the affected API key or password.
    - Revoke all active `AdminSession` records in the database.
    - Review `AuditLog` for unauthorized mutations during the compromise window.
2.  **Suspicious Login (Impossible Travel):**
    - The system automatically revokes the session and alerts `SUPER_ADMIN`.
    - Admin must verify identity via out-of-band communication before account reactivaton.
3.  **Data Leakage:**
    - Identify the scope of leaked data.
    - Follow Kenyan Data Protection Act (ODPC) notification procedures if personal identifiable information (PII) is involved.

---

## 5. Audit & Compliance
- **Audit Logs:** All administrative actions are recorded with `before` and `after` state snapshots.
- **Redaction:** Sensitive fields (passwords, hashes, tokens) are automatically masked in log snapshots.
- **Database Backups:** Automated daily backups with point-in-time recovery enabled.

*Last Reviewed: April 5, 2026*
