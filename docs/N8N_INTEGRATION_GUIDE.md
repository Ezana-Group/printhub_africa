# PrintHub Africa - n8n Integration & Setup Guide (v3.1)

This guide covers the finalized n8n automation infrastructure, including credentials, deployment on Railway, and verification.

---

## 1. Credentials Setup Guide

To enable all workflows, you must configure the following external services in the **n8n Credentials** panel **AND** set the matching env vars in the Railway dashboard.

### 1.1 Messaging & Communication
| Service | n8n Credential | Required Env Vars |
|---|---|---|
| WhatsApp Business | Header Auth | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_CHANNEL_ID` |
| Telegram | Telegram API | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` |
| Africa's Talking (SMS) | Header Auth | `AT_API_KEY`, `AT_USERNAME` (**production only, not sandbox**) |

### 1.2 Social Media Publishing
| Service | n8n Credential | Required Env Vars |
|---|---|---|
| Meta/Instagram | Header Auth | `META_ACCESS_TOKEN`, `META_PIXEL_ID`, `META_AD_ACCOUNT_ID`, `INSTAGRAM_USER_ID` |
| YouTube | OAuth2 | Scope: `https://www.googleapis.com/auth/youtube.upload` |
| TikTok | Header Auth | `TIKTOK_EVENTS_API_TOKEN`, `TIKTOK_AD_ACCOUNT_ID` |
| Jiji Kenya | HTTP Session | `JIJI_EMAIL`, `JIJI_PASSWORD` |
| PigiaMe | HTTP Session | `PIGIAME_EMAIL`, `PIGIAME_PASSWORD` |
| OLX Kenya | OAuth2 | `OLX_EMAIL`, `OLX_PASSWORD` |
| Reddit | OAuth2 | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD` |
| LinkedIn | OAuth2 | `LINKEDIN_ORGANIZATION_ID`, `LINKEDIN_NEWSLETTER_ID` |
| Medium | Header Auth | `MEDIUM_INTEGRATION_TOKEN`, `MEDIUM_USER_ID` |

### 1.3 Location Platforms
| Service | Required Env Vars |
|---|---|
| Google Business Profile | `GOOGLE_ACCOUNT_ID`, `GOOGLE_LOCATION_ID`, `GOOGLE_MAPS_PLACE_ID` |
| Bing Places | `BING_MAPS_KEY`, `BING_BUSINESS_ID` |
| Apple Maps | `APPLE_KEY_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY` (base64), `APPLE_PLACE_ID` |

### 1.4 AI & Media Services
| Service | n8n Credential | Required Env Vars |
|---|---|---|
| Anthropic | Header Auth | `ANTHROPIC_API_KEY` (Claude 3.5 Sonnet/Opus) |
| OpenAI | Header Auth | `OPENAI_API_KEY` (GPT-4o, DALL-E 3, Whisper) |
| Stability AI | Header Auth | `STABILITY_API_KEY` |
| ElevenLabs | Header Auth | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| Runway ML | Header Auth | `RUNWAY_API_KEY` |
| Google Gemini | Direct API | `GEMINI_API_KEY` |
| Perplexity | Header Auth | `PERPLEXITY_API_KEY` |

### 1.5 Internal & Infrastructure
| Variable | Description |
|---|---|
| `ADMIN_EMAIL` | Receives all AI notification emails (mockups ready, sentiment reports, etc.) |
| `SUPER_ADMIN_EMAIL` | Receives monthly BI reports |
| `BUSINESS_PHONE` | Phone number embedded in PigiaMe/OLX listing bodies |
| `FFMPEG_SERVICE_URL` | URL of the Railway FFmpeg worker (for AI-9 video combining) |
| `COMBINE_SECRET` | Shared secret between n8n and FFmpeg service |
| `N8N_WEBHOOK_SECRET` | HMAC secret — **must match exactly in Railway n8n env vars** |

---

## 2. Railway Setup Checklist

### 2.1 Main n8n Instance
- [x] **Deploy from Dockerfile**: Use `n8n/Dockerfile`.
- [x] **Add PostgreSQL**: Separate Neon Postgres instance for n8n metadata.
- [ ] **Environment Variables**: Add all keys from `n8n/.env.example` into the Railway dashboard.
- [ ] **⚠️ Critical**: Set `AT_USERNAME` to your **production** Africa's Talking username.

### 2.2 FFmpeg Worker Service
- [ ] **Create New Service** in Railway.
- [ ] **Deploy from `/n8n/ffmpeg-service`** with Dockerfile builder, Port `3001`.
- [ ] **Set Worker Env Vars**: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET`, `COMBINE_SECRET`.
- [ ] **Link to n8n**: Add `FFMPEG_SERVICE_URL` to your main n8n instance env vars.

---

## 3. Workflow Import Guide

Import workflow files **in this order**:

