# Railway Deployment Guide - PrintHub Africa

This guide covers deploying the Next.js application to Railway with a **Subdomain-based Architecture** (Main site + Admin portal).

## 1. Prerequisites
- A Railway account connected to your GitHub repository.
- A Neon PostgreSQL database (or Railway's Postgres).
- Custom domains (e.g., `printhub.africa`).

## 2. Setting Up Domains on Railway

To support the subdomain architecture, you must add **two** custom domains to your Railway service:

1.  **Main Domain**: `printhub.africa` (or your chosen root domain).
2.  **Admin Domain**: `admin.printhub.africa`.

### How to add:
- Go to your Service → **Settings** → **Domains**.
- Click **Add Custom Domain**.
- Add the root domain first.
- Add the subdomain (`admin.`) second.
- Configure your DNS provider (Cloudflare, GoDaddy, etc.) with the provided CNAME records for **both**.

## 3. Environment Variables

Configure these critical variables in the Railway **Variables** tab. 

### Core App Settings
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://printhub.africa` | Root URL for absolute links |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `.printhub.africa` | Cookie scope (include leading dot) |
| `NEXT_PUBLIC_ADMIN_DOMAIN` | `admin.printhub.africa` | Required for admin session isolation |
| `NEXTAUTH_URL` | `https://printhub.africa` | Main NextAuth callback origin |
| `NEXTAUTH_SECRET` | `your-long-secure-secret` | Generate using `openssl rand -base64 32` |

### Database & Security
| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://...` | Connection pooled URL (e.g., from Neon) |
| `DIRECT_URL` | `postgres://...` | Direct connection for Prisma migrations |
| `NODE_ENV` | `production` | Enforces Secure/HttpOnly/Strict cookies |

## 4. Deployment Workflow

1.  **Migrations**: Railway will automatically run your `build` command. Ensure your `package.json` build step includes `prisma generate`:
    ```json
    "build": "prisma generate && next build"
    ```
2.  **Middleware**: The `middleware.ts` in this project automatically detects if a request is coming from the `admin.` subdomain and rewrites it to the `/admin` internal routes.
3.  **Authentication**: Sessions are cross-domain isolated. Logging into the admin portal will set a `__Secure-printhub.admin.session` cookie limited to the admin subdomain.

## 5. Troubleshooting

- **Invalid Redirects**: Ensure `NEXTAUTH_URL` exactly matches your root domain.
- **Login Loops**: Check that `NEXT_PUBLIC_ROOT_DOMAIN` starts with a dot (`.`) if you want to share any settings, or matches exactly if you want strict isolation (as currently configured).
- **SSL Errors**: Railway may take a few minutes to issue certificates for new subdomains. Wait for the "Active" status in the Domains tab.
