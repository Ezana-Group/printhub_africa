# AI-2 WhatsApp Voice Note Patch

This document describes the nodes to add to the existing **AI-2 (WhatsApp Auto-Reply)** workflow
to enable Whisper voice note transcription before Claude replies.

Since AI-2 lives in the running n8n instance (not in this repo), copy-paste the node JSONs below
into the AI-2 workflow canvas, then rewire the connections.

---

## When to Apply

Apply this patch when:
- A customer sends a voice note (audio) to your WhatsApp Business number
- The existing AI-2 flow only handles text messages

---

## Nodes to Add

### 1. Check if Voice Note

Insert **after** the existing "Message Received" trigger, **before** the "Claude: Reply" node.

```json
{
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.messages?.[0]?.type }}",
          "operation": "equals",
          "value2": "audio"
        }
      ]
    }
  },
  "name": "Is Voice Note?",
  "type": "n8n-nodes-base.if",
  "typeVersion": 1
}
```

### 2. Download Audio File

Connect from **"Is Voice Note? → YES"** output.

```json
{
  "parameters": {
    "url": "=https://graph.facebook.com/v19.0/{{ $json.messages[0].audio.id }}",
    "method": "GET",
    "authentication": "headerAuth",
    "headerParameters": {
      "parameters": [{ "name": "Authorization", "value": "=Bearer {{$env.WHATSAPP_TOKEN}}" }]
    }
  },
  "name": "Get Audio Metadata",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1
}
```

```json
{
  "parameters": {
    "url": "={{ $json.url }}",
    "method": "GET",
    "authentication": "headerAuth",
    "headerParameters": {
      "parameters": [{ "name": "Authorization", "value": "=Bearer {{$env.WHATSAPP_TOKEN}}" }]
    },
    "options": {
      "response": {
        "response": { "responseFormat": "file" }
      }
    }
  },
  "name": "Download Audio File",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1
}
```

### 3. Whisper Transcription

```json
{
  "parameters": {
    "url": "https://api.openai.com/v1/audio/transcriptions",
    "method": "POST",
    "authentication": "headerAuth",
    "headerParameters": {
      "parameters": [{ "name": "Authorization", "value": "=Bearer {{$env.OPENAI_API_KEY}}" }]
    },
    "bodyParametersJson": "{ \"model\": \"whisper-1\", \"language\": \"en\", \"prompt\": \"PrintHub Africa customer service. Kenyan English. Printing, 3D printing, banners, flyers, merchandise.\" }",
    "sendBinaryData": true,
    "binaryPropertyName": "data"
  },
  "name": "Whisper: Transcribe Voice Note",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1
}
```

### 4. Normalise to Text

```json
{
  "parameters": {
    "jsCode": "const isVoice = true;\nconst transcribedText = $node['Whisper: Transcribe Voice Note'].json.text;\nconst from = $node['AI-2 Trigger'].json.messages?.[0]?.from;\nreturn [{ messageText: transcribedText, from, wasVoiceNote: true }];"
  },
  "name": "Set Message Text (Voice)",
  "type": "n8n-nodes-base.code",
  "typeVersion": 1
}
```

---

## Rewiring Instructions

1. **Original connection**: `Trigger → Claude: Reply`

2. **After patch**:
   ```
   Trigger
    └→ Is Voice Note?
         ├─ YES → Get Audio Metadata → Download Audio File → Whisper: Transcribe → Set Message Text (Voice) → Claude: Reply
         └─ NO  → [existing text path] → Claude: Reply
   ```

3. In the **Claude: Reply** node, update the message body to use `{{ $json.messageText }}` instead of the raw trigger text field, so both paths feed into the same Claude node.

4. In the Claude system prompt, add:
   ```
   {{ $json.wasVoiceNote ? 'Note: this customer sent a voice note that was transcribed. Acknowledge if relevant.' : '' }}
   ```

---

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (same key as used for GPT-4o) |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API access token |

---

## Testing

1. Send a WhatsApp voice note to the PrintHub business number.
2. Check n8n execution logs — you should see `Whisper: Transcribe Voice Note` return a `text` field.
3. Claude's reply should reference the content of the voice note naturally.
4. Text messages should bypass Whisper entirely via the `NO` branch.