1. `n8n/workflows/printhub_automations.json` — Base 12 Workflows (Webhooks 1, 2, 7, 10 with full logic)
2. `n8n/workflows/printhub_stubs_part1.json` — Workflows 3, 4, 5, 6 (Abandoned Cart, Staff Alert, Security, Low Stock)
3. `n8n/workflows/printhub_stubs_part2.json` — Workflows 8, 9, 11, 12 (Product Update, Social Sync, Quote Ready, New Device Login)
4. `n8n/workflows/printhub_ai_new_workflows.json` — AI-1 to AI-7
5. `n8n/workflows/printhub_ai_optimised.json` — AI-8 to AI-10
6. `n8n/workflows/printhub_ai_crons_v2.json` — Cron AI-1 to Cron AI-3
7. `n8n/workflows/printhub_platform_expansion.json` — AI-11 to AI-13

Then:
- Go to **Settings → Credentials** and add all external service credentials.
- **Activate** all 13+ workflows.

---

## 4. Workflow Status Reference

| # | Workflow | Webhook Path | Status |
|---|---|---|---|
| 1 | Order Confirmation | `order-confirmed` | ✅ Full logic |
| 2 | Order Status Changed | `order-status-changed` | ✅ Full logic |
| 3 | Abandoned Cart Recovery | `cart-abandoned` | ⚠️ Stub — needs logic |
| 4 | Staff Alert | `staff-alert` | ⚠️ Stub — needs logic |
| 5 | Security Alert | `security-alert` | ⚠️ Stub — needs logic |
| 6 | Low Stock Notify | `low-stock` | ⚠️ Stub — needs logic |
| 7 | Social Media Sync | `product-published` | ✅ Full logic |
| 8 | Product Updated | `product-updated` | ⚠️ Stub — needs logic |
| 9 | Sync Social Feeds | `sync-social-feeds` | ⚠️ Stub — needs logic |
| 10 | Quote Submitted | `quote-submitted` | ✅ Full logic |
| 11 | Quote Ready | `quote-ready` | ⚠️ Stub — needs logic |
| 12 | New Device Login | `new-device-login` | ⚠️ Stub — needs logic |
| AI-1 | Auto-Generate Social Posts | `ai-generate-social` | ✅ Full logic |
| AI-2 | WhatsApp Auto-Reply | `whatsapp-incoming` | ✅ Full logic |
| AI-3 | Generate Ad Copy | `ai-generate-adcopy` | ✅ Full logic |
| AI-4 | Auto-Generate Descriptions | `ai-generate-descriptions` | ✅ Full logic |
| AI-5 | AI-Assisted Quote Responses | `ai-generate-quotedraft` | ✅ Full logic |
| AI-6 | Sentiment Analysis | `ai-analyse-sentiment` | ✅ Full logic |
| AI-8 | Generate Lifestyle Mockups | `generate-mockups` | ✅ Full logic |
| AI-9 | Generate Video Content | `generate-video` | ✅ Full logic |
| AI-10 | Telegram Customer Chat Bot | Telegram Trigger | ✅ Full logic |
| AI-11 | Extended Platform Posting | `ai-platform-expansion` | ✅ Full logic |
| AI-12 | SMS Weekly Broadcast | Cron: Friday 9AM | ✅ Full logic |
| AI-13 | Long-Form SEO Content Engine | Cron: Wednesday 6AM | ✅ Full logic |
| Cron AI-1 | Daily Sentiment Report | Cron: Daily 9AM EAT | ✅ Full logic |
| Cron AI-2 | Weekly Trend Report | Cron: Monday 7AM EAT | ✅ Full logic |
| Cron AI-3 | Monthly BI Report | Cron: 1st of month 6AM EAT | ✅ Full logic |

---

## 5. Testing Checklist

### 5.1 Core Comms
- [ ] **Order Confirmation**: Place a test order → Verify email + WhatsApp + SMS + Meta CAPI fire.
- [ ] **WhatsApp Reply**: Send a text + voice note to the WhatsApp number → Verify Claude replies.
- [ ] **Telegram Bot**: Send a message → Verify Claude replies and escalation email works.

### 5.2 AI Generation
- [ ] **AI-1 Social Posts**: Publish a product → Verify GPT-4o posts saved to `adCopyVariations`.
- [ ] **AI-4 Descriptions**: Trigger → Verify product `description` and `shortDescription` updated.
- [ ] **AI-8 Mockups**: Trigger `generate-mockups` → Verify DALL-E images appear in admin AI panel.
- [ ] **AI-9 Video**: Trigger with a product → Verify ElevenLabs + Runway + FFmpeg merge produces video.

### 5.3 Platform Publishing (Workflow 7)
- [ ] **Trigger Social Sync**: Publish a product with export flags set → Verify it fans out to Instagram, YouTube Shorts, WhatsApp Status, WhatsApp Channel, Telegram, Jiji.

### 5.4 Crons
- [ ] **Cron AI-2**: On Monday, verify weekly strategy + content calendar email arrives.
- [ ] **Cron AI-3**: On 1st of month, verify monthly BI PDF report email arrives.
