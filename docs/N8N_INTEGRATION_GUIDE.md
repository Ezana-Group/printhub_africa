# PrintHub Africa - n8n Integration & Setup Guide

This guide covers the finalized n8n automation infrastructure, including credentials, deployment on Railway, and verification.

---

## 1. Credentials Setup Guide (Expanded)

To enable all 12 workflows, you must configure the following external services in the **n8n Credentials** panel.

### 1.1 WhatsApp Business (Meta)
- **What to get**: `WHATSAPP_PHONE_ID` and `WHATSAPP_TOKEN` (Permanent Access Token).
- **Where**: [Meta for Developers](https://developers.facebook.com) → Your App → WhatsApp → Getting Started.
- **n8n Setup**: Use **Header Auth** with `Authorization: Bearer <token>`.
- **Screenshot Description**: The "Temporary access token" section in Meta dashboard (ensure you generate a permanent one in System Users).

### 1.2 Resend (Emails)
- **What to get**: `RESEND_API_KEY`.
- **Where**: [Resend.com](https://resend.com) → API Keys.
- **n8n Setup**: Header Auth: `Authorization: Bearer <key>`.
- **Screenshot Description**: The dashboard showing the green "Create API Key" button and the key string.

### 1.3 Social Media Flags (n8n API)
- Ensure all 9 social media flags are enabled in PrintHub `.env`:
  `EXPORT_GOOGLE_MERCHANT=true`, etc.

---

## 2. Railway Setup Checklist

Follow these steps to deploy the n8n container to Railway:

- [ ] **Create New Project**: Select "Empty Project" in Railway.
- [ ] **Add PostgreSQL Add-on**: (Separate from the main PrintHub DB). Create a new Postgres instance within the n8n project.
- [ ] **Deploy from Dockerfile**: 
  - Point Railway to the `n8n/` directory.
  - Builder: `DOCKERFILE`.
- [ ] **Set Environment Variables**:
  - `N8N_WEBHOOK_SECRET`: Should match PrintHub's `N8N_WEBHOOK_SECRET`.
  - `N8N_ENCRYPTION_KEY`: A unique random string.
  - `WEBHOOK_URL`: `https://n8n.printhub.africa/`.
  - `DATABASE_URL`: Use the URL from the Railway Postgres add-on.
- [ ] **Custom Domain**: 
  - Add `n8n.printhub.africa`.
  - DNS: Add a **CNAME** record for `n8n` pointing to the Railway-provided domain.

---

## 3. Testing Checklist (Scenario Verification)

Run these tests to verify the integration is 100% operational:

### 3.1 Order Lifecycle
- [ ] **Place Test Order**: Confirm WhatsApp and Email are received immediately.
- [ ] **Abandon Cart**: Wait 1 hour (or trigger cron manually) → Verify stage 1 recovery email with 10% coupon.

### 3.2 Marketing & Sales
- [ ] **Publish Product**: Set all 9 export flags → Verify n8n webhook receives payload and branches to all 9 platforms.
- [ ] **Low Stock Cron**: Manually run the Stock Audit cron → Verify staff receive notification.

### 3.3 Security & Admin
- [ ] **Trigger Security Alert**: (e.g., attempt impossible travel login) → Verify SUPER_ADMIN receives Email + SMS.
- [ ] **Admin Sidebar**: Log in as ADMIN → Confirm "Automations" link is visible and opens n8n via SSO.
- [ ] **Role Access**: Log in as STAFF → Attempt to access `/api/admin/n8n/sso` → Confirm 403 Forbidden.

---

## 4. n8n Import Instructions

1. Log into `https://n8n.printhub.africa`.
2. Go to **Workflows** → **Import from File**.
3. Select `n8n/workflows/printhub_automations.json`.
4. Select `n8n/workflows/printhub_crons.json`.
5. Activate all workflows.
