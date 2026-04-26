/**
 * autoReply.js — Feature 6
 * Keyword-based auto-reply bot.
 *
 * To add new keywords: edit the KEYWORD_RULES array below.
 * Each rule has: keywords[], type ('text' | 'list' | 'buttons'), and a handler function.
 *
 * Auto-reply is suppressed for 30 minutes when a human agent replies
 * from the dashboard (conversation.agentActive = true).
 */

const { sendText, sendList, sendButtons } = require('./sendMessage');
const Conversation = require('../models/Conversation');
const config = require('../config/whatsapp.config');

// ─── Keyword rules — edit freely ─────────────────────────────────────────────

const KEYWORD_RULES = [
  {
    // Greeting → welcome list menu
    keywords: ['hi', 'hello', 'hey', 'hii', 'helo', 'habari', 'jambo', 'sasa', 'niaje', 'sup'],
    type: 'list',
    handler: sendWelcomeMenu,
  },
  {
    // Business hours
    keywords: ['hours', 'time', 'open', 'opening', 'closing', 'schedule', 'available'],
    type: 'text',
    handler: sendHoursReply,
  },
  {
    // Track order
    keywords: ['track', 'tracking', 'where', 'when', 'delivery', 'status'],
    type: 'text',
    handler: sendTrackReply,
  },
  {
    // Pricing / quote
    keywords: ['quote', 'price', 'cost', 'how much', 'pricing', 'bei', 'pesa'],
    type: 'text',
    handler: sendQuoteReply,
  },
  {
    // Location / address
    keywords: ['location', 'address', 'where are you', 'directions', 'map'],
    type: 'text',
    handler: sendLocationReply,
  },
  {
    // Payment options
    keywords: ['pay', 'payment', 'mpesa', 'lipa', 'card', 'bank'],
    type: 'text',
    handler: sendPaymentReply,
  },
];

// ─── Interactive list reply handlers ─────────────────────────────────────────

const LIST_REPLY_HANDLERS = {
  track_order:     sendTrackReply,
  new_order:       sendNewOrderReply,
  get_quote:       sendQuoteReply,
  contact_support: sendSupportReply,
  opening_hours:   sendHoursReply,
};

// ─── Reply message builders ───────────────────────────────────────────────────

async function sendWelcomeMenu(to) {
  return sendList(
    to,
    `Hi there! 👋 Welcome to *${config.businessName}*.\n\nHow can we help you today? Choose an option below:`,
    'Choose an option',
    [
      {
        title: 'What do you need?',
        rows: [
          { id: 'track_order',     title: '📦 Track My Order',     description: 'Check your order status' },
          { id: 'new_order',       title: '🖨️ Place New Order',     description: '3D printing & products' },
          { id: 'get_quote',       title: '💬 Get a Quote',         description: 'Send us your 3D file' },
          { id: 'contact_support', title: '🙋 Contact Support',     description: 'Speak to our team' },
          { id: 'opening_hours',   title: '🕗 Opening Hours',       description: 'When we\'re available' },
        ],
      },
    ],
    `${config.businessName}`,
    'Mon–Sat · 8am–6pm EAT'
  );
}

async function sendHoursReply(to) {
  return sendText(
    to,
    `🕗 *${config.businessName} — Opening Hours*\n\n` +
    `Monday – Saturday: *8:00am – 6:00pm EAT*\n` +
    `Sunday: *Closed*\n` +
    `Public Holidays: *Closed*\n\n` +
    `For urgent queries outside hours, WhatsApp us and we will reply first thing in the morning.\n\n` +
    `📍 Based in Nairobi, Kenya · https://printhub.africa`
  );
}

async function sendTrackReply(to) {
  return sendText(
    to,
    `📦 *Track Your Order*\n\n` +
    `Please reply with your *order number* (e.g. #PH1234) and we will check the status for you right away.\n\n` +
    `You can also track online at:\n` +
    `https://printhub.africa/track\n\n` +
    `Our team responds within minutes during business hours (Mon–Sat, 8am–6pm EAT).`
  );
}

