import crypto from 'crypto'

/**
 * Verifies that a request coming FROM n8n to Next.js is authentic.
 * n8n is expected to send 'x-printhub-signature' which is HMAC-SHA256 of the body.
 */
export async function verifyN8nWebhook(req: Request): Promise<boolean> {
  const signature = req.headers.get('x-printhub-signature')
  const timestamp = req.headers.get('x-printhub-timestamp')
  
  if (!signature || !timestamp) {
    console.error('[n8n-verify] Missing signature or timestamp')
    return false
  }
  
  // Reject if timestamp is older than 5 minutes (replay protection)
  const now = Date.now()
  const ts = parseInt(timestamp)
  if (isNaN(ts) || Math.abs(now - ts) > 300000) {
    console.error('[n8n-verify] Timestamp expired or invalid:', timestamp)
    return false
  }
  
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) {
    console.error('[n8n-verify] N8N_WEBHOOK_SECRET not set')
    return false
  }

  // Clone the request to read body without consuming it for the actual handler
  const clonedReq = req.clone()
  const body = await clonedReq.text()
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
    
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )

  if (!isValid) {
    console.error('[n8n-verify] Signature mismatch')
  }

  return isValid
}

/**
 * Middleware-style check for API routes.
 */
export async function n8nGuard(req: Request) {
  const isAuthorized = await verifyN8nWebhook(req)
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}
