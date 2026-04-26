/**
 * metaWebhook.js
 * GET  /webhook/meta  — Meta (Messenger/Instagram) verification
 * POST /webhook/meta  — Receive Messenger + Instagram events
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const config = require('../config/whatsapp.config');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;
  if (!req.rawBody) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', config.appSecret)
    .update(req.rawBody)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.metaVerifyToken) {
    console.log('✅ Meta webhook verified');
    return res.status(200).send(challenge);
  }

  console.warn('❌ Meta webhook verification failed — token mismatch');
  return res.sendStatus(403);
});

async function upsertInboundMessage({
  channel,
  senderId,
  recipientId,
  messageId,
  text,
  timestamp,
}) {
  let customer = await Customer.findOneAndUpdate(
    { phone: senderId },
    {
      $setOnInsert: { phone: senderId, firstContactAt: new Date() },
      $set: { lastContactAt: new Date() },
      $inc: { totalMessages: 1 },
    },
    { upsert: true, new: true }
  );

  let conversation = await Conversation.findOne({ customerPhone: senderId });
  if (!conversation) {
    conversation = await Conversation.create({
      customerId: customer._id,
      customerPhone: senderId,
      customerName: customer.name || senderId,
      channel,
    });
  } else if (!conversation.channel || conversation.channel === 'whatsapp') {
    conversation.channel = channel;
    await conversation.save();
  }

  await Message.create({
    messageId,
    conversationId: conversation._id,
    customerId: customer._id,
    from: senderId,
    to: recipientId,
    channel,
    direction: 'inbound',
    type: 'text',
    content: text || '',
    status: 'received',
    waTimestamp: Math.floor((timestamp || Date.now()) / 1000),
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: (text || '').substring(0, 80),
    lastMessageAt: new Date(timestamp || Date.now()),
    lastDirection: 'inbound',
    $inc: { unreadCount: 1, totalMessages: 1 },
  });
}

router.post('/', async (req, res) => {
  res.sendStatus(200);

  if (!verifySignature(req)) {
    console.warn('❌ Invalid Meta webhook signature');
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (body.object !== 'page' && body.object !== 'instagram') return;

  for (const entry of body.entry || []) {
    // Messenger-style events
    for (const event of entry.messaging || []) {
      const senderId = event?.sender?.id;
      const recipientId = event?.recipient?.id;
      const text = event?.message?.text || '';
      const messageId = event?.message?.mid || null;
      const timestamp = event?.timestamp || Date.now();
      if (!senderId || !recipientId || !messageId) continue;
      await upsertInboundMessage({
        channel: 'messenger',
        senderId,
        recipientId,
        messageId,
        text,
        timestamp,
      }).catch((e) => console.error('[meta/messenger]', e.message));
    }

    // Instagram messaging webhook style (changes array)
    for (const change of entry.changes || []) {
      const isInstagramField = change.field === 'instagram' || change.field === 'messages';
      if (!isInstagramField) continue;
      const value = change.value || {};
      for (const msg of value.messages || []) {
        const senderId = msg?.from?.id;
        const recipientId = value?.id || value?.metadata?.phone_number_id || '';
        const text = msg?.text || '';
        const messageId = msg?.id || null;
        const timestamp = msg?.timestamp ? Number(msg.timestamp) * 1000 : Date.now();
        if (!senderId || !messageId) continue;
        await upsertInboundMessage({
          channel: 'instagram',
          senderId,
          recipientId: String(recipientId),
          messageId,
          text,
          timestamp,
        }).catch((e) => console.error('[meta/instagram]', e.message));
      }
    }
  }
});

module.exports = router;
