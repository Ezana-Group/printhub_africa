const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name:        { type: String, default: 'Unknown', trim: true },
    profileName: { type: String, default: null, trim: true }, // WhatsApp display name
    // Link back to their Printhub ecommerce account (optional)
    ecommerceId: { type: String, default: null },
    email:       { type: String, default: null, trim: true, lowercase: true },
    firstContactAt: { type: Date, default: Date.now },
    lastContactAt:  { type: Date, default: Date.now },
    totalMessages:  { type: Number, default: 0 },
    totalOrders:    { type: Number, default: 0 },
    tags:  { type: [String], default: [] },
    notes: { type: String, default: '' },
    optedOut: { type: Boolean, default: false }, // STOP / unsubscribe
    optedOutAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

module.exports = mongoose.model('Customer', customerSchema);
