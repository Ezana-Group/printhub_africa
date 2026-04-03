import crypto from 'crypto'

const N8N_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL 
  // e.g. https://n8n.printhub.africa/webhook

const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET

function signPayload(payload: string): string {
  if (!N8N_SECRET) {
    console.warn('N8N_WEBHOOK_SECRET is not set. Payloads will not be signed.')
    return ''
  }
  return crypto
    .createHmac('sha256', N8N_SECRET!)
    .update(payload)
    .digest('hex')
}

export async function triggerN8nWorkflow(
  workflowWebhookPath: string,
  payload: any,
  options?: { blocking?: boolean }
): Promise<void> {
  if (!N8N_BASE_URL) {
    console.warn('N8N_WEBHOOK_BASE_URL is not set. Workflow not triggered:', workflowWebhookPath)
    return
  }
  
  const body = JSON.stringify(payload)
  const signature = signPayload(body)
  const url = `${N8N_BASE_URL}/${workflowWebhookPath}`
  
  const headers = {
    'Content-Type': 'application/json',
    'x-printhub-signature': signature,
    'x-printhub-timestamp': Date.now().toString(),
  }

  if (options?.blocking) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })
      if (!res.ok) {
        console.error(`n8n workflow failed: ${workflowWebhookPath}`, await res.text())
      }
    } catch (err) {
      console.error(`n8n trigger failed for ${workflowWebhookPath}:`, err)
    }
    return
  }

  // Non-blocking — fire and forget
  fetch(url, {
    method: 'POST', 
    headers,
    body,
  }).catch(err => console.error('n8n trigger failed silently:', err))
}

// Typed trigger functions — one per workflow
export const n8n = {
  orderConfirmed: (payload: OrderConfirmedPayload) =>
    triggerN8nWorkflow('order-confirmed', payload),
  
  orderStatusChanged: (payload: OrderStatusPayload) =>
    triggerN8nWorkflow('order-status-changed', payload),
  
  paymentFailed: (payload: PaymentFailedPayload) =>
    triggerN8nWorkflow('payment-failed', payload),
  
  cartAbandoned: (payload: AbandonedCartPayload) =>
    triggerN8nWorkflow('cart-abandoned', payload),
  
  quoteSubmitted: (payload: QuotePayload) =>
    triggerN8nWorkflow('quote-submitted', payload),
  
  quoteReady: (payload: QuoteReadyPayload) =>
    triggerN8nWorkflow('quote-ready', payload),
  
  staffAlert: (payload: StaffAlertPayload) =>
    triggerN8nWorkflow('staff-alert', payload),
  
  securityAlert: (payload: SecurityAlertPayload) =>
    triggerN8nWorkflow('security-alert', payload),
  
  impossibleTravel: (payload: ImpossibleTravelPayload) =>
    triggerN8nWorkflow('impossible-travel', payload),
  
  lowStock: (payload: LowStockPayload) =>
    triggerN8nWorkflow('low-stock', payload),
  
  productPublished: (payload: ProductPublishedPayload) =>
    triggerN8nWorkflow('product-published', payload),
  
  productUpdated: (payload: ProductUpdatedPayload) =>
    triggerN8nWorkflow('product-updated', payload),
  
  syncAllFeeds: (payload: { triggeredBy: string }) =>
    triggerN8nWorkflow('sync-social-feeds', payload),

  newStaffLogin: (payload: NewDeviceLoginPayload) =>
    triggerN8nWorkflow('new-device-login', payload),

  corporateApplicationSubmitted: (payload: CorporateAppPayload) =>
    triggerN8nWorkflow('corporate-application', payload),

  catalogueImportEnhance: (payload: CatalogueImportPayload) =>
    triggerN8nWorkflow('enhance-catalogue-import', payload),
}

// ... existing interfaces ...

export interface CatalogueImportPayload {
  importId: string
  sourceUrl: string
  platform: string
  originalName: string | null
  originalDescription: string | null
  originalTags: string[]
  imageUrls: string[]
  designerName: string | null
  licenseType: string | null
  downloadCount: number | null
  likeCount: number | null
}

