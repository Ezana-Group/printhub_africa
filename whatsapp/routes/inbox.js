/**
 * inbox.js — Feature 2 API routes
 * All routes require JWT via the requireAuth middleware.
 *
 * GET  /api/inbox/conversations          — list all conversations
 * GET  /api/inbox/conversations/:phone   — single conversation + messages
 * POST /api/inbox/send                   — send reply from dashboard
 * POST /api/inbox/conversations/:phone/read — mark all messages as agent-read
 */

const express      = require('express');
const router       = express.Router();
const { requireAuth } = require('./auth');
const axios = require('axios');

const Message      = require('../models/Message');
const Conversation = require('../models/Conversation');
const Customer     = require('../models/Customer');
const { sendText } = require('../services/sendMessage');
const config = require('../config/whatsapp.config');

// All inbox routes require auth
router.use(requireAuth);

function normalizeTemplateName(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 512);
}

function mapBodyToMetaVariables(bodyText = '') {
  const namedVars = [];
  const transformed = String(bodyText).replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
    const existingIdx = namedVars.indexOf(key);
    const idx = existingIdx === -1 ? namedVars.push(key) : existingIdx + 1;
    return `{{${idx}}}`;
  });

  return {
    transformed,
    variables: namedVars.map((name, i) => ({
      name,
      index: i + 1,
      sample: `Sample ${name}`,
    })),
  };
}

// ─── GET /api/inbox/conversations ─────────────────────────────────────────────

router.get('/conversations', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, parseInt(req.query.limit || '30', 10));
    const skip  = (page - 1) * limit;

    const conversations = await Conversation.find({ status: { $ne: 'spam' } })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Conversation.countDocuments({ status: { $ne: 'spam' } });

    res.json({
      conversations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[inbox/conversations]', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ─── GET /api/inbox/conversations/:phone ─────────────────────────────────────

router.get('/conversations/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, ''); // strip non-digits

    const conversation = await Conversation.findOne({ customerPhone: phone }).lean();
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const skip  = (page - 1) * limit;

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({ conversationId: conversation._id });

    res.json({
      conversation,
      messages: messages.reverse(), // chronological order for UI
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[inbox/conversation]', err.message);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// ─── POST /api/inbox/conversations/:phone/read ───────────────────────────────

router.post('/conversations/:phone/read', async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');

    const conversation = await Conversation.findOne({ customerPhone: phone });
    if (!conversation) return res.status(404).json({ error: 'Not found' });

    await Message.updateMany(
      { conversationId: conversation._id, direction: 'inbound', agentRead: false },
      { $set: { agentRead: true } }
    );

    await Conversation.findByIdAndUpdate(conversation._id, { unreadCount: 0 });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ─── POST /api/inbox/send ─────────────────────────────────────────────────────

router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'to and message are required' });
    }

    const phone = to.replace(/\D/g, ''); // strip non-digits
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const text = String(message).trim().substring(0, 4096);
    if (!text) return res.status(400).json({ error: 'Message cannot be empty' });

    const result = await sendText(phone, text);

    if (!result.success) {
      return res.status(502).json({ error: result.error || 'WhatsApp API error' });
    }

    // Mark agent as active → suppress auto-reply for 30 min
    const conversation = await Conversation.findOne({ customerPhone: phone });
    if (conversation) {
      await conversation.setAgentActive(30);
    }

    res.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error('[inbox/send]', err.message);
    res.status(500).json({ error: 'Send failed' });
  }
});

// ─── POST /api/inbox/templates/publish ────────────────────────────────────────
// Publishes a WhatsApp template to Meta Graph API.
router.post('/templates/publish', async (req, res) => {
  try {
    const { slug, name, category, bodyText, languageCode = 'en_US' } = req.body || {};

    if (!slug || !name || !bodyText) {
      return res.status(400).json({ error: 'slug, name and bodyText are required' });
    }

    const templateName = normalizeTemplateName(slug || name);
    if (!templateName) {
      return res.status(400).json({ error: 'Template name is invalid after normalization' });
    }

    const metaCategory = String(category || 'UTILITY').toUpperCase();
    const allowedCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
    if (!allowedCategories.includes(metaCategory)) {
      return res.status(400).json({
        error: `Invalid category "${metaCategory}". Allowed: ${allowedCategories.join(', ')}`,
      });
    }

    const { transformed, variables } = mapBodyToMetaVariables(bodyText);
    const bodyComponent = {
      type: 'BODY',
      text: transformed,
      ...(variables.length
        ? { example: { body_text: [variables.map((v) => v.sample)] } }
        : {}),
    };

    const payload = {
      name: templateName,
      language: String(languageCode || 'en_US'),
      category: metaCategory,
      components: [bodyComponent],
    };

    const { data } = await axios.post(
      `${config.baseUrl}/${config.businessAccountId}/message_templates`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return res.json({
      success: true,
      status: data?.status || 'PENDING',
      metaTemplateId: data?.id || null,
      metaName: data?.name || templateName,
      variableMap: variables,
      transformedBodyText: transformed,
      raw: data,
    });
  } catch (err) {
    const apiError = err?.response?.data?.error;
    const message = apiError?.message || err.message || 'Meta publish failed';
    const code = apiError?.code || null;
    return res.status(502).json({
      error: message,
      code,
      details: apiError || null,
    });
  }
});

// ─── GET /api/inbox/conversations/:phone/poll ─────────────────────────────────
// Lightweight endpoint for polling new messages (called every 3s by dashboard)

router.get('/conversations/:phone/poll', async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 60000);

    const conversation = await Conversation.findOne({ customerPhone: phone }).lean();
    if (!conversation) return res.json({ messages: [], unreadCount: 0 });

    const messages = await Message.find({
      conversationId: conversation._id,
      createdAt: { $gt: since },
    })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    res.json({
      messages,
      unreadCount: conversation.unreadCount,
      lastMessageAt: conversation.lastMessageAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Poll failed' });
  }
});

// ─── GET /api/inbox/stats ─────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [totalConversations, totalMessages, unreadTotal, openConversations] = await Promise.all([
      Conversation.countDocuments(),
      Message.countDocuments(),
      Conversation.aggregate([{ $group: { _id: null, total: { $sum: '$unreadCount' } } }]),
      Conversation.countDocuments({ status: 'open' }),
    ]);

    res.json({
      totalConversations,
      totalMessages,
      totalUnread: unreadTotal[0]?.total || 0,
      openConversations,
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

module.exports = router;
