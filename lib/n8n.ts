/**
 * N8N INTEGRATION DISABLED
 * All N8N workflow triggers have been disabled as part of the removal of external automation integrations.
 * This module is kept for backwards compatibility but all methods now perform no-ops.
 */

// Disabled: Original N8N webhook configuration and payload signing
// const N8N_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL
// const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET

export async function triggerN8nWorkflow(
  workflowWebhookPath: string,
  payload: any,
  options?: { blocking?: boolean }
): Promise<void> {
  // N8N integration is disabled. All triggers are no-ops.
  console.debug(`[N8N DISABLED] Would have triggered workflow: ${workflowWebhookPath}`)
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
    triggerN8nWorkflow('generate-social-posts', payload),
  
  productUpdated: (payload: ProductUpdatedPayload) =>
    triggerN8nWorkflow('product-updated', payload),
  
  syncAllFeeds: (payload: { triggeredBy: string }) =>
    triggerN8nWorkflow('sync-social-feeds', payload),

  newStaffLogin: (payload: NewDeviceLoginPayload) =>
    triggerN8nWorkflow('new-device-login', payload),

  corporateApplicationSubmitted: (payload: CorporateAppPayload) =>
    triggerN8nWorkflow('corporate-application', payload),

  catalogueImportEnhance: (payload: CatalogueImportPayload) =>
    triggerN8nWorkflow('enhance-catalogue-import-v1', payload),

  deliveryStatusChanged: (payload: DeliveryStatusPayload) =>
    triggerN8nWorkflow('delivery-status-changed', payload),

  productionFinished: (payload: ProductionFinishedPayload) =>
    triggerN8nWorkflow('production-finished', payload),

  generateAdCopy: (payload: AdCopyPayload) =>
    triggerN8nWorkflow('generate-ad-copy', payload),

  generateProductDescription: (payload: ProductDescriptionPayload) =>
    triggerN8nWorkflow('generate-product-description', payload),

  generateSocialPosts: (payload: ProductPublishedPayload) =>
    triggerN8nWorkflow('generate-social-posts', payload),

  generateMockups: (payload: MockupPayload) =>
    triggerN8nWorkflow('generate-mockups', payload),

  generateVideo: (payload: VideoPayload) =>
    triggerN8nWorkflow('generate-video', payload),

  sentimentAnalysis: (payload: SentimentPayload) =>
    triggerN8nWorkflow('sentiment-analysis', payload),

  generateSeoContent: (payload: SeoContentPayload) =>
    triggerN8nWorkflow('generate-seo-content', payload),
}

export interface ProductionFinishedPayload {
  orderId: string
  orderNumber: string | null
  productName: string
  quantity: number
  completedAt: string
}

export interface AdCopyPayload {
  productId: string
  productName: string
  platforms: string[]
  context?: string
}

export interface ProductDescriptionPayload {
  productId: string
  productName: string
  imageUrls: string[]
  currentDescription?: string
}

export interface MockupPayload {
  productId: string
  productName: string
  imageUrls: string[]
  platforms: ('Instagram' | 'LinkedIn' | 'TikTok')[]
}

export interface VideoPayload {
  productId: string
  productName: string
  description: string
  imageUrls: string[]
}

export interface SentimentPayload {
  messages: Array<{ id: string; text: string; sender: string }>
}

export interface SeoContentPayload {
  topic?: string
  keywords?: string[]
  productContext?: boolean
}

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
  projectName?: string
  estimatedValue?: number
  reviewUrl: string
  pdfBase64?: string // New: Base64 encoded Draft PDF
  specifications?: any // Detailed specs for multi-part support
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
    instagramStories: boolean
    instagramReels: boolean
    youtubeShorts: boolean
    whatsappStatus: boolean
    whatsappChannel: boolean
    telegram: boolean
    googleDiscover: boolean
    googleMapsPost: boolean
    bingPlaces: boolean
    appleMaps: boolean
    pigiaMe: boolean
    olxKenya: boolean
    reddit: boolean
    linkedinNewsletter: boolean
    medium: boolean
    nextdoor: boolean
    jiji: boolean
    postiz: boolean
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

export interface DeliveryStatusPayload {
  deliveryId: string
  orderId: string
  orderNumber: string
  status: string
  customerName: string
  customerEmail: string | null
  customerPhone?: string
  trackingNumber?: string | null
  failureReason?: string
}
