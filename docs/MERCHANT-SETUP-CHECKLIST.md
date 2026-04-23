# PrintHub Africa Merchant Setup Checklist

This document provides step-by-step instructions for connecting PrintHub Africa's product feeds and pixels to various social commerce and merchant platforms.

## Prerequisites
- All feeds are publicly accessible at:
  - Google Merchant: https://printhub.africa/google-merchant-feed
  - Facebook Catalog: https://printhub.africa/facebook-catalog-feed
  - TikTok Shop: https://printhub.africa/tiktok-shop-feed
  - Pinterest: https://printhub.africa/pinterest-feed
- All pixels are loaded on every page with consent
- Product pages have proper OG tags and structured data
- **Business transparency implemented** (trust badges, ratings, contact info)

## Google Merchant Center Misrepresentation Fix
⚠️ **IMPORTANT**: If you received a "Misrepresentation" error from GMC:

1. **Update GMC Business Information** to exactly match website:
   - Business Name: PrintHub Africa
   - Address: [From admin settings]
   - Phone/Email: [From admin settings]
   - Customer Service contacts

2. **Verify Website Transparency** (✅ Already implemented):
   - Business ownership (Ezana Group Company)
   - Trust badges and ratings
   - Complete contact information
   - SSL security indicators

3. **Request Review** in GMC diagnostics with explanation of fixes

See `docs/GMC_MISREPRESENTATION_FIX.md` for detailed instructions.

## 1. Facebook & Instagram Setup

### Meta Pixel Verification
- ✅ Pixel ID: 2035196960739715
- ✅ Domain verification meta tag present in layout.tsx
- ✅ Events: ViewContent, AddToCart, Purchase firing correctly

### Facebook Catalog Setup
1. Go to [Meta Commerce Manager](https://business.facebook.com/commerce_manager/)
2. Create or select your business
3. Go to Catalog → Data Sources
4. Click "Add Data Source" → "Use Data Feed"
5. Select "Scheduled Feed" or "Real-time Feed"
6. Enter feed URL: `https://printhub.africa/facebook-catalog-feed`
7. Set format: CSV
8. Map fields according to the CSV headers
9. Schedule daily updates

### Instagram Shopping Setup
1. In Meta Commerce Manager, go to Instagram → Shopping
2. Connect your Instagram business account
3. Select the catalog created above
4. Enable "Show products in Shopping" toggle
5. Add product tags to posts/stories to enable shopping features

### Facebook Shop Tab
1. In Meta Commerce Manager, go to Facebook → Shop
2. Connect your Facebook Page
3. Select the catalog
4. Customize shop appearance
5. Enable "Show shop tab on your Page"

### Dynamic Product Ads
1. In Meta Ads Manager, create a new campaign
2. Select "Catalog Sales" objective
3. Choose "Dynamic Product Ads"
4. Select your catalog
5. Set up targeting and budget

## 2. Google Merchant Center & Shopping

### Google Merchant Center Setup
1. Go to [Google Merchant Center](https://merchants.google.com/)
2. Create account with printhub.africa domain
3. Verify domain ownership (add verification code to PrintHub admin settings)
4. Go to Products → Feeds
5. Click "Add Feed" → "Scheduled Fetch"
6. Enter feed URL: `https://printhub.africa/google-merchant-feed`
7. Set format: XML
8. Set fetch frequency: Daily
9. Map attributes according to Google requirements

### Google Shopping Ads
1. In Google Ads, create new campaign
2. Select "Shopping" campaign type
3. Select your Merchant Center account
4. Set up product groups and targeting
5. Configure bids and budget

### YouTube Shopping Setup
1. In Google Merchant Center, go to Growth → YouTube
2. Link your YouTube channel
3. Enable product listings on YouTube
4. Products will automatically appear in YouTube search results

### Google Site Verification
1. In Google Merchant Center, go to Settings → Business Information
2. Copy the verification code
3. In PrintHub admin, go to Settings → SEO
4. Add the code to "Google Site Verification" field
5. Save and redeploy

## 3. TikTok Shop Setup

### TikTok Shop Account Creation
1. Go to [TikTok Shop Seller Center](https://seller-us.tiktok.com/)
2. Create seller account for Kenya
3. Verify business information
4. Set up payment methods

### TikTok Pixel Connection
1. In TikTok Ads Manager, go to Assets → Events
2. Connect TikTok Pixel (ID should be set in Railway env)
3. Verify pixel is firing events

### Product Feed Upload
1. In TikTok Shop Seller Center, go to Products → Catalog
2. Click "Import Products" → "From Feed"
3. Enter feed URL: `https://printhub.africa/tiktok-shop-feed`
4. Set format: CSV
5. Map fields and schedule updates

## 4. Snapchat Shopping

### Snap Pixel Verification
- ✅ Pixel ID set in Railway env
- ✅ Events firing: VIEW_CONTENT, ADD_CART, PURCHASE

### Catalog Setup
1. Go to [Snap Ads Manager](https://ads.snapchat.com/)
2. Go to Assets → Product Catalog
3. Click "Create Catalog" → "Data Feed"
4. Enter feed URL: `https://printhub.africa/facebook-catalog-feed` (reuse Facebook format)
5. Set format: CSV
6. Map fields and schedule updates

## 5. Pinterest Shopping

### Pinterest Business Account
1. Go to [Pinterest Business](https://business.pinterest.com/)
2. Claim printhub.africa domain
3. Verify website ownership

### Product Feed Setup
1. In Pinterest Ads Manager, go to Catalog
2. Click "Create Catalog" → "Data Feed"
3. Enter feed URL: `https://printhub.africa/pinterest-feed`
4. Set format: CSV
5. Map fields and schedule updates

### Rich Pins Setup
1. In Pinterest, go to Settings → Rich Pins
2. Enable Rich Pins for your domain
3. Verify product pages have correct meta tags

## 6. X (Twitter) Shopping

### X Pixel Verification
- ✅ Pixel ID set in Railway env
- ✅ Purchase events firing

### Conversion Tracking
1. In X Ads Manager, go to Tools → Conversion Tracking
2. Connect X Pixel
3. Set up purchase conversion event

## Facebook Catalog Image Issues
⚠️ **CRITICAL**: If Facebook shows "EMPTY_IMAGE_URL" errors for products:

### Problem
Facebook catalog contains old/stale products with retailer_ids like `test_product_retailer_id_1`, `test_product_retailer_id_2` that are not in your current feed but still exist in Facebook's catalog.

### Solution
1. **Go to [Meta Commerce Manager](https://business.facebook.com/commerce_manager/)**
2. **Navigate to your Catalog** → **Items**
3. **Search for the problematic products** using their retailer_id
4. **Delete the old test products** that show "EMPTY_IMAGE_URL" errors
5. **Re-upload your catalog** to ensure only current products are included

### Prevention
- Only upload products that have images
- Regularly clean up test products from Facebook catalog
- Ensure exportToMeta flag matches products you want in Facebook

### Current Status
✅ **Facebook feed working**: 4 products with valid images being exported
❌ **Old test products**: Need manual cleanup in Facebook Commerce Manager

See `docs/FACEBOOK_CATALOG_FIX.md` for detailed cleanup instructions.

## Troubleshooting

### Common Issues
- **Feeds not updating**: Check feed URLs are accessible
- **Pixels not firing**: Verify consent given and env vars set
- **Products not showing**: Check export flags in database
- **Verification failed**: Ensure meta tags are in head

### Support Contacts
- Meta: Business Support in Commerce Manager
- Google: Merchant Center Help Center
- TikTok: Seller Support
- Snapchat: Ads Support
- Pinterest: Business Support