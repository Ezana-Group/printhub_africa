const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      sparse: true, // outbound messages get an ID only after API confirms
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    from: { type: String, required: true, trim: true },
    to:   { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['whatsapp', 'messenger', 'instagram'],
      default: 'whatsapp',
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'text', 'image', 'document', 'audio', 'video',
        'location', 'contacts', 'interactive', 'template',
        'sticker', 'reaction', 'unknown',
      ],
      default: 'text',
    },
    // Plain text content or caption
    content: { type: String, default: '' },
    // For media messages
    mediaId:  { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mimeType: { type: String, default: null },
    filename: { type: String, default: null },
    // For location messages
    location: {
      latitude:  Number,
      longitude: Number,
      name:      String,
      address:   String,
    },
    // For interactive replies
    interactive: {
      type:        String, // button_reply | list_reply
      buttonId:    String,
      buttonTitle: String,
    },
    // Delivery status
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'received'],
      default: 'pending',
    },
    errorCode:    { type: String, default: null },
    errorMessage: { type: String, default: null },
    // Original WhatsApp timestamp (Unix seconds)
    waTimestamp: { type: Number },
    // Whether the agent has read this in the dashboard
    agentRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ from: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
