/**
 * templateDefinitions.js — Feature 5
 *
 * These are the exact template payloads to submit to Meta for approval.
 * Run createTemplate(templateName) to submit via the API.
 *
 * After approval, update your ecommerceNotifications.js functions
 * to use sendTemplate() instead of sendText().
 *
 * Meta template approval typically takes 24–72 hours.
 * Check status at: https://business.facebook.com/wa/manage/message-templates/
 */

require('dotenv').config();
const axios = require('axios');
const config = require('../config/whatsapp.config');

const waClient = axios.create({
  baseURL: `${config.baseUrl}/${config.businessAccountId}`,
  headers: {
    Authorization: `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
  },
});

// ─── Template Definitions ─────────────────────────────────────────────────────

const TEMPLATES = {

  order_confirmation: {
    name: 'order_confirmation',
    language: 'en_US',
    category: 'TRANSACTIONAL',  // TRANSACTIONAL = free; MARKETING = paid
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '✅ Order Confirmed — PrintHub Africa',
      },
      {
        type: 'BODY',
        text:
          'Hi {{1}}, your order has been confirmed! 🎉\n\n' +
          '*Order ID:* #{{2}}\n' +
          '*Total:* KES {{3}}\n' +
          '*Est. Delivery:* {{4}}\n\n' +
          'We\'ll send you a WhatsApp update when your order ships.\n' +
          'Reply *TRACK {{2}}* anytime to check your status.',
        example: {
          body_text: [['Jane Wanjiku', 'PH1234', '2,500', '3-5 business days']],
        },
      },
      {
        type: 'FOOTER',
        text: 'PrintHub Africa · printhub.africa',
      },
    ],
  },

  shipping_update: {
    name: 'shipping_update',
    language: 'en_US',
    category: 'TRANSACTIONAL',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🚚 Your Order Has Shipped!',
      },
      {
        type: 'BODY',
        text:
          'Hi {{1}}, great news — your PrintHub order is on its way!\n\n' +
          '*Order ID:* #{{2}}\n' +
          '*Courier:* {{3}}\n' +
          '*Tracking Number:* {{4}}\n\n' +
          'Nairobi: same/next day · Outside Nairobi: 2–5 business days.\n' +
          'Questions? Reply to this message.',
        example: {
          body_text: [['Jane Wanjiku', 'PH1234', 'G4S Courier', 'TRK987654']],
        },
      },
      {
        type: 'FOOTER',
        text: 'PrintHub Africa · printhub.africa',
      },
    ],
  },

  delivery_confirmation: {
    name: 'delivery_confirmation',
    language: 'en_US',
    category: 'TRANSACTIONAL',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '📦 Order Delivered!',
      },
      {
        type: 'BODY',
        text:
          'Hi {{1}}, your order #{{2}} has been delivered. We hope you love it! 🎉\n\n' +
          '⭐ We\'d love your feedback — reply *REVIEW* to share your experience,\n' +
          'or visit https://printhub.africa to leave a review.\n\n' +
          'Need anything else? We\'re here Mon–Sat, 8am–6pm EAT.',
        example: {
          body_text: [['Jane Wanjiku', 'PH1234']],
        },
      },
      {
        type: 'FOOTER',
        text: 'PrintHub Africa · printhub.africa',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Leave a Review',
            url:  'https://printhub.africa/review?order={{1}}',
            example: ['PH1234'],
          },
        ],
      },
    ],
  },

  cart_recovery: {
    name: 'cart_recovery',
    language: 'en_US',
    category: 'MARKETING',      // Must be MARKETING for promotional content
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🛒 You left something behind!',
      },
      {
        type: 'BODY',
        text:
          'Hi {{1}}, you have items waiting in your PrintHub cart:\n\n' +
          '{{2}}\n\n' +
          '*Cart Total:* KES {{3}}\n\n' +
          'Complete your order here 👇\n{{4}}',
        example: {
          body_text: [
            ['Jane Wanjiku', '• Lampshade × 1\n• Phone Stand × 2', '3,500', 'https://printhub.africa/cart'],
          ],
        },
      },
      {
        type: 'FOOTER',
        text: 'Reply STOP to unsubscribe from cart reminders.',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Complete My Order',
            url:  '{{1}}',
            example: ['https://printhub.africa/cart'],
          },
        ],
      },
    ],
  },

  payment_reminder: {
    name: 'payment_reminder',
    language: 'en_US',
    category: 'TRANSACTIONAL',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '💳 Payment Reminder — PrintHub Africa',
      },
      {
        type: 'BODY',
        text:
          'Hi {{1}}, your order #{{2}} is awaiting payment.\n\n' +
          '*Amount Due:* KES {{3}}\n\n' +
          'Pay securely via M-Pesa, card, or bank transfer:\n{{4}}\n\n' +
          'Your order will be processed as soon as payment is confirmed. 🔒',
        example: {
          body_text: [
            ['Jane Wanjiku', 'PH1234', '2,500', 'https://printhub.africa/pay/PH1234'],
          ],
        },
      },
      {
        type: 'FOOTER',
        text: 'PrintHub Africa · Mon–Sat 8am–6pm EAT',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Pay Now',
            url:  '{{1}}',
            example: ['https://printhub.africa/pay/PH1234'],
          },
        ],
      },
    ],
  },
};

// ─── Submit a template to Meta for approval ───────────────────────────────────

async function createTemplate(templateKey) {
  const template = TEMPLATES[templateKey];
  if (!template) {
    console.error(`Unknown template: "${templateKey}". Available: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  console.log(`\nSubmitting template: "${template.name}"...`);

  try {
    const { data } = await waClient.post('/message_templates', template);
    console.log(`✅ Template submitted!`);
    console.log(`   ID:     ${data.id}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Check approval at: https://business.facebook.com/wa/manage/message-templates/`);
    return data;
  } catch (err) {
    const apiErr = err.response?.data?.error;
    console.error(`❌ Failed to submit template:`, apiErr?.message || err.message);
    if (apiErr?.error_subcode === 2388094) {
      console.error('   Template name already exists. Delete it first or use a different name.');
    }
    process.exit(1);
  }
}

// ─── CLI usage: node templates/templateDefinitions.js <templateName> ──────────

if (require.main === module) {
  const templateKey = process.argv[2];
  if (!templateKey) {
    console.log('Usage: node templates/templateDefinitions.js <templateName>');
    console.log('Available templates:', Object.keys(TEMPLATES).join(', '));
    process.exit(0);
  }
  createTemplate(templateKey);
}

module.exports = { TEMPLATES, createTemplate };
