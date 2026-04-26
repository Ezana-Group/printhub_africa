require('dotenv').config();

const config = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  metaVerifyToken: process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN,
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
  phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '+254792732929',
  baseUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v19.0'}`,
  baseGraphUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v19.0'}`,
  metaPageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN,
  instagramBusinessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
  metaPageId: process.env.META_PAGE_ID || '',
  skipSignatureVerification:
    String(process.env.WHATSAPP_SKIP_SIGNATURE_VERIFY || 'false').toLowerCase() === 'true',
  businessName: process.env.BUSINESS_NAME || 'PrintHub Africa',
  businessHoursStart: parseInt(process.env.BUSINESS_HOURS_START || '8', 10),
  businessHoursEnd: parseInt(process.env.BUSINESS_HOURS_END || '18', 10),
  timezone: process.env.BUSINESS_TIMEZONE || 'Africa/Nairobi',
};

// Validate required fields at startup
const required = ['phoneNumberId', 'accessToken', 'appSecret', 'verifyToken'];
for (const key of required) {
  if (!config[key]) {
    console.error(`❌ Missing required env var: WHATSAPP_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    process.exit(1);
  }
}

module.exports = config;
