# Settings & My Account — Audit (What Works / What Doesn’t)

## My Account (Profile, Password, 2FA, PIN)

| Section | Works? | Notes |
|--------|--------|--------|
| **Profile** (name, email, phone) | ✅ Yes | Form has `name` attributes; POST `/api/admin/settings/my-account` updates `User`. |
| **Change Photo** | ❌ No | Button has no handler; no upload/API. |
| **Password** (Update Password) | ❌ No | Inputs have no `name`; button has no `onClick`; no API called. |
| **Two-Factor Authentication** | ✅ Yes | Enable 2FA calls `/api/admin/settings/my-account/2fa/setup` and verify calls `2fa/verify`. |
| **PIN (production floor)** | ❌ No | "Set / Change PIN" has no handler; no API. |

## My Notifications

| Item | Works? | Notes |
|------|--------|--------|
| **Save Preferences** | ✅ Yes | Client component loads/saves via GET/POST `/api/admin/settings/my-account/notifications`; prefs stored per user in `PricingConfig` (`staffNotificationPrefs:{userId}`). |

## My Activity

| Item | Works? | Notes |
|------|--------|--------|
| **Recent actions** | ✅ Yes | Fetches `/api/admin/settings/my-activity`; shows last 100 audit log entries for current user. |
| **Summary cards** (Jobs completed, Quotes sent, Files reviewed, Orders processed) | ❌ No | Values are hardcoded "—"; no API or data. |

## Danger Zone

| Action | Backend | UI (before fix) | Notes |
|--------|---------|------------------|--------|
| Reset All Pricing | ✅ POST `/api/admin/settings/danger/reset-pricing` | ❌ Did not call API | Requires body: `confirmPhrase: "RESET PRICING"`, `password`. |
| Clear All Draft Quotes | ✅ POST `.../danger/clear-draft-quotes` | ❌ Did not call API | Phrase: "CLEAR DRAFTS", `password`. |
| Reset Quote Counter | ✅ POST `.../danger/reset-quote-counter` | ❌ Did not call API | Phrase: "RESET COUNTER", `password`. |
| Anonymise Customer Data | ⚠️ Only per-customer: `.../danger/anonymise-customer/[id]` | ❌ No bulk flow | No "anonymise all" API; UI not wired. |
| Export All Data | ✅ POST `.../danger/export-all-data` | ❌ Did not call API | Phrase: "EXPORT DATA", `password`. |
| Factory Reset | ✅ POST `.../danger/factory-reset/initiate` | ❌ Did not call API | Phrase: "DELETE EVERYTHING", `password`, `totpCode` (2FA required). |

After fix: Danger Zone dialog collects password (and for factory: phrase + 2FA) and POSTs to the above APIs.

## Other Settings

- **Order number prefixes / SKU prefixes**: ✅ Work (own load/save).
- **System** (Maintenance message, min order, cache TTLs, Feature Flags): ✅ Work. Client form loads GET `/api/admin/settings/system`, saves via POST (merge with existing so order/SKU prefixes are preserved). Buttons (Enable Maintenance, Clear Caches, Database backup, Logs) remain UI-only.
- **SEO**: ✅ Works (load/save + Regenerate sitemap).
- **Notifications & Comms**: ✅ Work. Client form loads saved values from GET `/api/admin/settings/notifications` and saves via existing Save. **Test Email** and **Test SMS** call POST `/api/admin/settings/notifications/test-email` and `test-sms` (send to current user; use env RESEND_API_KEY and AT_*).
- **Integrations**: ❌ No `name`/handlers; UI-only.
- **Loyalty / Referral**: ✅ Work. Client forms load from GET and save via POST to `/api/admin/settings/loyalty` and `referral` (catch-all → `adminSettings:loyalty` / `adminSettings:referral`).
- **Discounts**: ✅ Save persists to `adminSettings:discounts` (catch-all POST → PricingConfig). Dedicated route GET/PATCH uses `DiscountSettings` table (volumeDiscountTiers only). Application of rules (stacking, max discount, badges) in checkout/catalog is not wired to these settings yet.
