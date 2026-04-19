# Template Audit Report

This report identifies hardcoded WhatsApp messages and PDF document structures that are candidates for migration to the unified template management system.

## 1. WhatsApp Templates

| Source File | Current Trigger / Logic | Proposed Slug | Parameters |
|:---|:---|:---|:---|
| `SalesPrintCalculator.tsx` | Manual button click to send 3D quote | `3d-print-quote-whatsapp` | `clientName`, `validUntil`, `finalTotal`, `lineItemsDetails` |
| `SalesLFCalculator.tsx` | Manual button click to send LF quote | `lf-print-quote-whatsapp` | `clientName`, `validUntil`, `finalTotal`, `lineItemsDetails` |
| `tracking.ts` | `sendTrackingSms` helper (Africa's Talking) | `order-status-update-whatsapp` | `title`, `orderNumber`, `trackUrl` |
| `lib/marketing/whatsapp.ts` | `waOrderConfirmation` (Meta Cloud API) | `order-confirmation-meta` | `orderNumber`, `total`, `trackUrl` |
| `lib/marketing/whatsapp.ts` | `waShippingUpdate` (Meta Cloud API) | `shipping-update-meta` | `orderNumber`, `trackingNumber`, `trackUrl` |

## 2. n8n Workflows Integration

| Workflow | Node | Template Slug | Status |
|:---|:---|:---|:---|
| `Staff Alert Dispatcher` | Fetch Template | `staff-alert-whatsapp` | **INTEGRATED** (REST API) |
| `Weekly SMS Broadcast` | Push to Queue | N/A (Broadcast) | **INTEGRATED** (Approval Queue) |
| `Customer Support` | AI Generate | `customer-support-base` | **PENDING** |

## 3. PDF Templates

| Source File | Component / Logic | Proposed Slug | Placeholders |
|:---|:---|:---|:---|
| `components/pdf/InvoicePDF.tsx` | React-PDF Invoice Layout | `customer-invoice-pdf` | `orderNumber`, `date`, `items`, `subtotal`, `vat`, `total` |
| `components/pdf/QuotePDF.tsx` | React-PDF Quote Layout | `customer-quote-pdf` | `clientName`, `validUntil`, `items`, `total` |

## 3. Findings & Notes

### WhatsApp Migration
- The messages in `SalesPrintCalculator` and `SalesLFCalculator` are currently constructed as URL-encoded strings for `wa.me` links.
- The `tracking.ts` logic currently uses `sendSMS` (Africa's Talking). Migrating this to `order-status-update-whatsapp` will allow for rich media and formatted text.

### PDF Representation
- Current PDFs are generated using `@react-pdf/renderer` in React components.
- For the template system (DB-backed), these will be represented by an HTML/CSS string in the `bodyHtml` field of the `PdfTemplate` model.
- **Action**: Seed the initial templates with a clean HTML structure that mirrors the current visual output.

### Status & Activation
- All templates will be seeded as `DRAFT` (logic to be implemented if field is added, otherwise noted in description).
- System will continue using hardcoded logic until the `// TODO` markers are addressed in a future task.
