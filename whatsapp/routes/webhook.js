/**
 * webhook.js — Feature 1
 * GET  /webhook — Meta webhook verification
 * POST /webhook — Receive all WhatsApp events
 */

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

const config       = require('../config/whatsapp.config');
const Message      = require('../models/Message');
const Conversation = require('../models/Conversation');
const Customer     = require('../models/Customer');
const { markAsRead }       = require('../services/sendMessage');
const { processAutoReply } = require('../services/autoReply');

// ─── Webhook signature verification ──────────────────────────────────────────

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const rawBody = req.rawBody;
  if (!rawBody) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', config.appSecret)
    .update(rawBody)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── GET /webhook — Meta verification challenge ───────────────────────────────

router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.verifyToken) {
    console.log('✅ Webhook verified by Meta');
    return res.status(200).send(challenge);
  }

  console.warn('❌ Webhook verification failed — token mismatch');
  res.sendStatus(403);
});

// ─── POST /webhook — Receive messages & status updates ───────────────────────

router.post('/', async (req, res) => {
  // Always respond 200 immediately — Meta will retry if we don't
  res.sendStatus(200);

  const signatureOk = verifySignature(req);
  if (!signatureOk && !config.skipSignatureVerification) {
    console.warn(
      '❌ Invalid webhook signature — request rejected',
      {
        hasSignature: !!req.headers['x-hub-signature-256'],
        hasRawBody: !!req.rawBody,
        hint: 'Check WHATSAPP_APP_SECRET. To debug quickly, set WHATSAPP_SKIP_SIGNATURE_VERIFY=true temporarily.',
      }
    );
    return;
  }

  if (!signatureOk && config.skipSignatureVerification) {
    console.warn('⚠️ Signature verification bypassed (WHATSAPP_SKIP_SIGNATURE_VERIFY=true)');
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return;
  }

  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      const value = change.value;

      // ── Status updates (sent / delivered / read / failed) ─────────────────
      for (const status of value.statuses || []) {
        await handleStatusUpdate(status).catch((e) =>
          console.error('[Status] Error:', e.message)
        );
      }

      // ── Incoming messages ─────────────────────────────────────────────────
      for (const message of value.messages || []) {
        const contacts = value.contacts || [];
        await handleIncomingMessage(message, contacts).catch((e) =>
          console.error('[Message] Error:', e.message)
        );
      }
    }
  }
});

// ─── Handle status updates ────────────────────────────────────────────────────

async function handleStatusUpdate(status) {
  const { id: messageId, status: newStatus, errors } = status;
  const update = { status: newStatus };

  if (errors?.length) {
    update.errorCode    = String(errors[0].code);
    update.errorMessage = errors[0].message || errors[0].title;
  }

  await Message.findOneAndUpdate({ messageId }, update);
  console.log(`[Status] ${messageId} → ${newStatus}`);
}

// ─── Handle incoming messages ─────────────────────────────────────────────────

async function handleIncomingMessage(message, contacts) {
  const from        = message.from; // customer phone in E.164 without +
  const messageId   = message.id;
  const waTimestamp = parseInt(message.timestamp, 10);
  const type        = message.type;

  // Extract contact name if provided
  const contactInfo = contacts.find((c) => c.wa_id === from);
  const profileName = contactInfo?.profile?.name || null;

  // ── Upsert Customer ───────────────────────────────────────────────────────
  let customer = await Customer.findOneAndUpdate(
    { phone: from },
    {
      $setOnInsert: { phone: from, firstContactAt: new Date() },
      $set: { lastContactAt: new Date(), ...(profileName ? { profileName, name: profileName } : {}) },
      $inc: { totalMessages: 1 },
    },
    { upsert: true, new: true }
  );

  // ── Upsert Conversation ───────────────────────────────────────────────────
  let conversation = await Conversation.findOne({ customerPhone: from });
  if (!conversation) {
    conversation = await Conversation.create({
      customerId: customer._id,
      customerPhone: from,
      customerName: customer.name || from,
      channel: 'whatsapp',
    });
  }

  // ── Parse message content ─────────────────────────────────────────────────
  const { content, mediaId, mediaUrl, location, interactive } = parseMessageContent(message);

  // ── Save Message ──────────────────────────────────────────────────────────
  await Message.create({
    messageId,
    conversationId: conversation._id,
    customerId: customer._id,
    from,
    to: config.phoneNumber.replace('+', ''),
    channel: 'whatsapp',
    direction: 'inbound',
    type,
    content,
    mediaId,
    mediaUrl,
    location,
    interactive,
    status: 'received',
    waTimestamp,
  });

  // ── Update Conversation ───────────────────────────────────────────────────
  const preview = content ? content.substring(0, 80) : `[${type}]`;
  await Conversation.findByIdAndUpdate(conversation._id, {
    channel: 'whatsapp',
    lastMessage: preview,
    lastMessageAt: new Date(waTimestamp * 1000),
    lastDirection: 'inbound',
    customerName: customer.name || from,
    $inc: { unreadCount: 1, totalMessages: 1 },
  });

  // Re-fetch with up-to-date agentActive state
  conversation = await Conversation.findById(conversation._id);

  // ── Mark as read on WhatsApp ──────────────────────────────────────────────
  await markAsRead(messageId);

  // ── Auto-reply ────────────────────────────────────────────────────────────
  await processAutoReply(from, message, conversation);

  console.log(`[Message] ${type} from ${from}: "${preview}"`);
}

// ─── Parse different message types ───────────────────────────────────────────

function parseMessageContent(message) {
  const type = message.type;
  let content = '';
  let mediaId = null;
  let mediaUrl = null;
  let location = null;
  let interactive = null;

  switch (type) {
    case 'text':
      content = message.text?.body || '';
      break;

    case 'image':
    case 'video':
    case 'audio':
    case 'sticker':
      mediaId = message[type]?.id || null;
      content = message[type]?.caption || '';
      break;

    case 'document':
      mediaId = message.document?.id || null;
      content = message.document?.caption || message.document?.filename || '';
      break;

    case 'location':
      location = {
        latitude:  message.location?.latitude,
        longitude: message.location?.longitude,
        name:      message.location?.name,
        address:   message.location?.address,
      };
      content = `Location: ${location.name || ''} (${location.latitude}, ${location.longitude})`.trim();
      break;

    case 'contacts':
      content = message.contacts?.map((c) => c.name?.formatted_name || '').join(', ');
      break;

    case 'interactive':
      if (message.interactive?.type === 'button_reply') {
        interactive = {
          type:        'button_reply',
          buttonId:    message.interactive.button_reply?.id,
          buttonTitle: message.interactive.button_reply?.title,
        };
        content = message.interactive.button_reply?.title || '';
      } else if (message.interactive?.type === 'list_reply') {
        interactive = {
          type:        'list_reply',
          buttonId:    message.interactive.list_reply?.id,
          buttonTitle: message.interactive.list_reply?.title,
        };
        content = message.interactive.list_reply?.title || '';
      }
      break;

    default:
      content = `[Unsupported message type: ${type}]`;
  }

  return { content, mediaId, mediaUrl, location, interactive };
}

module.exports = router;
