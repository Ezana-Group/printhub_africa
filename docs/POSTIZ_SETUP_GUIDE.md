# Postiz (Social Media Dashboard) Setup Guide

This guide will help you complete the setup of Postiz and connect it to your PrintHub instance for automated social media marketing.

## 1. Accessing the Dashboard
Postiz should be accessible at: `https://postiz.printhub.africa` (or your local equivalent).

- **First Login**: If this is a fresh installation, you will be prompted to create your admin account.
- **Disable Registration**: Once your account is created, ensure `DISABLE_REGISTRATION=true` is set in the Postiz environment variables to prevent others from signing up.

## 2. Generate API Key
To allow PrintHub (and n8n) to post to Postiz, you need an API key:
1. Go to **Settings** -> **API**.
2. Generate a new API key.
3. Copy this key and add it to your PrintHub `.env` file as `POSTIZ_API_KEY`.

## 3. Storage Configuration (Cloudflare R2)
Postiz needs to store images for social posts. It is recommended to use the same Cloudflare R2 bucket as PrintHub for consistency.
- Ensure your R2 bucket has a **CORS policy** that allows your Postiz domain.
- Example CORS policy:
  ```json
  [
    {
      "AllowedOrigins": ["https://postiz.printhub.africa", "https://admin.printhub.africa"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": []
    }
  ]
  ```

## 4. Connecting Social Platforms
In the Postiz dashboard, go to **Integrations** to connect your accounts:

### No New OAuth App Needed (Connect Directly):
- **Instagram / Facebook**: Requires a Meta Business account connected to your page.
- **YouTube**: Connect via your Google Account.
- **Telegram / WhatsApp**: Follow the onscreen instructions for bot/pairing.

### Requires Creating a Developer App:
- **LinkedIn**: Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/).
    - Redirect URI: `https://postiz.printhub.africa/oauth/callback`
- **X (Twitter)**: Create an app at [X Developer Portal](https://developer.twitter.com/en/portal/dashboard).
    - Redirect URI: `https://postiz.printhub.africa/oauth/callback`
- **TikTok**: Create an app at [TikTok for Developers](https://developers.tiktok.com/).
    - Redirect URI: `https://postiz.printhub.africa/oauth/callback`

## 5. Integrating with n8n
Your PrintHub `AI-11 (Social Sync)` workflow in n8n uses the Postiz API.
- Update the **HTTP Request** node in n8n to use your new `POSTIZ_API_KEY`.
- Ensure the base URL is set to `https://postiz.printhub.africa`.

## 6. Verification
Once set up:
1. Create a "Test Product" in PrintHub admin.
2. Go to the **Marketing** tab.
3. Click "Sync to Postiz".
4. Check your Postiz dashboard to see the draft post created with the product info and images.
