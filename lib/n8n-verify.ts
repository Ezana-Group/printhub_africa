import crypto from 'crypto'

/**
 * Verifies that a request coming FROM n8n to Next.js is authentic.
 * n8n is expected to send 'x-printhub-signature' which is HMAC-SHA256 of the body.
 */
export async function verifyN8nWebhook(req: Request): Promise<boolean> {
  const signature = req.headers.get('x-printhub-signature')
  const timestamp = req.headers.get('x-printhub-timestamp')
  
  if (!signature) {
    console.error('[n8n-verify] Missing x-printhub-signature header')
    return false
  }

  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) {
    console.error('[n8n-verify] N8N_WEBHOOK_SECRET not set')
    return false
  }

  // Fallback: Simple secret comparison if timestamp is missing or for basic nodes
  if (!timestamp && signature === secret) {
    console.warn('[n8n-verify] Using simple secret fallback (no timestamp)')
    return true
  }

  if (!timestamp) {
    console.error('[n8n-verify] Missing timestamp for HMAC verification')
    return false
  }
  
  // Reject if timestamp is older than 5 minutes (replay protection)
  const now = Date.now()
  const ts = parseInt(timestamp)
  if (isNaN(ts) || Math.abs(now - ts) > 300000) {
    console.error('[n8n-verify] Timestamp expired or invalid:', timestamp)
    return false
  }
  
  // Clone the request to read body without consuming it for the actual handler
  const clonedReq = req.clone()
  const body = await clonedReq.text()
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
    
  // Check if it's a valid HMAC
  const isHmacValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )

  if (isHmacValid) return true

  // Final fallback: even if timestamp exists, if signature matches secret exactly, allow it (legacy)
  if (signature === secret) {
    console.warn('[n8n-verify] Signature matches static secret (HMAC failed)')
    return true
  }

  console.error('[n8n-verify] Signature mismatch')
  return false
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

/**
 * Verifies signatures for internal microservices (e.g. ffmpeg service).
 */
export function verifyInternalSignature(signature: string, body: string): boolean {
  const secret = process.env.INTERNAL_SERVICE_SECRET || process.env.PRINTHUB_INTERNAL_SECRET
  if (!secret || !signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
