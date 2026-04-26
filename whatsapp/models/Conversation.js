const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerPhone: { type: String, required: true, unique: true, trim: true },
    customerName:  { type: String, default: 'Unknown', trim: true },
    channel: {
      type: String,
      enum: ['whatsapp', 'messenger', 'instagram'],
      default: 'whatsapp',
      index: true,
    },
    // Last message preview for the conversation list
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastDirection: { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
    // Unread count (messages not yet read by agent in dashboard)
    unreadCount:   { type: Number, default: 0, min: 0 },
    // When a human agent replies, suppress auto-reply for 30 min
    agentActive:      { type: Boolean, default: false },
    agentActiveUntil: { type: Date, default: null },
    // Overall conversation status
    status: {
      type: String,
      enum: ['open', 'resolved', 'spam'],
      default: 'open',
    },
    totalMessages: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Keep conversations sorted by most recent message
conversationSchema.index({ lastMessageAt: -1 });

/**
 * Mark a human agent as active for this conversation (suppresses auto-reply).
 * @param {number} minutes - how many minutes to suppress auto-reply (default 30)
 */
conversationSchema.methods.setAgentActive = function (minutes = 30) {
  this.agentActive = true;
  this.agentActiveUntil = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

/**
 * Check if a human agent is currently active (auto-reply should be suppressed).
 */
conversationSchema.methods.isAgentActive = function () {
  if (!this.agentActive) return false;
  if (this.agentActiveUntil && this.agentActiveUntil < new Date()) {
    // Window expired — reset (non-blocking)
    this.agentActive = false;
    this.agentActiveUntil = null;
    this.save().catch(() => {});
    return false;
  }
  return true;
};

module.exports = mongoose.model('Conversation', conversationSchema);
