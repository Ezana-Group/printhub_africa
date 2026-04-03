# n8n Credentials Setup Guide — PrintHub Africa

This guide explains how to set up the credentials for all external services used in the n8n automation engine.

## 1. Resend (Email)
- **Type**: Header Auth
- **Name**: `Authorization`
- **Value**: `Bearer re_xxx` (from Resend Dashboard -> API Keys)
- **Workflows**: Order Confirmation, Status Changed, Quote Ready.

## 2. WhatsApp Business API (Meta)
- **Type**: Header Auth
- **Name**: `Authorization`
- **Value**: `Bearer EAAxxx` (Permanent System User Token)
- **Env Vars Required**: `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`.
- **Workflows**: Order Confirmation, Marketing.

## 3. Africa's Talking (SMS)
- **Type**: Header Auth
- **Name**: `apiKey`
- **Value**: `xxx` (from AT Dashboard -> Settings -> API Key)
- **Workflows**: Order Confirmation, Staff Alerts.

## 4. Meta Conversions API (CAPI)
- **Type**: Header Auth (or in Body)
- **Workflows**: Order Confirmed (Purchase Event).
- **Required**: `META_PIXEL_ID`, `META_ACCESS_TOKEN`.

## 5. Google Ads / Merchant Center
- **Type**: OAuth2
- **Required**: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`.
- **Workflows**: Product Sync, Social Export.

## 6. TikTok Events API
- **Type**: Header Auth
- **Value**: Access Token from TikTok For Business.
- **Workflows**: Catalog Sync.

## 7. Pinterest API
- **Type**: OAuth2
- **Workflows**: Catalog Sync.

## 8. LinkedIn Marketing API
- **Type**: OAuth2
- **Workflows**: Page Updates.

## 9. X (Twitter) API v2
- **Type**: OAuth2
- **Workflows**: Promotion Posts.

## 10. Snapchat Conversions API
- **Type**: Header Auth
- **Workflows**: Catalog Sync.

## 11. YouTube Data API
- **Type**: OAuth2
- **Workflows**: Uploading Shorts/Videos.

## 12. Google Business Profile API
- **Type**: OAuth2
- **Workflows**: Local Posts.

---

### Internal Authentication
All calls from **n8n to PrintHub Admin API** must include the header:
- `x-n8n-secret`: Matches `N8N_WEBHOOK_SECRET` in `.env`.

All calls from **PrintHub to n8n Webhooks** are signed using:
- `x-printhub-signature`: HMAC-SHA256 of the body using `N8N_WEBHOOK_SECRET`.
