# Product feeds for Google, Meta, TikTok

Your store exposes a **product feed** so platforms can import and display your products.

## Feed URL

- **JSON feed (all products + catalogue):**  
  `https://your-domain.com/api/feeds/products`

Use this URL when a platform asks for a "product feed URL" or "data source URL". The response is JSON with an `items` array; each item has `id`, `title`, `description`, `link`, `imageLink`, `price`, `availability`, `brand`, `channel` (shop or catalogue).

---

## Google (Google Merchant Center / Shopping)

1. Go to [Google Merchant Center](https://merchantcenter.google.com/) and add your website.
2. Under **Products** → **Feeds**, create a new feed.
3. For **Input method**, choose **Scheduled fetch**.
4. **File URL:** `https://your-domain.com/api/feeds/products`  
   Google expects XML by default; you can use a converter (e.g. [JSON to XML](https://www.google.com/search?q=json+to+product+feed+xml)) or use **Content API** if you prefer to push product data from your app. For **scheduled fetch**, some setups use a serverless function that converts the JSON feed to [Google’s product feed format](https://support.google.com/merchants/answer/7052112) and serves XML at a URL—you can add that later if needed.
5. Set fetch frequency (e.g. daily). Google will crawl the URL and use the product data for Shopping ads and free listings.

---

## Meta (Facebook & Instagram)

1. Go to [Meta Business Suite](https://business.facebook.com/) → **Commerce** (or [Commerce Manager](https://commerce.facebook.com/)).
2. Create or open a **Catalog**.
3. Add **Data source** → **Use URL** (or “Upload” if you prefer to upload a file).
4. **Feed URL:** `https://your-domain.com/api/feeds/products`  
   Meta often expects CSV or a specific XML format. You can:
   - Use a tool to convert the JSON feed to [Meta’s catalog format](https://developers.facebook.com/docs/marketing-api/catalog/), or
   - Use **Meta Catalog API** to create/update product sets from the same feed data.
5. Schedule re-imports so new products and price changes appear in Facebook/Instagram shops.

---

## TikTok (TikTok Shop / TikTok for Business)

1. In [TikTok Seller Center](https://seller-us.tiktok.com/) or TikTok for Business, open the product/shop setup.
2. Add a **Product feed** or **Data source**.
3. **Feed URL:** `https://your-domain.com/api/feeds/products`  
   TikTok may require CSV or a specific schema; convert the JSON feed to their required format if needed, or use their Product API to sync items.
4. Schedule regular syncs so your TikTok shop stays in sync with your store.

---

## Notes

- Replace `your-domain.com` with your real domain (e.g. `printhub.africa`).
- The feed includes both **shop products** and **catalogue (print on demand)** items.
- Images must be publicly accessible (the feed uses your R2/public URLs). Ensure `R2_PUBLIC_URL` is set so image links work.
- For platforms that require XML/CSV, add a small script or serverless endpoint that calls `/api/feeds/products`, converts the JSON to the required format, and serves it at a dedicated URL.