// TypeScript interfaces for all payloads
export interface OrderConfirmedPayload {
  orderId: string
  orderNumber: string
  customerId: string
  customerEmail: string
  customerPhone: string
  customerName: string
  totalAmount: number
  currency: 'KES'
  items: Array<{
    name: string
    quantity: number
    price: number
    imageUrl?: string
  }>
  paymentMethod: string
  deliveryMethod: string
  isCorporate: boolean
  corporateId?: string
}

export interface OrderStatusPayload {
  orderId: string
  orderNumber: string
  customerEmail: string
  customerPhone: string
  customerName: string
  previousStatus: string
  newStatus: string
  trackingUrl?: string
  estimatedDelivery?: string
}

export interface PaymentFailedPayload {
  orderId: string
  customerEmail: string
  customerPhone: string
  customerName: string
  amount: number
  paymentMethod: string
  retryUrl: string
}

export interface AbandonedCartPayload {
  cartId: string
  customerId: string
  customerEmail: string
  customerPhone?: string
  customerName: string
  items: Array<{ name: string; price: number; imageUrl?: string }>
  totalValue: number
  cartUrl: string
  abandonedAt: string
  reminderNumber: 1 | 2 | 3
}

export interface QuotePayload {
  quoteId: string
  customerEmail: string
  customerName: string
  quoteType: string
  estimatedValue?: number
  reviewUrl: string
}

export interface QuoteReadyPayload {
  quoteId: string
  customerEmail: string
  customerPhone: string
  customerName: string
  quotedAmount: number
  pdfUrl: string
  validUntil: string
}

export interface StaffAlertPayload {
  type: 'NEW_ORDER' | 'PAYMENT_MANUAL' | 'NEW_QUOTE' | 'LOW_STOCK' | 
        'PRODUCTION_DELAYED' | 'SUPPORT_TICKET' | 'PRODUCT_PUBLISHED'
  title: string
  message: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  actionUrl: string
  targetRoles: ('STAFF' | 'ADMIN' | 'SUPER_ADMIN')[]
}

export interface SecurityAlertPayload {
  type: 'IMPOSSIBLE_TRAVEL' | 'NEW_DEVICE' | 'ACCOUNT_LOCKED' | 
        'BRUTE_FORCE' | 'SESSION_REVOKED'
  affectedUserId: string
  affectedUserEmail: string
  affectedUserName: string
  details: Record<string, unknown>
  superAdminEmail: string
}

export interface LowStockPayload {
  items: Array<{
    itemId: string
    itemName: string
    itemType: 'ThreeDConsumable' | 'LFStockItem' | 'Product'
    currentStock: number
    minimumStock: number
    unit: string
  }>
}

export interface ProductPublishedPayload {
  productId: string
  productName: string
  productSlug: string
  description: string
  price: number
  currency: 'KES'
  imageUrls: string[]
  category: string
  productUrl: string
  exportFlags: {
    google: boolean
    meta: boolean
    tiktok: boolean
    linkedin: boolean
    pinterest: boolean
    x: boolean
    googleBusiness: boolean
    snapchat: boolean
    youtube: boolean
  }
}

export interface ProductUpdatedPayload extends ProductPublishedPayload {
  changedFields: string[]
}

export interface NewDeviceLoginPayload {
  userId: string
  userEmail: string
  userName: string
  ipAddress: string
  userAgent: string
  city: string | null
  country: string | null
  loginAt: string
  revokeUrl: string
}

export interface ImpossibleTravelPayload {
  userId: string
  userEmail: string
  userName: string
  previousCountry: string
  previousIp: string
  previousLoginAt: string
  newCountry: string
  newIp: string
  newLoginAt: string
  superAdminEmail: string
  adminProfileUrl: string
}

export interface CorporateAppPayload {
  applicationId: string
  companyName: string
  contactEmail: string
  contactName: string
  reviewUrl: string
}
