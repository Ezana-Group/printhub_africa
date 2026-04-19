#!/usr/bin/env node
/**
 * Bulk-seeds all required n8n Variables via the n8n REST API.
 * Usage: N8N_API_KEY=<your-key> node scripts/seed-n8n-variables.mjs
 *
 * Get your API key: n8n UI → Settings → n8n API → Create an API Key
 */

import https from "https";

const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://n8n.printhub.africa";
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error("ERROR: Set N8N_API_KEY environment variable first.");
  console.error("  n8n UI → Settings → n8n API → Create an API Key, then run:");
  console.error("  N8N_API_KEY=<key> node scripts/seed-n8n-variables.mjs");
  process.exit(1);
}

// All values from your Railway n8n service variables.
// Empty strings = not configured yet (will be skipped).
const VARIABLES = {
  // Core
  ADMIN_URL: "https://admin.printhub.africa",
  APP_URL: "https://printhub.africa",
  WEBHOOK_URL: "https://n8n.printhub.africa",
  N8N_BASE_URL: "https://n8n.printhub.africa",
  N8N_WEBHOOK_SECRET: "2811f4818eb1daadf969fd4fbdb0106a85f3253037013e1c5f192dc34583c159",
  COMBINE_SECRET: "36aa51621880830661920b00ffa1d883405276654fc1ee2920fd64ed0f2ab1f5",

  // Email
  FROM_NAME: "PrintHub Africa",
  FROM_EMAIL: "hello@printhub.africa",
  ADMIN_EMAIL: "admin@printhub.africa",
  SUPER_ADMIN_EMAIL: "admin@printhub.africa",
  RESEND_API_KEY: "re_6zAxQeh2_FSRrXZUtCYor8qgu9m8WnCJE",

  // AI — fill from your Railway n8n service variables
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  PERPLEXITY_API_KEY: "",

  // Telegram
  TELEGRAM_BOT_TOKEN: "8206966068:AAFrKWuSkgtssD5CO9poUP4IGETkSZfiD6g",
  TELEGRAM_STAFF_GROUP_ID: "-5144055931",
  TELEGRAM_CHANNEL_ID: "-1003955698939",

  // WhatsApp
  WHATSAPP_PHONE_NUMBER_ID: "1071363066063064",
  WHATSAPP_ACCESS_TOKEN: "EAAXwZBbnEIWMBRE7bdXv2CMxdPujJsTZAlC4n4yzRXHmTGhyofJZBhRR9pMbnme0guTKZCGM4NKX72gtKbdgAPWZCtgHsHhPZBtKDmye62fi5WRDqLWTaSroBrOQZAIvGUyiYCf5iIQyz9wfKwim6jqA3uh1Q9H1VQY1ucnIeneb3UPUmdZAOgP8499fyegM5ukUnaHFQvZBXqlY88KwqZB2IFXX1EpuXZCEtUXe03j2vnD9rE8ZCkkthWPycZAvZAtZCOpwWFA5sHfEE90q7fS2wHiJe4mZAnr5iwQZD",
  BUSINESS_PHONE: "",
  STAFF_WHATSAPP_NUMBER: "",

  // AfricasTalking SMS
  AT_API_KEY: "atsk_64046b35b009de6141e348b1999b6c099f745312391a859a0174432e1f84d3a61950ac12",
  AT_USERNAME: "sandbox",
  MARKETING_SMS_LIST: "",

  // Media generation
  ELEVENLABS_API_KEY: "sk_c654532493ad1be4a0f0121d650cff03bae3f9cf22ee96dd",
  ELEVENLABS_VOICE_ID: "Printhub_n8n",
  RUNWAY_API_KEY: "key_23ed27ee7f8f73ddfaff8d6c1ba5cacfb83c7ce31051569fdbcd351bc48b76c01910a39d42d0f8539e0717917b85e797b2e44a6fccf266063738fa5c54446fe2",
  STABILITY_API_KEY: "sk-drJK88Rz33Q4PlvtEMcTNQ47Vujs2rbdZLBkvuvz0kwHW5tR",
  FFMPEG_SERVICE_URL: "https://printhub-ffmpeg.railway.app",
  R2_PUBLIC_URL: "",

  // Meta / Social (fill when accounts connected)
  META_ACCESS_TOKEN: "",
  META_CATALOG_ID: "",
  META_AD_ACCOUNT_ID: "",
  META_PIXEL_ID: "",
  TIKTOK_EVENTS_API_TOKEN: "",
  TIKTOK_CATALOG_ID: "",
  LINKEDIN_ORGANIZATION_ID: "",
  POSTIZ_API_KEY: "",
  POSTIZ_BASE_URL: "",

  // Listmonk (fill when self-hosted instance is live)
  LISTMONK_URL: "",
  LISTMONK_DEFAULT_LIST_ID: "1",

  // Klaviyo
  KLAVIYO_API_KEY: "",

  // Maps / review platforms
  GOOGLE_ACCOUNT_ID: "",
  GOOGLE_LOCATION_ID: "",
  BING_MAPS_KEY: "",
  BING_BUSINESS_ID: "",
  APPLE_PLACE_ID: "",

  // Classifieds
  OLX_EMAIL: "",
  OLX_PASSWORD: "",
  PIGIAME_EMAIL: "",
  PIGIAME_PASSWORD: "",
};

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, N8N_BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`Connecting to ${N8N_BASE_URL}...\n`);

  const existing = await apiRequest("GET", "/api/v1/variables?limit=200");
  if (existing.status !== 200) {
    console.error("Failed to fetch existing variables. Check API key + URL.");
    console.error(existing.body);
    process.exit(1);
  }

  const existingMap = {};
  for (const v of existing.body.data || []) existingMap[v.key] = v.id;
  console.log(`Existing variables on n8n: ${Object.keys(existingMap).length}\n`);

  let created = 0, updated = 0, skipped = 0;

  for (const [key, value] of Object.entries(VARIABLES)) {
    if (!value) {
      console.log(`  SKIP   ${key} (empty)`);
      skipped++;
      continue;
    }

    if (existingMap[key]) {
      const res = await apiRequest("PATCH", `/api/v1/variables/${existingMap[key]}`, { value });
      if (res.status === 200) { console.log(`  UPDATE ${key}`); updated++; }
      else console.log(`  ERROR  ${key}: ${res.status}`, res.body);
    } else {
      const res = await apiRequest("POST", "/api/v1/variables", { key, value });
      if (res.status === 201 || res.status === 200) { console.log(`  CREATE ${key}`); created++; }
      else console.log(`  ERROR  ${key}: ${res.status}`, res.body);
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${skipped} skipped.`);
}

main().catch(console.error);
