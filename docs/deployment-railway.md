# Railway Deployment Guide - PrintHub Africa

This guide covers deploying the Next.js application to Railway with a **Subdomain-based Architecture** (Main site + Admin portal) and the **n8n Automation Engine**.

## 1. Prerequisites
- A Railway account connected to your GitHub repository.
- A **Neon PostgreSQL** database.
- Custom domains (e.g., `printhub.africa`).

## 2. Setting Up Domains on Railway

To support the subdomain architecture, you must add **three** custom domains to your Railway project (either in one service or separate services):

1.  **Main Domain**: `printhub.africa` (Next.js Root)
2.  **Admin Domain**: `admin.printhub.africa` (Next.js Admin Rewrites)
3.  **Automation Domain**: `n8n.printhub.africa` (n8n Service)

## 3. Environment Variables (Next.js Service)

### Core App Settings
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://printhub.africa` | Root URL |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `.printhub.africa` | Cookie scope |
| `NEXT_PUBLIC_ADMIN_DOMAIN` | `admin.printhub.africa` | Admin session isolation |
| `NEXTAUTH_URL` | `https://printhub.africa` | Auth callback origin |
| `DATABASE_URL` | `postgres://...` | Connection pooled (Neon) |
| `DIRECT_URL` | `postgres://...` | Migrations (Neon) |

### Automation (n8n) Settings
| Variable | Value | Description |
| :--- | :--- | :--- |
| `N8N_WEBHOOK_BASE_URL` | `https://n8n.printhub.africa/webhook` | Webhook target for triggers |
| `N8N_WEBHOOK_SECRET` | `your-secure-secret` | SHA256 Key for trigger signing |
| `N8N_API_KEY` | `n8n_api_...` | For health checks (optional) |

## 4. n8n Self-Hosted Setup (Railway)

1.  **Deployment**: Use the `n8n/Dockerfile` and `n8n/railway.toml` provided in the repository.
2.  **Variables**: 
    - `N8N_ENCRYPTION_KEY`: A unique random string.
    - `N8N_USER_MANAGEMENT_DISABLED`: `false` (highly recommended).
    - `WEBHOOK_URL`: `https://n8n.printhub.africa/`
3.  **Import**: Once deployed, log in and import the JSON workflows from the `n8n/workflows/` directory.

## 5. Deployment Workflow

1.  **Migrations**: Railway runs `npm run build` which includes `prisma generate`. Migrations are applied via `npx prisma migrate deploy` in the `postbuild` or as a Railway deploy action.
2.  **Middleware**: The `middleware.ts` automatically detects the `admin.` subdomain and handles rewrites.
3.  **SSO**: Admins clicking "Automations" are automatically logged into n8n via a JWT-based SSO flow at `/api/admin/n8n/sso`.

## 6. Troubleshooting

- **Signature Mismatch**: Ensure `N8N_WEBHOOK_SECRET` is identical in both the Next.js and n8n environment variables.
- **SSO Failures**: Check that `NEXTAUTH_SECRET` is set correctly; it is used to sign the SSO token.
- **CORS**: n8n call-backs to `/api/n8n/*` require the `x-printhub-signature` header for verification.
