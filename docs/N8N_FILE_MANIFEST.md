# PrintHub n8n File Manifest

Below is a complete index of all Next.js files created or modified to support the n8n automation infrastructure:

### Core Logic & Utilities
- `lib/n8n.ts`: Typed trigger utility functions for all PrintHub n8n workflows with HMAC signature signing.
- `lib/n8n-verify.ts`: Security middleware to verify incoming n8n webhook signatures using SHA256 HMAC.

### Internal API Endpoints (n8n Callbacks)
- `app/api/n8n/get-abandoned-carts/route.ts`: Endpoint for n8n cron to fetch high-intent carts for recovery marketing.
- `app/api/n8n/stock-levels/route.ts`: Endpoint for n8n cron to audit inventory and notify staff of low stock.
- `app/api/n8n/mark-product-exported/route.ts`: Updates product status after successful n8n sync to social platforms (Google/Meta/etc).
- `app/api/n8n/generate-coupon/route.ts`: Generates dynamic single-use discount codes for cart recovery sequences.
- `app/api/n8n/log-error/route.ts`: Centralized error logging for n8n workflow failures into the PrintHub Audit Log.
- `app/api/n8n/mark-alert-sent/route.ts`: De-duplicates security and stock alerts to prevent notification fatigue.
- `app/api/n8n/check-quote-status/route.ts`: Endpoint for n8n cron to monitor and remind customers of expiring quotes.
- `app/api/n8n/cleanup-sessions/route.ts`: Periodic cleanup of expired auth sessions and audit log retention.

### Admin Portal Integration
- `app/api/admin/n8n/sso/route.ts`: Secure JWT-based Single Sign-On allowing admins seamless access to the n8n dashboard.
- `app/api/admin/system/n8n-health/route.ts`: Backend service for polling the n8n container health status from the dashboard.
- `components/admin/n8n-health-card.tsx`: UI component displaying the real-time operational status of the automation engine.
- `app/(admin)/admin/dashboard/page.tsx`: Integrated health monitoring and quick-access links to the automation portal.
- `components/admin/admin-nav.tsx`: Admin navigation updated with "Automations" link (Restricted to ADMIN roles).

### Deployment & DevOps
- `n8n/Dockerfile`: Standardized n8n base image configuration for self-hosting.
- `n8n/railway.toml`: Deployment orchestration for Railway including health checks and environment mapping.
- `n8n/workflows/`: Central repository for importable n8n workflow JSON blueprints.
