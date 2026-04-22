#!/usr/bin/env ts-node

/**
 * Test Analytics Script
 * Verifies Meta Pixel, GTM, and Google Merchant Feed are working correctly.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://printhub.africa';

async function testAnalytics() {
  console.log('🧪 Testing Analytics Integration...\n');

  const results = {
    metaPixel: false,
    gtm: false,
    merchantFeed: false,
  };

  try {
    // Test 1: Meta Pixel (fbevents.js script present)
    console.log('1. Testing Meta Pixel...');
    const homepageResponse = await fetch(BASE_URL);
    const homepageHtml = await homepageResponse.text();

    if (homepageHtml.includes('connect.facebook.net/en_US/fbevents.js')) {
      console.log('✅ Meta Pixel script found');
      results.metaPixel = true;
    } else {
      console.log('❌ Meta Pixel script NOT found');
    }

    // Test 2: GTM script present
    console.log('\n2. Testing GTM...');
    if (homepageHtml.includes('googletagmanager.com/gtm.js')) {
      console.log('✅ GTM script found');
      results.gtm = true;
    } else {
      console.log('❌ GTM script NOT found');
    }

    // Test 3: Google Merchant Feed
    console.log('\n3. Testing Google Merchant Feed...');
    const feedResponse = await fetch(`${BASE_URL}/google-merchant-feed`);
    const feedXml = await feedResponse.text();

    if (feedResponse.ok && feedXml.includes('<g:id>') && feedXml.includes('PrintHub Africa')) {
      const itemCount = (feedXml.match(/<item>/g) || []).length;
      console.log(`✅ Google Merchant Feed working (${itemCount} items)`);
      results.merchantFeed = true;
    } else {
      console.log('❌ Google Merchant Feed failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`Meta Pixel: ${results.metaPixel ? 'PASS' : 'FAIL'}`);
  console.log(`GTM: ${results.gtm ? 'PASS' : 'FAIL'}`);
  console.log(`Google Merchant Feed: ${results.merchantFeed ? 'PASS' : 'FAIL'}`);

  const allPass = Object.values(results).every(Boolean);
  console.log(`\n${allPass ? '🎉 All tests PASSED!' : '⚠️  Some tests FAILED'}`);

  process.exit(allPass ? 0 : 1);
}

testAnalytics();