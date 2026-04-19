# Environment Variable Setup Guide

This guide provides detailed instructions on where to obtain the necessary credentials and configuration values for both the **PrintHub Main Project** and the **n8n Automation Engine**.

---

## 1. Core Application & Auth

| Variable | Source / Instructions |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., `https://printhub.africa`) or `http://localhost:3000` for development. |
| `NEXTAUTH_SECRET` | Generate a random 32+ character string. You can use `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Same as `NEXT_PUBLIC_APP_URL`. |

---

## 2. Database (PostgreSQL)

**Provider:** [Neon.tech](https://neon.tech/)

| Variable | Source / Instructions |
| :--- | :--- |
| `DATABASE_URL` | Go to Neon Dashboard → Connection String. Use the **Pooled** connection for production (has `?pgbouncer=true`). |
| `DIRECT_URL` | Go to Neon Dashboard → Connection String. Use the **Unpooled** connection (standard port 5432) for Prisma migrations. |

---

## 3. File Storage (Cloudflare R2)

**Provider:** [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2**

| Variable | Source / Instructions |
| :--- | :--- |
| `R2_ENDPOINT` | Found in R2 Bucket Settings. Format: `https://<account_id>.r2.cloudflarestorage.com`. |
| `R2_ACCESS_KEY_ID` | Create an **API Token** in R2 Overview with "Admin Read & Write" permissions. |
| `R2_SECRET_ACCESS_KEY` | Generated along with the Access Key ID. **Save it immediately.** |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | The public URL of your bucket (e.g., `https://pub-xxx.r2.dev` or your custom domain). |

---

## 4. Email Service

**Provider:** [Resend](https://resend.com/)

| Variable | Source / Instructions |
| :--- | :--- |
| `RESEND_API_KEY` | Dashboard → API Keys → Create API Key. |
| `FROM_EMAIL` | A verified domain email (e.g., `hello@yourdomain.com`). Verify your domain in Resend first. |

---

## 5. SMS Service

**Provider:** [Africa's Talking](https://africastalking.com/)

| Variable | Source / Instructions |
| :--- | :--- |
| `AT_API_KEY` | Dashboard → Settings → API Key. |
| `AT_USERNAME` | Your account username (usually `sandbox` for testing). |
| `AT_SENDER_ID` | Your approved Alphanumeric Sender ID (e.g., `PrintHub`). Requires registration in the AT dashboard. |

---

## 6. Payments (Kenya Focused)

### M-Pesa (Safaricom Daraja)
**Provider:** [Safaricom Developer Portal](https://developer.safaricom.co.ke/)

| Variable | Source / Instructions |
| :--- | :--- |
| `MPESA_CONSUMER_KEY` | Create an App in the Daraja portal to get these. |
| `MPESA_CONSUMER_SECRET` | Created with the App. |
| `MPESA_PASSKEY` | Found in the "Lipan na M-Pesa Online" sandbox/production app details. |
| `MPESA_SHORTCODE` | Your Business Shortcode (e.g., `174379` for sandbox). |

### PesaPal
**Provider:** [PesaPal Dashboard](https://www.pesapal.com/)

| Variable | Source / Instructions |
| :--- | :--- |
| `PESAPAL_CONSUMER_KEY` | Dashboard → Settings → API Keys. |
| `PESAPAL_CONSUMER_SECRET` | Created with the API Key. |
| `PESAPAL_NOTIFICATION_ID` | Register your IPN URL in PesaPal to get this unique ID. |

---

## 7. AI & LLM Services

| Provider | Variable | Source / Instructions |
| :--- | :--- | :--- |
| **OpenAI** | `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| **Anthropic** | `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) |
| **Google** | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) |
| **Stability AI** | `STABILITY_API_KEY` | [Stability.ai Dashboard](https://platform.stability.ai/account/keys) |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | [ElevenLabs Profile](https://elevenlabs.io/app/settings/profile) |
| **Perplexity** | `PERPLEXITY_API_KEY` | [Perplexity Settings](https://www.perplexity.ai/settings/api) |

---

## 8. Marketing & Social

| Platform | Variable | Source / Instructions |
| :--- | :--- | :--- |
| **Meta** | `META_ACCESS_TOKEN` | [Meta Events Manager](https://business.facebook.com/events_manager2/) → Settings → Conversions API. |
| **TikTok** | `TIKTOK_EVENTS_API_TOKEN` | [TikTok Ads Manager](https://ads.tiktok.com/) → Assets → Events → App/Web Events. |
| **Klaviyo** | `KLAVIYO_API_KEY` | [Klaviyo Account](https://www.klaviyo.com/settings/account/api-keys) → Private API Key. |
| **WhatsApp** | `WHATSAPP_ACCESS_TOKEN` | [Meta for Developers](https://developers.facebook.com/) → Your App → WhatsApp → Configuration. |

---

## 9. n8n Specific (Self-Hosted)

| Variable | Source / Instructions |
| :--- | :--- |
| `N8N_ENCRYPTION_KEY` | A random long string (e.g., 64 chars). **Do not change this after setup** or your credentials will break. |
| `N8N_WEBHOOK_SECRET` | A random string used to verify incoming webhooks. |
| `FFMPEG_SERVICE_URL` | The URL of your `ffmpeg-service` deployment (e.g., `printhub-ffmpeg.railway.app`). |

---

## 10. Platform Sync (n8n)

| Variable | Instructions |
| :--- | :--- |
| `JIJI_EMAIL` / `PASSWORD` | Your login credentials for Jiji.co.ke (used for automated posting). |
| `TELEGRAM_BOT_TOKEN` | Created via [@BotFather](https://t.me/botfather) on Telegram. |
| `YOUTUBE_REFRESH_TOKEN` | Requires setting up a Google Cloud Project with the YouTube Data API enabled and performing an OAuth flow. |

---

## 11. 3D Model Import

Required for automated ingestion of POD models into the catalogue.

| Variable | Source / Instructions |
| :--- | :--- |
| `THINGIVERSE_ACCESS_TOKEN` | [Thingiverse Developers](https://www.thingiverse.com/apps/create) → Create an App. |
| `MYMINIFACTORY_API_KEY` | [MyMiniFactory API](https://www.myminifactory.com/api/v2/apps) → Create an App. |

---

## 12. SEO & Other Utilities

| Variable | Source / Instructions |
| :--- | :--- |
| `GOOGLE_INDEXING_KEY` | Generated via Google Cloud Console → Service Accounts (JSON Key). Used to ping Google for new blog/product posts. |
| `SENTRY_DSN` | [Sentry.io](https://sentry.io/) → Project Settings → Client Keys (DSN). |
| `VIRUSTOTAL_API_KEY` | [VirusTotal Intelligence](https://www.virustotal.com/gui/user/username/apikey). |

---

> [!IMPORTANT]
> **Production Safety:**
> - Ensure `NODE_ENV` is set to `production` in your hosting environment (Railway/Vercel).
> - Set `MPESA_ENV` and `PESAPAL_ENV` to `production` (or `live`) only after Safaricom/PesaPal have approved your go-live request.
