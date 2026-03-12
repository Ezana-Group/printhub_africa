# R2 CORS configuration (browser uploads)

When the app uploads files from the browser via **presigned PUT URLs**, the browser sends a **preflight (OPTIONS)** request to the R2 URL. Without CORS rules on the bucket, R2 returns **403** and you see:

- `XMLHttpRequest cannot load ... due to access control checks`
- `Preflight response is not successful. Status code: 403`

Fix this by adding a **CORS policy** to **both** R2 buckets used for uploads: **printhub-uploads** and **printhub-public**.

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
- **AllowedHeaders**: must include **Content-Type** (and **Content-Length** if the client sends it).
- **AllowedOrigins**: replace with your real app URL(s); avoid `*` in production if you care about restricting origins.

After saving, try the upload again; the preflight should succeed and the PUT to the presigned URL should complete.
