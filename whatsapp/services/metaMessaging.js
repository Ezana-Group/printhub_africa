const axios = require('axios');
const config = require('../config/whatsapp.config');

function normalizeRecipient(recipientId = '') {
  return String(recipientId).trim();
}

async function sendMessengerText(recipientId, text) {
  const to = normalizeRecipient(recipientId);
  const { data } = await axios.post(
    `${config.baseGraphUrl}/me/messages`,
    {
      recipient: { id: to },
      message: { text: String(text) },
      messaging_type: 'RESPONSE',
    },
    {
      params: { access_token: config.metaPageAccessToken },
      timeout: 15000,
    }
  );
  return { success: true, messageId: data?.message_id || null, recipientId: to };
}

async function sendInstagramText(recipientId, text) {
  const to = normalizeRecipient(recipientId);
  const { data } = await axios.post(
    `${config.baseGraphUrl}/${config.instagramBusinessAccountId}/messages`,
    {
      recipient: { id: to },
      message: { text: String(text) },
    },
    {
      params: { access_token: config.metaPageAccessToken },
      timeout: 15000,
    }
  );
  return { success: true, messageId: data?.message_id || null, recipientId: to };
}

module.exports = {
  sendMessengerText,
  sendInstagramText,
};
