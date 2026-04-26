/**
 * ecommerceNotifications.js — Feature 4
 *
 * Call these functions from your existing PrintHub ecommerce code.
 * All functions use FREE-FORM text messages (valid within the 24-hour
 * customer service window — i.e. the customer messaged you first).
 *
 * ─── HOW TO SWITCH TO APPROVED TEMPLATES ─────────────────────────────────────
 * Once Meta approves your message templates (see templates/templateDefinitions.js),
 * replace the sendText() calls with sendTemplate() like this:
 *
 *   await sendTemplate(phone, 'order_confirmation', 'en_US', [
 *     { type: 'body', parameters: [
 *       { type: 'text', text: customerName },
 *       { type: 'text', text: orderId },
 *       { type: 'text', text: String(orderTotal) },
 *       { type: 'text', text: estimatedDelivery },
 *     ]},
 *   ]);
 *
 * Templates must be used when messaging customers who haven't messaged
 * you within the last 24 hours (e.g. scheduled reminders, proactive updates).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { sendText, sendTemplate, sendButtons } = require('./sendMessage');
const config = require('../config/whatsapp.config');

// Sanitize inputs to prevent injection in messages
function sanitize(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str.replace(/[<>]/g, '').trim().substring(0, 500);
}

function formatCurrency(amount) {
  return `KES ${Number(amount).toLocaleString('en-KE')}`;
}

// ─── a) Order Confirmation ────────────────────────────────────────────────────

/**
 * @param {string} customerPhone  - E.164, e.g. "254712345678"
 * @param {object} order
 * @param {string} order.customerName
 * @param {string} order.orderId
 * @param {number} order.orderTotal
 * @param {Array}  order.items          - [{name, quantity, price}]
 * @param {string} order.estimatedDelivery  - e.g. "3-5 business days"
 */
async function sendOrderConfirmation(customerPhone, { customerName, orderId, orderTotal, items = [], estimatedDelivery }) {
  const name    = sanitize(customerName);
  const id      = sanitize(orderId);
  const total   = formatCurrency(orderTotal);
  const eta     = sanitize(estimatedDelivery || '3-5 business days');

  const itemList = items
    .slice(0, 10) // WhatsApp has message length limits
    .map((i) => `  • ${sanitize(i.name)} × ${i.quantity}`)
    .join('\n');

  const message = [
    `✅ *Order Confirmed!*`,
    ``,
    `Hi ${name}, your order has been received. 🎉`,
    ``,
    `*Order ID:* #${id}`,
    itemList ? `*Items:*\n${itemList}` : '',
    `*Total:* ${total}`,
    `*Est. Delivery:* ${eta}`,
    ``,
    `You'll receive a WhatsApp update when your order ships.`,
    `To track your order, reply with *TRACK ${id}*.`,
    ``,
    `Thank you for choosing ${config.businessName}! 🖨️`,
  ].filter(Boolean).join('\n');

  return sendText(customerPhone, message);

  // ── TEMPLATE VERSION (uncomment after Meta approval) ──
  // return sendTemplate(customerPhone, 'order_confirmation', 'en_US', [{
  //   type: 'body',
  //   parameters: [
  //     { type: 'text', text: name },
  //     { type: 'text', text: id },
  //     { type: 'text', text: total },
  //     { type: 'text', text: eta },
  //   ],
  // }]);
}

// ─── b) Order Shipped ─────────────────────────────────────────────────────────

/**
 * @param {string} customerPhone
 * @param {object} shipment
 * @param {string} shipment.customerName
 * @param {string} shipment.orderId
 * @param {string} shipment.trackingNumber
 * @param {string} shipment.courierName
 */
async function sendShippingUpdate(customerPhone, { customerName, orderId, trackingNumber, courierName }) {
  const name    = sanitize(customerName);
  const id      = sanitize(orderId);
  const tracking = sanitize(trackingNumber);
  const courier  = sanitize(courierName);

  const message = [
    `🚚 *Your Order Has Shipped!*`,
    ``,
    `Hi ${name}, great news — your PrintHub order is on its way!`,
    ``,
    `*Order ID:* #${id}`,
    `*Courier:* ${courier}`,
    `*Tracking Number:* ${tracking}`,
    ``,
    `Nairobi deliveries: same/next day.`,
    `Outside Nairobi: 2–5 business days.`,
    ``,
    `Questions? Reply to this message or call us anytime.`,
    `— ${config.businessName} Team`,
  ].join('\n');

  return sendText(customerPhone, message);

  // ── TEMPLATE VERSION ──
  // return sendTemplate(customerPhone, 'shipping_update', 'en_US', [{
  //   type: 'body',
  //   parameters: [
  //     { type: 'text', text: name },
  //     { type: 'text', text: id },
  //     { type: 'text', text: courier },
  //     { type: 'text', text: tracking },
  //   ],
  // }]);
}

