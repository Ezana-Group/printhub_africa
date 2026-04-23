# Facebook Catalog EMPTY_IMAGE_URL Fix

## Issue Summary
Facebook Commerce Manager shows products with "EMPTY_IMAGE_URL" errors for retailer_ids like `test_product_retailer_id_1` and `test_product_retailer_id_2`. These are old/stale products that exist in Facebook's catalog but are not being updated by your current feed.

## Root Cause
- Old test products were manually uploaded to Facebook or through a previous feed
- These products no longer exist in your current database/feed
- Facebook retains these products in the catalog even when they're not in the feed
- Without updates, they show as having empty image URLs

## Current Status
✅ **Your feed is working correctly**: 4 products with valid images are being exported
❌ **Facebook has stale products**: Old test products causing errors

## Step-by-Step Fix

### Step 1: Identify Problem Products
In Facebook Commerce Manager, you can see the errors for:
- `test_product_retailer_id_1` (Product 1 Title)
- `test_product_retailer_id_2` (Product 2 Title)

### Step 2: Delete Old Test Products
1. Go to [Meta Commerce Manager](https://business.facebook.com/commerce_manager/)
2. Select your business/catalog
3. Go to **Catalog** → **Items**
4. Use the search/filter to find products with retailer_id containing "test_product"
5. Select the problematic products
6. Click **Delete** or **Archive**

### Step 3: Verify Feed Products
Your current feed at `https://printhub.africa/facebook-catalog-feed` includes:
- 4 products with valid images
- All products have proper retailer_ids (format: `shop-{product_id}`)
- All images are accessible URLs

### Step 4: Re-sync Catalog (Optional)
1. In Commerce Manager → Catalog → Data Sources
2. Find your CSV feed connection
3. Click **Update Now** to force a refresh
4. Check that only current products appear

## Prevention
- **Don't upload test products** to live Facebook catalog
- **Use separate test catalog** for development/testing
- **Regular cleanup**: Periodically review and remove old products from Facebook
- **Consistent retailer_ids**: Ensure your feed uses consistent ID formats

## Alternative: Keep Test Products
If you want to keep these test products:
1. Add them to your database with `exportToMeta: true`
2. Ensure they have valid images
3. Re-export the feed

But **recommended approach is cleanup** - remove test products from live catalog.

## Verification
After cleanup:
1. Check Commerce Manager → Catalog → Items
2. Search for "test_product" - should return no results
3. All remaining products should have valid images
4. No "EMPTY_IMAGE_URL" errors should appear

## Support
If issues persist:
- Contact Meta Commerce Support
- Provide screenshots of your feed URL and catalog errors
- Reference that feed is working but catalog has stale products</content>
<parameter name="filePath">/Users/mose/Printhub_V3.1Final_3D Print Only copy/docs/FACEBOOK_CATALOG_FIX.md