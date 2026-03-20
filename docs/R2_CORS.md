# R2 CORS configuration (browser uploads)

When the app uploads files from the browser via **presigned PUT URLs**, the browser sends a **preflight (OPTIONS)** request to the R2 URL (e.g. `*.r2.cloudflarestorage.com`). Without CORS rules on the bucket, R2 returns **403** and you see:

- `XMLHttpRequest cannot load https://...r2.cloudflarestorage.com/... due to access control checks`
- `Preflight response is not successful. Status code: 403`
- `Failed to load resource: ... (line 0)`

**Fix:** Add a CORS policy to **both** R2 buckets used for uploads: **printhub-uploads** and **printhub-public**. The URL in the error (`printhub-public.b9453de11...r2.cloudflarestorage.com`) is the **printhub-public** bucket.

## Steps (Cloudflare Dashboard)

1. Go to **Cloudflare Dashboard** → **R2** → select bucket (**printhub-uploads** or **printhub-public**).
2. Open **Settings** → **CORS policy**.
3. Paste the JSON below (adjust origins if needed), then save.
4. Repeat for the other bucket.

## CORS policy (JSON)

Use one of the following.

**Production + staging + local dev (recommended):**

```json
[
  {
    "AllowedOrigins": [
      "https://printhub.africa",
      "https://www.printhub.africa",
      "https://test.ovid.co.ke",
      "https://www.test.ovid.co.ke",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Allow any origin (e.g. staging / multiple domains):**

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

- **AllowedMethods**: `PUT` is required for uploads; `GET`/`HEAD` are useful for follow-up requests.
- **AllowedHeaders**: must include **Content-Type**. If you still get 403 on preflight, try allowing all headers (see below).
- **AllowedOrigins**: replace with your real app URL(s) — e.g. the domain where you see the error (e.g. `https://printhub.africa` or `http://localhost:3000`). Avoid `*` in production if you care about restricting origins.

**If preflight still returns 403:** Some presigned URLs include `x-amz-*` query params; the browser may send extra headers. Use a permissive AllowedHeaders once to confirm CORS is the only issue:

```json
[
  {
    "AllowedOrigins": ["https://printhub.africa", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace origins with your actual app origin(s). After saving CORS on **both** buckets, try the upload again; the preflight should succeed and the PUT should complete.
