# WhatsApp Customer Flows — PrintHub Africa
## Option B: Conversational Chatbot via WhatsApp Business API

> **Architecture:** You already have a working Express.js WhatsApp service in `whatsapp/`.
> This guide completes it end-to-end: Meta setup → customer flows → transactional sends → deployment.

---

## Table of Contents
1. [What You Already Have](#1-what-you-already-have)
2. [Meta Business Setup (One-time)](#2-meta-business-setup-one-time)
3. [Environment Variables](#3-environment-variables)
4. [The Four Customer Flows](#4-the-four-customer-flows)
5. [Flow Code Implementation](#5-flow-code-implementation)
6. [Connecting WA Service to PrintHub (Transactional Sends)](#6-connecting-wa-service-to-printhub-transactional-sends)
7. [WhatsApp Message Templates (for proactive sends)](#7-whatsapp-message-templates-for-proactive-sends)
8. [Deploying the WhatsApp Service](#8-deploying-the-whatsapp-service)
9. [Testing Checklist](#9-testing-checklist)
10. [What NOT to Do (Common Mistakes)](#10-what-not-to-do-common-mistakes)

---

## 1. What You Already Have

The `whatsapp/` folder is a fully working Express.js service:

```
whatsapp/
├── index.js                    ← Express server (port 3001)
├── routes/
│   ├── metaWebhook.js          ← Receives all incoming WA messages from Meta
│   ├── webhook.js              ← Internal PrintHub → WA webhook
│   ├── inbox.js                ← Admin inbox API
│   └── auth.js                 ← Dashboard login
├── services/
│   ├── autoReply.js            ← Keyword bot + interactive menu handlers ✅
│   ├── sendMessage.js          ← All outbound send functions (text, list, buttons, template)
│   ├── ecommerceNotifications.js ← Order confirmation, status, delivery, quote WA messages
│   └── metaMessaging.js        ← Messenger/Instagram sends (separate)
├── models/
│   ├── Conversation.js         ← MongoDB conversation tracking
│   ├── Customer.js             ← Customer phone/name store
│   └── Message.js              ← Message log
├── dashboard/                  ← Static admin inbox dashboard (served at /whatsapp-inbox)
└── config/
    └── whatsapp.config.js      ← Reads env vars
```

**The service is live when you deploy it separately from the main Next.js app.**

---

## 2. Meta Business Setup (One-time)

### Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App**
3. Choose **Business** → fill in app name (e.g. "PrintHub Africa WA")
4. Add your **Meta Business Account** (create one at [business.facebook.com](https://business.facebook.com) if needed)

### Step 2: Add WhatsApp to Your App
1. In your app dashboard, click **Add Product**
2. Find **WhatsApp** → click **Set up**
3. You will land on the WhatsApp **Getting Started** page

### Step 3: Link Your Phone Number
1. In WhatsApp → **API Setup**, scroll to **Step 5: Add a phone number**
2. Add your business number: `+254792732929`
3. Verify it via SMS or call — Meta will send a code
4. Once verified, copy your **Phone Number ID** (looks like `1066194946578452`)
5. Copy your **WhatsApp Business Account ID** (looks like `964627949394217`)

### Step 4: Generate a Permanent Access Token
> The temporary token expires — you need a permanent System User token.

1. Go to [business.facebook.com/settings](https://business.facebook.com/settings)
2. Left menu → **System Users** → **Add**
3. Name it "PrintHub WA Bot", role: **Admin**
4. Click **Generate New Token** → select your app → check permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the token — this goes into `WHATSAPP_ACCESS_TOKEN`

### Step 5: Configure the Webhook
1. In your app → WhatsApp → **Configuration**
2. **Callback URL:** `https://whatsapp.printhub.africa/webhook/meta`
3. **Verify token:** `printhub_verify_2024` (matches your `.env`)
4. Click **Verify and Save**
5. Under **Webhook fields**, subscribe to:
   - `messages` ✅
   - `message_status` ✅ (delivery receipts)

### Step 6: Accept Meta's Commerce Policy
> Required before you can message customers about orders/payments.

1. In Meta Business Manager → **WhatsApp Accounts → [your account] → Settings**
2. Accept the **WhatsApp Commerce Policy**
3. Set your business display name, website, and profile picture

---

## 3. Environment Variables

Copy `whatsapp/.env.example` to `whatsapp/.env` and fill in:

```env
# ── WhatsApp API ──────────────────────────────────────────────────────────────
WHATSAPP_PHONE_NUMBER_ID=1066194946578452        # From Meta App → API Setup
WHATSAPP_BUSINESS_ACCOUNT_ID=964627949394217     # From Meta App → API Setup
WHATSAPP_ACCESS_TOKEN=EAAXw...                   # System User permanent token (Step 4)
WHATSAPP_APP_SECRET=a47a4a955bb088564c...        # App → Settings → Basic → App Secret
WHATSAPP_PHONE_NUMBER=+254792732929              # Your registered business number
WHATSAPP_VERIFY_TOKEN=printhub_verify_2024       # Must match what you enter in Meta webhook

# ── Database (MongoDB) ────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/printhub_whatsapp

# ── App ───────────────────────────────────────────────────────────────────────
PORT=3001
BASE_URL=https://whatsapp.printhub.africa
ALLOWED_ORIGINS=https://printhub.africa,https://admin.printhub.africa

# ── Auth (change these!) ─────────────────────────────────────────────────────
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=YourSecurePassword
JWT_SECRET=your-long-random-secret-min-64-chars
INTERNAL_SECRET=another-long-random-secret-for-internal-calls

# ── Business ──────────────────────────────────────────────────────────────────
BUSINESS_NAME=PrintHub Africa
BUSINESS_HOURS_START=8
BUSINESS_HOURS_END=18
BUSINESS_TIMEZONE=Africa/Nairobi
```

**In your main PrintHub `.env.local`, add:**
```env
WHATSAPP_SERVICE_URL=https://whatsapp.printhub.africa
WHATSAPP_INTERNAL_SECRET=same-value-as-INTERNAL_SECRET-above
```

---

## 4. The Four Customer Flows

### Flow 1: Welcome & Main Menu
**Trigger:** Customer texts anything (hi, hello, any greeting)
```
Customer: "Hi"

Bot: Hi there! 👋 Welcome to PrintHub Africa.
     How can we help you today?

     [List Menu]
     📦 Track My Order
     🖨️ Place New Order
     💬 Get a 3D Print Quote
     🙋 Contact Support
     🕗 Opening Hours
```

### Flow 2: 3D Print Quote (Most Important Flow)
**Trigger:** Customer selects "Get a 3D Print Quote" or texts "quote/price/cost"
```
Customer selects: "💬 Get a 3D Print Quote"

Bot: Great! To give you an accurate quote we need a few details.

     What material would you like?
     [Buttons]
     🟢 PLA (Standard)
     🔵 PETG (Strong)
     ⚪ Other / Not sure

Customer: "PLA"

Bot: Perfect! How many pieces do you need printed?
     (Reply with a number, e.g. 1, 5, 10)

Customer: "3"

Bot: Do you need post-processing (sanding, painting, support removal)?
     [Buttons]
     ✅ Yes please
     ❌ No, raw print only

Customer: "No"

Bot: Last step — please send us your STL/OBJ file, or describe your item.
     You can also visit our quote form for an instant estimate:
     👉 https://printhub.africa/get-a-quote

     Once you upload a file, our team responds within 2 business hours.
     Minimum order: KES 800.
```

### Flow 3: Order Tracking
**Trigger:** Customer selects "Track My Order" or texts "track/order/status"
```
Customer selects: "📦 Track My Order"

Bot: To track your order, please reply with your order number.
     (e.g. PH1234 or just the numbers 1234)

Customer: "PH2047"

Bot: [Bot calls PrintHub API to fetch order status]

     📦 Order #PH2047 Status:

     Status: ✅ SHIPPED
     Items: PLA Bracket × 2
     Dispatched: Mon 28 Apr 2026
     Est. Delivery: Wed 30 Apr 2026

     Track online: https://printhub.africa/track?ref=PH2047

     Need help? Reply SUPPORT and we'll connect you to the team.
```

### Flow 4: Support Handoff
**Trigger:** Customer selects "Contact Support" or types "help/problem/issue"
```
Customer selects: "🙋 Contact Support"

Bot: You're now connected to our support team. 🙋

     Please describe your issue and a team member will reply shortly.
     ⏱ Response: within 30 minutes during business hours (Mon–Sat, 8am–6pm EAT)

     [Conversation marked agent-needed in dashboard — staff get a browser notification]
```

---

## 5. Flow Code Implementation

### 5a. Add the 3D Quote Flow to `autoReply.js`

Add this to the `KEYWORD_RULES` array in `whatsapp/services/autoReply.js`:

```javascript
{
  keywords: ['quote', 'price', 'cost', 'how much', 'bei', 'pesa', 'printing'],
  type: 'buttons',
  handler: send3DQuoteStart,
},
```

Add the handler function:

```javascript
// ─── State store for multi-step quote flow ────────────────────────────────────
// Simple in-memory store — for production, persist in MongoDB
const quoteSessionStore = new Map(); // phone → { step, material, quantity }

async function send3DQuoteStart(to) {
  quoteSessionStore.set(to, { step: 'material' });
  return sendButtons(
    to,
    `💬 *Get a 3D Printing Quote*\n\nLet's get you a price! First — what material do you need?`,
    [
      { id: 'mat_pla',   title: '🟢 PLA (Standard)' },
      { id: 'mat_petg',  title: '🔵 PETG (Strong)' },
      { id: 'mat_other', title: '⚪ Other / Not sure' },
    ],
    '3D Print Quote',
    'Step 1 of 3'
  );
}
```

Add to `LIST_REPLY_HANDLERS` and `BUTTON_REPLY_HANDLERS`:

```javascript
// Add button reply handling in processAutoReply:
const BUTTON_REPLY_HANDLERS = {
  mat_pla:         (to) => handleMaterialSelected(to, 'PLA'),
  mat_petg:        (to) => handleMaterialSelected(to, 'PETG'),
  mat_other:       (to) => handleMaterialSelected(to, 'Other/TBD'),
  post_yes:        (to) => handlePostProcessing(to, true),
  post_no:         (to) => handlePostProcessing(to, false),
  visit_shop:      (to) => sendText(to, '🛍️ Browse our shop:\nhttps://printhub.africa/shop'),
  human_help:      markNeedsAgent,
};

async function handleMaterialSelected(to, material) {
  const session = quoteSessionStore.get(to) || {};
  quoteSessionStore.set(to, { ...session, step: 'quantity', material });
  return sendText(
    to,
    `✅ *Material: ${material}*\n\nHow many pieces do you need?\n_(Reply with a number, e.g. 1, 5, 10)_`
  );
}

async function handlePostProcessing(to, wantsPostProcessing) {
  const session = quoteSessionStore.get(to) || {};
  quoteSessionStore.set(to, { ...session, step: 'file', postProcessing: wantsPostProcessing });
  return sendText(
    to,
    `${wantsPostProcessing ? '✅ Post-processing noted.' : '✅ Raw print — understood.'}\n\n` +
    `*Final step:* Please send your STL/OBJ/3MF file, or describe the item you want printed.\n\n` +
    `Or use our online quote form for an instant estimate:\n` +
    `👉 https://printhub.africa/get-a-quote\n\n` +
    `We respond within *2 business hours* · Minimum order: *KES 800*`
  );
}

async function markNeedsAgent(to) {
  // Mark conversation as needing agent in DB
  const conv = await Conversation.findOne({ customerPhone: to });
  if (conv) {
    conv.agentNeeded = true;
    await conv.save();
  }
  return sendText(
    to,
    `🙋 *Connecting you to our team...*\n\n` +
    `A team member will reply to this chat shortly.\n` +
    `⏱ Mon–Sat · 8am–6pm EAT · response within 30 minutes`
  );
}
```

### 5b. Add Order Tracking with Live Data

In `processAutoReply`, handle number replies for order tracking:

```javascript
// In processAutoReply, after keyword matching:
// Check if this is a reply to a "track order" prompt
const session = quoteSessionStore.get(from) || {};

if (session.step === 'quantity' && /^\d+$/.test(body)) {
  const qty = parseInt(body, 10);
  quoteSessionStore.set(from, { ...session, step: 'postprocessing', quantity: qty });
  return sendButtons(
    from,
    `✅ *Quantity: ${qty} piece${qty > 1 ? 's' : ''}*\n\nDo you need post-processing?\n_(Sanding, painting, support removal)_`,
    [
      { id: 'post_yes', title: '✅ Yes please' },
      { id: 'post_no',  title: '❌ No, raw print' },
    ],
    'Post-processing?',
    'Step 3 of 3'
  );
}

// Order number pattern: PH1234 or just 1234
const orderMatch = body.match(/(?:ph)?(\d{3,6})/i);
if (session.step === 'awaiting_order' && orderMatch) {
  return fetchAndSendOrderStatus(from, orderMatch[1]);
}
```

Add the order lookup function that calls PrintHub's API:

```javascript
async function fetchAndSendOrderStatus(to, orderRef) {
  try {
    const resp = await axios.get(
      `${process.env.PRINTHUB_API_URL}/api/wa/order-status`,
      {
        params: { ref: orderRef },
        headers: { 'x-internal-secret': process.env.INTERNAL_SECRET },
        timeout: 8000,
      }
    );
    const order = resp.data;
    if (!order || order.error) {
      return sendText(to, `❌ We couldn't find order #${orderRef}.\n\nPlease check the number and try again, or reply *SUPPORT* to speak to our team.`);
    }
    const statusEmoji = {
      PENDING: '⏳', CONFIRMED: '✅', PROCESSING: '🔧',
      SHIPPED: '🚚', DELIVERED: '✅', CANCELLED: '❌',
    }[order.status] || '📦';

    return sendText(
      to,
      `${statusEmoji} *Order #${order.orderNumber}*\n\n` +
      `Status: *${order.statusLabel}*\n` +
      (order.estimatedDelivery ? `Est. Delivery: ${order.estimatedDelivery}\n` : '') +
      `\nTrack online: https://printhub.africa/track?ref=${order.orderNumber}\n\n` +
      `Need help? Reply *SUPPORT*`
    );
  } catch (err) {
    console.error('[OrderTrack] Error fetching order:', err.message);
    return sendText(to, `⚠️ We had trouble fetching your order. Please try again or reply *SUPPORT*.`);
  }
}
```

---

## 6. Connecting WA Service to PrintHub (Transactional Sends)

The WA service exposes an **internal webhook** that PrintHub calls when events happen (order confirmed, shipped, etc.). This replaces what n8n was doing.

### 6a. Add the internal endpoint in `whatsapp/routes/webhook.js`

The existing `webhook.js` likely already handles this. Confirm it has a `POST /webhook/notify` route:

```javascript
// In whatsapp/routes/webhook.js — add if not present:
router.post('/notify', verifyInternalSecret, async (req, res) => {
  const { event, phone, data } = req.body;
  const { sendOrderConfirmation, sendOrderStatusUpdate, sendDeliveryUpdate, sendQuoteReady } =
    require('../services/ecommerceNotifications');

  try {
    switch (event) {
      case 'order_confirmed':
        await sendOrderConfirmation(phone, data);
        break;
      case 'order_status':
        await sendOrderStatusUpdate(phone, data);
        break;
      case 'delivery_update':
        await sendDeliveryUpdate(phone, data);
        break;
      case 'quote_ready':
        await sendQuoteReady(phone, data);
        break;
      default:
        return res.status(400).json({ error: `Unknown event: ${event}` });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[Notify] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
```

### 6b. Add a helper in PrintHub (`lib/whatsapp-notify.ts`)

Create this file in the main Next.js app — this replaces n8n for all WA notifications:

```typescript
// lib/whatsapp-notify.ts
const WA_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL;
const WA_SECRET = process.env.WHATSAPP_INTERNAL_SECRET;

async function notify(event: string, phone: string, data: Record<string, unknown>) {
  if (!WA_SERVICE_URL || !WA_SECRET || !phone) return;
  try {
    await fetch(`${WA_SERVICE_URL}/webhook/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': WA_SECRET },
      body: JSON.stringify({ event, phone, data }),
    });
  } catch (err) {
    console.error(`[WA Notify] ${event} failed:`, err);
  }
}

export const wa = {
  orderConfirmed: (phone: string, data: { customerName: string; orderId: string; orderTotal: number; items: any[]; estimatedDelivery?: string }) =>
    notify('order_confirmed', phone, data),

  orderStatus: (phone: string, data: { customerName: string; orderNumber: string; status: string; statusLabel: string; estimatedDelivery?: string }) =>
    notify('order_status', phone, data),

  deliveryUpdate: (phone: string, data: { customerName: string; orderNumber: string; trackingNumber?: string; failureReason?: string }) =>
    notify('delivery_update', phone, data),

  quoteReady: (phone: string, data: { customerName: string; quoteId: string; quotedAmount: number; pdfUrl: string; validUntil: string }) =>
    notify('quote_ready', phone, data),
};
```

### 6c. Add the order status API route in PrintHub

The WA service needs to look up orders — add this protected endpoint:

```typescript
// app/api/wa/order-status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.WHATSAPP_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ref = new URL(req.url).searchParams.get('ref');
  if (!ref) return NextResponse.json({ error: 'No ref' }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: { endsWith: ref } },
        { orderNumber: ref.startsWith('PH') ? ref : `PH${ref}` },
      ],
    },
    select: {
      orderNumber: true, status: true, estimatedDelivery: true,
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Payment Pending', CONFIRMED: 'Confirmed — preparing',
    PROCESSING: 'In Production', SHIPPED: 'Shipped',
    DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  };

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] ?? order.status,
    estimatedDelivery: order.estimatedDelivery
      ? order.estimatedDelivery.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : null,
  });
}
```

---

## 7. WhatsApp Message Templates (for proactive sends)

Templates are required when messaging customers **outside the 24-hour window** (e.g. when they haven't messaged you recently). They must be approved by Meta.

### Templates to submit (via Meta Business Manager → Message Templates):

| Template name | Category | When used |
|---|---|---|
| `order_confirmation` | TRANSACTIONAL | Order placed |
| `order_shipped` | TRANSACTIONAL | Order dispatched |
| `order_delivered` | TRANSACTIONAL | Delivered |
| `quote_ready` | TRANSACTIONAL | Quote approved and priced |
| `payment_reminder` | TRANSACTIONAL | Unpaid order after 2h |

### Example: `order_confirmation` template body
```
Hello {{1}},

Your order #{{2}} has been confirmed! 🎉

Total: KES {{3}}
Est. delivery: {{4}}

Track your order at printhub.africa/track or reply TRACK {{2}} here.

Thank you for choosing PrintHub Africa! 🖨️
```
Parameters: `[customerName, orderNumber, orderTotal, estimatedDelivery]`

### How to submit a template
1. Meta Business Manager → **WhatsApp Accounts → [account] → Message Templates**
2. Click **Create Template**
3. Choose category → type the body → submit
4. Approval usually takes **24–48 hours**
5. Once approved, use `sendTemplate()` in `ecommerceNotifications.js`

---

## 8. Deploying the WhatsApp Service

The WA service is a **separate Node.js app** — it runs alongside your Next.js app on Railway.

### On Railway:

You already have `whatsapp/railway.toml`. The service is deployed from the `whatsapp/` subdirectory.

1. In Railway, create a new service in your project
2. Point it to the `whatsapp/` folder (or use a separate repo)
3. Add all env vars from section 3
4. Set the public domain: `whatsapp.printhub.africa`
5. Make sure port `3001` is exposed

### MongoDB:

The WA service uses MongoDB (separate from PostgreSQL used by Next.js).
- Use [MongoDB Atlas free tier](https://www.mongodb.com/atlas) for this
- The connection string goes in `MONGODB_URI`

### Test the deployment:
```bash
curl https://whatsapp.printhub.africa/health
# Expected: {"status":"ok","service":"printhub-whatsapp","db":"connected"}
```

---

## 9. Testing Checklist

Before going live, test each scenario:

- [ ] Send "Hi" to your WhatsApp number → welcome menu appears
- [ ] Select "Get a Quote" → material buttons appear → flow completes
- [ ] Select "Track My Order" → ask for order number → send `PH0001` → status returned
- [ ] Select "Contact Support" → agent-needed flag set in inbox
- [ ] Send "hours" → opening hours reply
- [ ] Send "pay" / "mpesa" → payment options reply
- [ ] Place a test order in PrintHub → order confirmation WA message arrives
- [ ] Mark an order as Shipped → shipping update WA message arrives
- [ ] Test outside business hours → bot still replies (no human suppression)
- [ ] Human replies from inbox → bot suppresses for 30 minutes → resumes after

---

## 10. What NOT to Do (Common Mistakes)

| Mistake | Why it fails |
|---|---|
| Using personal WhatsApp number | Must be a dedicated business number — no WhatsApp Personal app on that SIM |
| Using a temporary access token | Expires in 24h. Always use a System User permanent token |
| Sending promotional messages outside 24h window without a template | Meta blocks it and can suspend your number |
| Hardcoding `{{1}}, {{2}}` in free-form messages | Only valid in approved templates |
| Starting the conversation (not the customer) without a template | Meta only allows this via approved templates |
| Not verifying the webhook App Secret | Leaves your webhook open to spoofing |
| Replying to every message during agent-active window | `autoReply.js` already suppresses this — don't bypass it |

---

## Summary: The Minimal Path to a Live Bot

1. ✅ Complete Meta setup (Steps 1–6 above) — ~2 hours
2. ✅ Fill in `whatsapp/.env` — 15 minutes
3. ✅ Deploy WA service on Railway — 30 minutes
4. ✅ Verify webhook in Meta dashboard — 5 minutes
5. ✅ Test with your own phone — 30 minutes
6. ✅ Submit 2–3 message templates — 5 minutes (wait 24–48h for approval)
7. ✅ Wire `lib/whatsapp-notify.ts` into order confirmation and status flows — 1 hour

**Total: ~5 hours of setup for a fully working customer bot.**
