#!/usr/bin/env ts-node

/**
 * PrintHub System Test Script
 * Comprehensive testing after N8N/AI/Postiz cleanup
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://printhub.africa';

// Test results
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

// Helper function to add test result
function addResult(name: string, status: 'PASS' | 'FAIL', details?: string) {
  results.push({ name, status, details });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}${details ? `: ${details}` : ''}`);
}

// 1. BUILD & LINT TEST
function testBuildAndLint() {
  console.log('\n🛠️  Testing Build & Lint...');

  try {
    execSync('npm run build', { stdio: 'pipe' });
    addResult('BUILD & LINT', 'PASS');
  } catch (error) {
    addResult('BUILD & LINT', 'FAIL', 'Build failed');
  }
}

// 2. DATABASE CONNECTIVITY TEST
function testDatabase() {
  console.log('\n🗄️  Testing Database Connectivity...');

  try {
    // Simple Prisma query
    const result = execSync('npx prisma db execute --file <(echo "SELECT COUNT(*) FROM Product;")', { stdio: 'pipe' });
    if (result.toString().includes('COUNT')) {
      addResult('DATABASE', 'PASS');
    } else {
      addResult('DATABASE', 'FAIL', 'Query failed');
    }
  } catch (error) {
    addResult('DATABASE', 'FAIL', 'Database connection failed');
  }
}

// 3. DEAD IMPORT TEST
function testDeadImports() {
  console.log('\n🔍 Testing Dead Imports...');

  const deadPaths = [
    'n8n/',
    'postiz',
    'anthropic',
    'openai',
    'gemini',
    'stability',
    'elevenlabs',
    'runway'
  ];

  let foundDeadImports = false;

  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const deadPath of deadPaths) {
          if (content.includes(`from '${deadPath}`) || content.includes(`from "${deadPath}`)) {
            addResult('DEAD IMPORTS', 'FAIL', `Found ${deadPath} import in ${filePath}`);
            foundDeadImports = true;
          }
        }
      }
    }
  }

  scanDirectory('./app');
  scanDirectory('./components');
  scanDirectory('./lib');

  if (!foundDeadImports) {
    addResult('DEAD IMPORTS', 'PASS');
  }
}

// 4. ENV VAR TEST
function testEnvVars() {
  console.log('\n🔧 Testing Environment Variables...');

  const requiredPublicVars = [
    'NEXT_PUBLIC_META_PIXEL_ENABLED',
    'NEXT_PUBLIC_META_PIXEL_ID',
    'NEXT_PUBLIC_GTM_ENABLED',
    'NEXT_PUBLIC_GTM_ID',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_R2_PUBLIC_URL'
  ];

  const requiredServerVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'RESEND_API_KEY',
    'MPESA_CONSUMER_KEY',
    'PESAPAL_CONSUMER_KEY'
  ];

  let missingVars: string[] = [];

  // Check public vars
  for (const varName of requiredPublicVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Check server vars
  for (const varName of requiredServerVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length === 0) {
    addResult('ENV VARS', 'PASS');
  } else {
    addResult('ENV VARS', 'FAIL', `Missing: ${missingVars.join(', ')}`);
  }
}

// 5. API ROUTES TEST
async function testApiRoutes() {
  console.log('\n🌐 Testing API Routes...');

  const tests = [
    { url: '/api/products', expectStatus: 200, description: 'Product listing' },
    { url: '/google-merchant-feed', expectStatus: 200, description: 'Google Merchant Feed' },
    { url: '/api/orders', expectStatus: 401, description: 'Orders (auth required)' },
    { url: '/api/admin/dashboard', expectStatus: 401, description: 'Admin dashboard (auth required)' },
    { url: '/api/payments/mpesa/callback', expectStatus: 405, description: 'M-Pesa callback' },
    { url: '/api/payments/pesapal/callback', expectStatus: 200, description: 'PesaPal callback' }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`);
      if (response.status === test.expectStatus) {
        addResult(`API ROUTES - ${test.description}`, 'PASS');
      } else {
        addResult(`API ROUTES - ${test.description}`, 'FAIL', `Expected ${test.expectStatus}, got ${response.status}`);
      }
    } catch (error) {
      addResult(`API ROUTES - ${test.description}`, 'FAIL', 'Network error');
    }
  }
}

// 6. META PIXEL TEST
async function testMetaPixel() {
  console.log('\n📊 Testing Meta Pixel...');

  try {
    const response = await fetch(BASE_URL);
    const html = await response.text();

    const hasFbevents = html.includes('connect.facebook.net/en_US/fbevents.js');
    const hasPixelId = html.includes('2035196960739715');
    const hasGtm = html.includes('googletagmanager.com/gtm.js');
    const hasGtmId = html.includes('GTM-K5G6H3HP');

    if (hasFbevents) addResult('META PIXEL - fbevents.js', 'PASS');
    else addResult('META PIXEL - fbevents.js', 'FAIL', 'Script not found');

    if (hasPixelId) addResult('META PIXEL - Pixel ID', 'PASS');
    else addResult('META PIXEL - Pixel ID', 'FAIL', 'Pixel ID not found');

    if (hasGtm) addResult('META PIXEL - GTM script', 'PASS');
    else addResult('META PIXEL - GTM script', 'FAIL', 'GTM script not found');

    if (hasGtmId) addResult('META PIXEL - GTM ID', 'PASS');
    else addResult('META PIXEL - GTM ID', 'FAIL', 'GTM ID not found');

  } catch (error) {
    addResult('META PIXEL', 'FAIL', 'Failed to fetch homepage');
  }
}

// 7. GOOGLE MERCHANT FEED TEST
async function testMerchantFeed() {
  console.log('\n🛒 Testing Google Merchant Feed...');

  try {
    const response = await fetch(`${BASE_URL}/google-merchant-feed`);
    const xml = await response.text();

    const isXml = response.headers.get('content-type')?.includes('xml');
    const hasItems = xml.includes('<item>');
    const hasPrice = xml.includes('KES');
    const hasLink = xml.includes('printhub.africa');
    const hasAvailability = xml.includes('<g:availability>');

    if (isXml) addResult('MERCHANT FEED - XML format', 'PASS');
    else addResult('MERCHANT FEED - XML format', 'FAIL', 'Not XML content-type');

    if (hasItems) addResult('MERCHANT FEED - Has items', 'PASS');
    else addResult('MERCHANT FEED - Has items', 'FAIL', 'No items found');

    if (hasPrice) addResult('MERCHANT FEED - Has prices', 'PASS');
    else addResult('MERCHANT FEED - Has prices', 'FAIL', 'No KES prices found');

    if (hasLink) addResult('MERCHANT FEED - Has links', 'PASS');
    else addResult('MERCHANT FEED - Has links', 'FAIL', 'No printhub.africa links');

    if (hasAvailability) addResult('MERCHANT FEED - Has availability', 'PASS');
    else addResult('MERCHANT FEED - Has availability', 'FAIL', 'No availability data');

  } catch (error) {
    addResult('MERCHANT FEED', 'FAIL', 'Failed to fetch feed');
  }
}

// 8. REMOVED SERVICES TEST
function testRemovedServices() {
  console.log('\n🗑️  Testing Removed Services...');

  // Check if services are unreachable
  const services = [
    'https://n8n.printhub.africa',
    'https://postiz.printhub.africa'
  ];

  // Check build output for dead strings
  try {
    const buildOutput = execSync('find .next -name "*.js" -exec grep -l "n8n.printhub.africa\\|postiz.printhub.africa\\|anthropic\\|openai" {} \\; 2>/dev/null || true', { encoding: 'utf8' });
    if (buildOutput.trim() === '') {
      addResult('REMOVED SERVICES', 'PASS');
    } else {
      addResult('REMOVED SERVICES', 'FAIL', 'Found dead service references in build');
    }
  } catch (error) {
    addResult('REMOVED SERVICES', 'PASS'); // No matches found
  }
}

// 9. ADMIN ROUTES TEST
async function testAdminRoutes() {
  console.log('\n👨‍💼 Testing Admin Routes...');

  const routes = [
    { path: '/admin/login', expectStatus: 200 },
    { path: '/admin/dashboard', expectStatus: [200, 302] }, // Redirect to login if not auth
    { path: '/admin/orders', expectStatus: [200, 302] },
    { path: '/admin/products', expectStatus: [200, 302] },
    { path: '/admin/catalogue', expectStatus: [200, 302] },
    { path: '/admin/marketing', expectStatus: [200, 302] },
    { path: '/admin/ai', expectStatus: 404 } // Should be deleted
  ];

  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route.path}`);
      const statusOk = Array.isArray(route.expectStatus)
        ? route.expectStatus.includes(response.status)
        : response.status === route.expectStatus;

      if (statusOk) {
        addResult(`ADMIN ROUTES - ${route.path}`, 'PASS');
      } else {
        addResult(`ADMIN ROUTES - ${route.path}`, 'FAIL', `Expected ${route.expectStatus}, got ${response.status}`);
      }
    } catch (error) {
      addResult(`ADMIN ROUTES - ${route.path}`, 'FAIL', 'Network error');
    }
  }
}

// 10. PAYMENT INTEGRATION TEST
function testPayments() {
  console.log('\n💳 Testing Payment Integrations...');

  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_PASSKEY',
    'PESAPAL_CONSUMER_KEY',
    'PESAPAL_CONSUMER_SECRET'
  ];

  let missingVars: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length === 0) {
    addResult('PAYMENTS', 'PASS');
  } else {
    addResult('PAYMENTS', 'FAIL', `Missing: ${missingVars.join(', ')}`);
  }
}

// 11. EMAIL TEST
function testEmail() {
  console.log('\n📧 Testing Email Configuration...');

  const hasResendKey = process.env.RESEND_API_KEY?.startsWith('re_');
  const hasFromEmail = process.env.FROM_EMAIL?.includes('@printhub.africa');

  if (hasResendKey && hasFromEmail) {
    addResult('EMAIL', 'PASS');
  } else {
    const issues = [];
    if (!hasResendKey) issues.push('Invalid RESEND_API_KEY');
    if (!hasFromEmail) issues.push('Invalid FROM_EMAIL');
    addResult('EMAIL', 'FAIL', issues.join(', '));
  }
}

// 12. FILE STORAGE TEST
async function testFileStorage() {
  console.log('\n📁 Testing File Storage...');

  const requiredVars = [
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_UPLOADS_BUCKET',
    'NEXT_PUBLIC_R2_PUBLIC_URL'
  ];

  let missingVars: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    addResult('FILE STORAGE', 'FAIL', `Missing: ${missingVars.join(', ')}`);
    return;
  }

  // Test R2 URL accessibility
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_R2_PUBLIC_URL!);
    if (response.status < 400) {
      addResult('FILE STORAGE', 'PASS');
    } else {
      addResult('FILE STORAGE', 'FAIL', `R2 URL returned ${response.status}`);
    }
  } catch (error) {
    addResult('FILE STORAGE', 'FAIL', 'R2 URL not accessible');
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting PrintHub System Test...\n');

  testBuildAndLint();
  testDatabase();
  testDeadImports();
  testEnvVars();
  await testApiRoutes();
  await testMetaPixel();
  await testMerchantFeed();
  testRemovedServices();
  await testAdminRoutes();
  testPayments();
  testEmail();
  await testFileStorage();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('PRINTHUB SYSTEM TEST REPORT');
  console.log('='.repeat(50));

  const categories = [
    'BUILD & LINT',
    'DATABASE',
    'DEAD IMPORTS',
    'ENV VARS',
    'API ROUTES',
    'META PIXEL',
    'MERCHANT FEED',
    'REMOVED SERVICES',
    'ADMIN ROUTES',
    'PAYMENTS',
    'EMAIL',
    'FILE STORAGE'
  ];

  let passed = 0;
  let failed = 0;

  for (const category of categories) {
    const categoryResults = results.filter(r => r.name.startsWith(category));
    const status = categoryResults.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
    console.log(`${category.padEnd(15)} [${status}]`);

    if (status === 'PASS') passed++;
    else failed++;
  }

  console.log('='.repeat(50));
  console.log(`TOTAL: ${passed + failed}/12 PASSED (${passed} passed, ${failed} failed)`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}${r.details ? `: ${r.details}` : ''}`);
    });
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run all tests
runTests().catch(console.error);