async function sendNewOrderReply(to) {
  return sendButtons(
    to,
    `🖨️ *Ready to place a new order?*\n\n` +
    `You can:\n` +
    `• Browse our ready-to-print catalogue\n` +
    `• Upload a custom 3D file for printing\n` +
    `• Request a custom design from scratch`,
    [
      { id: 'visit_shop',  title: '🛍️ Visit Shop' },
      { id: 'get_quote',   title: '📁 Upload File' },
      { id: 'human_help',  title: '💬 Talk to Us' },
    ],
    'New Order',
    'Visit us at printhub.africa'
  );
}

async function sendQuoteReply(to) {
  return sendText(
    to,
    `💬 *Get a 3D Printing Quote*\n\n` +
    `Upload your STL, OBJ, or 3MF file at:\n` +
    `👉 https://printhub.africa/get-a-quote\n\n` +
    `We'll review your file and send a confirmed quote within *2 business hours*.\n\n` +
    `*Don't have a file?* No problem — just describe what you need and we can help with design too.\n\n` +
    `Minimum order: *KES 800* · Payment via M-Pesa, card, or bank transfer.`
  );
}

async function sendSupportReply(to) {
  return sendText(
    to,
    `🙋 *PrintHub Africa Support*\n\n` +
    `You're now connected to our support team.\n\n` +
    `Please describe your issue or question and a team member will reply shortly.\n\n` +
    `⏱ Response time: within 30 minutes during business hours\n` +
    `🕗 Mon–Sat · 8:00am – 6:00pm EAT`
  );
}

async function sendLocationReply(to) {
  return sendText(
    to,
    `📍 *Find Us*\n\n` +
    `*${config.businessName}*\n` +
    `Nairobi, Kenya\n\n` +
    `Visit our website for the exact address:\n` +
    `https://printhub.africa/contact\n\n` +
    `*Collection:* Free collection from our Nairobi studio.\n` +
    `*Delivery:* Nationwide delivery to all 47 counties.`
  );
}

async function sendPaymentReply(to) {
  return sendText(
    to,
    `💳 *Payment Options — ${config.businessName}*\n\n` +
    `We accept:\n` +
    `• *M-Pesa* — Pay via our till number or M-Pesa link\n` +
    `• *Debit/Credit Card* — Visa, Mastercard via secure gateway\n` +
    `• *Bank Transfer* — For larger orders and corporate clients\n\n` +
    `Payment details are included in your order confirmation.\n` +
    `We never start printing until payment is confirmed. 🔒`
  );
}

// ─── Main auto-reply handler ───────────────────────────────────────────────────

/**
 * processAutoReply — call this from the webhook handler for every inbound message.
 * Returns true if an auto-reply was sent, false if suppressed or no match.
 *
 * @param {string} from         - customer phone
 * @param {object} messageData  - parsed message object from webhook
 * @param {object} conversation - Mongoose Conversation document
 */
async function processAutoReply(from, messageData, conversation) {
  // Suppress if a human agent replied recently
  if (conversation.isAgentActive()) {
    console.log(`[AutoReply] Suppressed for ${from} — agent active`);
    return false;
  }

  const type = messageData.type;

  // Handle interactive list/button reply
  if (type === 'interactive') {
    const replyId =
      messageData.interactive?.list_reply?.id ||
      messageData.interactive?.button_reply?.id;

    if (replyId && LIST_REPLY_HANDLERS[replyId]) {
      await LIST_REPLY_HANDLERS[replyId](from);
      return true;
    }
    return false;
  }

  // Only handle text messages for keyword matching
  if (type !== 'text') return false;

  const body = (messageData.text?.body || '').toLowerCase().trim();
  if (!body) return false;

  // Match against keyword rules
  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.some(
      (kw) => body === kw || body.startsWith(kw + ' ') || body.includes(kw)
    );
    if (matched) {
      try {
        await rule.handler(from);
        return true;
      } catch (err) {
        console.error(`[AutoReply] Handler error for keyword match:`, err.message);
        return false;
      }
    }
  }

  return false;
}

module.exports = { processAutoReply };
