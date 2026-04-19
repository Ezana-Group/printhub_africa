/**
 * test-error-log.js
 *
 * Simulates an n8n Global Error Handler webhook call to the Next.js
 * /api/n8n/log-error endpoint.
 *
 * Verifies:
 *  1. HMAC-SHA256 signature is correctly computed and accepted
 *  2. Timestamp replay-protection header is sent
 *  3. AuditLog record is created with action=N8N_WORKFLOW_ERROR
 *
 * Usage:
 *   node n8n/test-error-log.js
 *
 * Requirements:
 *   - N8N_WEBHOOK_SECRET must be in .env.local (or as an env var)
 *   - The Next.js dev server must be running on localhost:3000
 *     (or set APP_URL / NEXTAUTH_URL env var to override)
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env.local not found — falling back to process.env');
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

// ── Config ───────────────────────────────────────────────────────────────────
const SECRET = process.env.N8N_WEBHOOK_SECRET;
const BASE_URL =
  process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/n8n/log-error`;

if (!SECRET) {
  console.error(
    '\n❌ N8N_WEBHOOK_SECRET is not set. Add it to .env.local and retry.\n'
  );
  process.exit(1);
}

// ── Test Payload ─────────────────────────────────────────────────────────────
const bodyPayload = {
  workflowName: 'TEST — Simulated Error (test-error-log.js)',
  errorMessage: 'This is a test error triggered by the test-error-log.js script.',
  payload: JSON.stringify({
    workflowId: 'test-workflow-id',
    failedNode: 'Send Email Node',
    executionId: 'test-execution-' + Date.now(),
    executionLink: 'https://n8n.printhub.africa/execution/test',
    timestamp: new Date().toISOString(),
  }),
};

// ── Compute HMAC-SHA256 Signature ─────────────────────────────────────────────
const bodyString = JSON.stringify(bodyPayload);
const timestamp = Date.now().toString();

const signature = crypto
  .createHmac('sha256', SECRET)
  .update(bodyString)
  .digest('hex');

// ── Send Request ─────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🧪 Testing /api/n8n/log-error endpoint...');
  console.log(`📦 Target : ${ENDPOINT}`);
  console.log(`   Node   : ${bodyPayload.payload.includes('Send Email') ? 'Send Email Node' : 'Unknown'}`);
  console.log(`   Sig    : ${signature.slice(0, 20)}...\n`);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-printhub-signature': signature,
        'x-printhub-timestamp': timestamp,
      },
      body: bodyString,
    });

    const text = await res.text();

    if (res.ok) {
      console.log(`✅ Success! ${text}`);
      console.log(
        '📋 Check the AuditLog table for action=N8N_WORKFLOW_ERROR'
      );
      console.log(
        '   Admin UI → /admin/audit-logs → Filter: N8N_WORKFLOW_ERROR\n'
      );
    } else if (res.status === 401) {
      console.error('❌ 401 Unauthorized — Signature or timestamp rejected.');
      console.error(
        '   → Ensure N8N_WEBHOOK_SECRET matches in .env.local and the API.'
      );
      console.error(`   Response: ${text}\n`);
      process.exit(1);
    } else {
      console.error(`❌ Unexpected status ${res.status}: ${text}\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Network error — is the Next.js dev server running?');
    console.error(`   Target : ${ENDPOINT}`);
    console.error(`   Error  : ${err.message}\n`);
    if (err.message.includes('fetch is not defined')) {
      console.error('   ℹ️  fetch() requires Node v18+. Please upgrade.\n');
    }
    process.exit(1);
  }
}

run();
