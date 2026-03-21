# Sentry setup (error monitoring)

Sentry is **already integrated** in the app: server, client, and edge configs are in place, error boundaries report to Sentry, and `next.config` uses `withSentryConfig`. To have events and good stack traces in your Sentry project, finish the setup below.

## Why it can look “not set up”

- **Development:** Sentry is **disabled** when `NODE_ENV === "development"`, so nothing is sent when you run `npm run dev`. That’s intentional to avoid noise; use production or the steps below to test.
- **Missing env:** If you don’t set the DSN (and auth token for source maps), the app may use fallback DSNs in code or uploads may fail silently (`withSentryConfig` runs with `silent: true`).

## 1. Create a Sentry project (if needed)

1. Go to [sentry.io](https://sentry.io) and sign in (e.g. **ezana-group** org).
2. Create a project or use an existing one (e.g. **printhub**).
3. Choose **Next.js** as the platform and note the **DSN** (Client Key) in project settings.

## 2. Set environment variables

In `.env.local` (and in Vercel/hosting for production) set:

```bash
# Required for errors to appear in your project
NEXT_PUBLIC_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456   # optional; client uses NEXT_PUBLIC_*

# Required for source map uploads (readable stack traces in Sentry)
SENTRY_ORG=ezana-group
SENTRY_PROJECT=printhub
SENTRY_AUTH_TOKEN=your-auth-token
```

- **DSN:** From Sentry → Project → Settings → Client Keys (DSN).
- **SENTRY_AUTH_TOKEN:** Sentry → Settings → Auth Tokens. Create a token with scopes `project:releases` and `org:read`. Use it only on the server (e.g. Vercel env), not in client-exposed env.

## 3. Source maps (optional but recommended)

On `next build`, the Sentry webpack plugin uploads source maps if:

- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set.
- Build runs in an environment that can reach Sentry (e.g. Vercel).

Then stack traces in Sentry show your original source, not minified code.

## 4. Verify

- **Production:** Deploy with the env vars above, trigger an error (or use a test route), and check the project in Sentry for the event.
- **Test route:** The app has `/sentry-example-page` and `/api/sentry-example-api` (and `/api/sentry-test`) that throw sample errors. Use them in a **production** build (e.g. `npm run build && npm run start`) with a valid DSN to see events in Sentry.
- **Enable in development (optional):** To test locally, in `instrumentation-client.ts` and `sentry.server.config.ts` you can temporarily set `enabled: true` (or remove the `enabled` line). Remember to set it back so dev doesn’t flood Sentry.

## What’s already in the repo

| Item | Location |
|------|----------|
| Next.js config | `next.config.mjs` → `withSentryConfig` |
| Server SDK | `sentry.server.config.ts` (loaded via `instrumentation.ts`) |
| Edge SDK | `sentry.edge.config.ts` |
| Client SDK | `instrumentation-client.ts` (replay + tracing) |
| Error boundaries | Various `error.tsx` and `global-error.tsx` call `Sentry.captureException` |
| User context | `components/providers/SentryUserContext.tsx` |
| Payment/upload/quote events | `lib/sentry-events.ts` |

Once the DSN (and optionally auth token + org/project) are set in the environment where the app runs, Sentry is fully set up.

## CSP and 403 “envelope” errors

The app’s Content Security Policy allows Sentry by:

- **worker-src 'self' blob:** – so Sentry’s blob-based workers are allowed (avoids “Refused to load blob” in worker-src).
- **connect-src** including `https://*.ingest.sentry.io` and `https://*.ingest.de.sentry.io` – so the SDK can send events.

If you still see **403 on “envelope”** after deploying, the request is reaching the network but Sentry’s server is rejecting it. Check:

- The **DSN** in `NEXT_PUBLIC_SENTRY_DSN` matches the project (Sentry → Project → Settings → Client Keys).
- The project is **active** and not rate-limited.
- There is no proxy or firewall blocking outbound requests to `*.ingest.sentry.io` / `*.ingest.de.sentry.io`.
