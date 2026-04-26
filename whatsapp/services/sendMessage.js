/**
 * sendMessage.js — Feature 3
 * All outbound WhatsApp message functions.
 * Every send function saves to the database and returns { success, messageId, error }.
 */

const axios = require('axios');
const config = require('../config/whatsapp.config');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');

// ─── Internal HTTP client ────────────────────────────────────────────────────

const waClient = axios.create({
  baseURL: `${config.baseUrl}/${config.phoneNumberId}`,
  headers: {
    Authorization: `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Helper: save outbound message to DB ─────────────────────────────────────

async function saveOutbound({ to, type, content, mediaId, mediaUrl, messageId, status = 'sent' }) {
  try {
    let conversation = await Conversation.findOne({ customerPhone: to });
    let customer = await Customer.findOne({ phone: to });

    if (!customer) {
      customer = await Customer.create({ phone: to, name: to });
    }
    if (!conversation) {
      conversation = await Conversation.create({
        customerId: customer._id,
        customerPhone: to,
        customerName: customer.name,
        channel: 'whatsapp',
      });
    }

    const preview = content ? content.substring(0, 80) : `[${type}]`;

    await Message.create({
      messageId,
      conversationId: conversation._id,
      customerId: customer._id,
      from: config.phoneNumber,
      to,
      channel: 'whatsapp',
      direction: 'outbound',
      type,
      content: content || '',
      mediaId: mediaId || null,
      mediaUrl: mediaUrl || null,
      status,
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: preview,
      lastMessageAt: new Date(),
      lastDirection: 'outbound',
      $inc: { totalMessages: 1 },
    });

    await Customer.findByIdAndUpdate(customer._id, {
      lastContactAt: new Date(),
      $inc: { totalMessages: 1 },
    });
  } catch (err) {
    console.error('[saveOutbound] DB error:', err.message);
  }
}

// ─── Helper: call Graph API and handle errors ─────────────────────────────────

async function callGraphAPI(payload) {
  try {
    const { data } = await waClient.post('/messages', payload);
    const messageId = data?.messages?.[0]?.id || null;
    return { success: true, messageId };
  } catch (err) {
    const apiError = err.response?.data?.error;
    console.error('[WhatsApp API Error]', JSON.stringify(apiError || err.message));
    return {
      success: false,
      messageId: null,
      error: apiError?.message || err.message,
      errorCode: apiError?.code,
    };
  }
}

// ─── 1. Send plain text ───────────────────────────────────────────────────────

/**
 * @param {string} to   - E.164 phone number, e.g. "254712345678"
 * @param {string} text - Message body (supports WhatsApp markdown: *bold*, _italic_, ~strike~)
 */
async function sendText(to, text) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  const result = await callGraphAPI(payload);
  await saveOutbound({ to, type: 'text', content: text, messageId: result.messageId, status: result.success ? 'sent' : 'failed' });
  return result;
}

// ─── 2. Send template message ─────────────────────────────────────────────────

/**
 * @param {string}   to           - E.164 number
 * @param {string}   templateName - Approved template name
 * @param {string}   languageCode - e.g. "en_US"
 * @param {Array}    components   - Template component array (header, body, buttons)
 */
async function sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  const result = await callGraphAPI(payload);
  await saveOutbound({ to, type: 'template', content: `[Template: ${templateName}]`, messageId: result.messageId, status: result.success ? 'sent' : 'failed' });
  return result;
}

// ─── 3. Send image with caption ───────────────────────────────────────────────

/**
 * @param {string} to      - E.164 number
 * @param {string} imageUrl - Publicly accessible image URL
 * @param {string} caption  - Optional caption text
 */
async function sendImage(to, imageUrl, caption = '') {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  };

  const result = await callGraphAPI(payload);
  await saveOutbound({ to, type: 'image', content: caption, mediaUrl: imageUrl, messageId: result.messageId, status: result.success ? 'sent' : 'failed' });
  return result;
}

// ─── 4. Send interactive button message ──────────────────────────────────────

/**
 * @param {string} to      - E.164 number
 * @param {string} bodyText - Message body
 * @param {Array}  buttons  - [{id, title}] — max 3 buttons
 * @param {string} headerText - Optional header
 * @param {string} footerText - Optional footer
 */
async function sendButtons(to, bodyText, buttons, headerText = '', footerText = '') {
  if (buttons.length > 3) throw new Error('Maximum 3 buttons allowed');

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(headerText && { header: { type: 'text', text: headerText } }),
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title.substring(0, 20) },
        })),
      },
    },
  };

  const result = await callGraphAPI(payload);
  await saveOutbound({ to, type: 'interactive', content: bodyText, messageId: result.messageId, status: result.success ? 'sent' : 'failed' });
  return result;
}

// ─── 5. Send interactive list message ────────────────────────────────────────

/**
 * @param {string} to          - E.164 number
 * @param {string} bodyText    - Message body
 * @param {string} buttonLabel - The button that opens the list (max 20 chars)
 * @param {Array}  sections    - [{title, rows: [{id, title, description?}]}]
 * @param {string} headerText  - Optional header
 * @param {string} footerText  - Optional footer
 */
async function sendList(to, bodyText, buttonLabel, sections, headerText = '', footerText = '') {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(headerText && { header: { type: 'text', text: headerText } }),
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: {
        button: buttonLabel.substring(0, 20),
        sections,
      },
    },
  };

  const result = await callGraphAPI(payload);
  await saveOutbound({ to, type: 'interactive', content: bodyText, messageId: result.messageId, status: result.success ? 'sent' : 'failed' });
  return result;
}

// ─── 6. Mark message as read ──────────────────────────────────────────────────

async function markAsRead(messageId) {
  try {
    await waClient.post('/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  } catch (err) {
    // Non-fatal — log and continue
    console.error('[markAsRead] Error:', err.response?.data?.error?.message || err.message);
  }
}

module.exports = {
  sendText,
  sendTemplate,
  sendImage,
  sendButtons,
  sendList,
  markAsRead,
  saveOutbound,
};