// ─── c) Order Delivered ───────────────────────────────────────────────────────

/**
 * @param {string} customerPhone
 * @param {object} delivery
 * @param {string} delivery.customerName
 * @param {string} delivery.orderId
 */
async function sendDeliveryConfirmation(customerPhone, { customerName, orderId }) {
  const name = sanitize(customerName);
  const id   = sanitize(orderId);

  const message = [
    `📦 *Order Delivered!*`,
    ``,
    `Hi ${name}, your order #${id} has been delivered. We hope you love it!`,
    ``,
    `⭐ We'd love your feedback — reply *REVIEW* to share your experience,`,
    `or visit https://printhub.africa to leave a review.`,
    ``,
    `Need anything else? We're here Mon–Sat, 8am–6pm EAT.`,
    `— ${config.businessName} Team`,
  ].join('\n');

  return sendText(customerPhone, message);

  // ── TEMPLATE VERSION ──
  // return sendTemplate(customerPhone, 'delivery_confirmation', 'en_US', [{
  //   type: 'body',
  //   parameters: [
  //     { type: 'text', text: name },
  //     { type: 'text', text: id },
  //   ],
  // }]);
}

// ─── d) Abandoned Cart Recovery ───────────────────────────────────────────────

/**
 * Call this ~1 hour after cart abandonment (schedule with a job queue or cron).
 * IMPORTANT: Can only use free-form text if the customer messaged within 24h.
 * For scheduled sends, you MUST use an approved template.
 *
 * @param {string} customerPhone
 * @param {object} cart
 * @param {string} cart.customerName
 * @param {Array}  cart.cartItems       - [{name, quantity}]
 * @param {number} cart.cartTotal
 * @param {string} cart.recoveryLink
 */
async function sendCartRecovery(customerPhone, { customerName, cartItems = [], cartTotal, recoveryLink }) {
  const name  = sanitize(customerName);
  const total = formatCurrency(cartTotal);
  const link  = sanitize(recoveryLink);

  const itemList = cartItems
    .slice(0, 5)
    .map((i) => `  • ${sanitize(i.name)} × ${i.quantity}`)
    .join('\n');

  const message = [
    `🛒 *You left something behind!*`,
    ``,
    `Hi ${name}, you have items waiting in your PrintHub cart:`,
    ``,
    itemList,
    ``,
    `*Cart Total:* ${total}`,
    ``,
    `Complete your order here 👇`,
    link,
    ``,
    `Need help? Just reply and we'll assist you.`,
    `— ${config.businessName} Team`,
  ].filter(Boolean).join('\n');

  return sendText(customerPhone, message);

  // ── TEMPLATE VERSION (required for proactive sends outside 24h window) ──
  // return sendTemplate(customerPhone, 'cart_recovery', 'en_US', [{
  //   type: 'body',
  //   parameters: [
  //     { type: 'text', text: name },
  //     { type: 'text', text: itemList },
  //     { type: 'text', text: total },
  //     { type: 'text', text: link },
  //   ],
  // }]);
}

// ─── e) Payment Reminder ──────────────────────────────────────────────────────

/**
 * @param {string} customerPhone
 * @param {object} reminder
 * @param {string} reminder.customerName
 * @param {string} reminder.orderId
 * @param {number} reminder.amount
 * @param {string} reminder.paymentLink
 */
async function sendPaymentReminder(customerPhone, { customerName, orderId, amount, paymentLink }) {
  const name   = sanitize(customerName);
  const id     = sanitize(orderId);
  const total  = formatCurrency(amount);
  const link   = sanitize(paymentLink);

  const message = [
    `💳 *Payment Reminder — ${config.businessName}*`,
    ``,
    `Hi ${name}, we noticed your order #${id} is awaiting payment.`,
    ``,
    `*Amount Due:* ${total}`,
    ``,
    `Pay securely via M-Pesa, card, or bank transfer:`,
    link,
    ``,
    `We accept M-Pesa (send to our till or follow the link above).`,
    `Your order will be processed as soon as payment is confirmed.`,
    ``,
    `Questions? Reply here — we're happy to help.`,
    `— ${config.businessName} Team`,
  ].join('\n');

  return sendText(customerPhone, message);

  // ── TEMPLATE VERSION ──
  // return sendTemplate(customerPhone, 'payment_reminder', 'en_US', [{
  //   type: 'body',
  //   parameters: [
  //     { type: 'text', text: name },
  //     { type: 'text', text: id },
  //     { type: 'text', text: total },
  //     { type: 'text', text: link },
  //   ],
  // }]);
}

module.exports = {
  sendOrderConfirmation,
  sendShippingUpdate,
  sendDeliveryConfirmation,
  sendCartRecovery,
  sendPaymentReminder,
};
