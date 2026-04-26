require('dotenv').config();

const config = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
  phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '+254792732929',
  baseUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v19.0'}`,
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
