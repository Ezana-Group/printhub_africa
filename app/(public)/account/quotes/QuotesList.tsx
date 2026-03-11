'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  MessageCircle,
  X,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const d = Math.floor(hr / 24)
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`
  const mo = Math.floor(d / 30)
  return `${mo} month${mo === 1 ? '' : 's'} ago`
}

function formatDate(date: Date, pattern: 'dd MMM yyyy' | 'EEEE d MMMM yyyy'): string {
  if (pattern === 'dd MMM yyyy') {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Status config for Quote model: new | reviewing | quoted | accepted | rejected | in_production | completed | cancelled
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Clock; description: string; pulse?: boolean }
> = {
  new: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-700',
    icon: Clock,
    description:
      "Your quote request has been received. We'll review it shortly.",
  },
  reviewing: {
    label: 'Under Review',
    color: 'bg-amber-100 text-amber-700',
    icon: RefreshCw,
    description:
      'Our team is reviewing your request and preparing a quote.',
  },
  quoted: {
    label: 'Quote Ready',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    description:
      "We've sent you a price. Review and accept or decline below.",
    pulse: true,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-800',
    icon: Check,
    description:
      "You've accepted this quote. We'll be in touch to arrange payment.",
  },
  rejected: {
    label: 'Declined / Withdrawn',
    color: 'bg-gray-100 text-gray-600',
    icon: XCircle,
    description: 'This quote request was closed.',
  },
  cancelled: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-600',
    icon: XCircle,
    description: 'This quote request was withdrawn.',
  },
  in_production: {
    label: 'In Production',
    color: 'bg-purple-100 text-purple-700',
    icon: RefreshCw,
    description: 'Your order is being produced.',
  },
  completed: {
    label: 'Order Placed',
    color: 'bg-purple-100 text-purple-700',
    icon: CheckCircle,
    description: 'This quote was completed.',
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-600',
    icon: AlertCircle,
    description:
      'This quote has expired. Submit a new request if you still need it.',
  },
}

const TYPE_LABELS: Record<string, string> = {
  large_format: '🖼 Large Format',
  three_d_print: '🖨 3D Printing',
  design_and_print: '📋 Design+Print',
}

type QuoteItem = {
  id: string
  quoteNumber: string
  type: string
  status: string
  description: string | null
  projectName: string | null
  quotedAmount: number | null
  quoteBreakdown: string | null
  quotedAt: string | null
  acceptedAt?: string | null
  rejectedAt?: string | null
  validUntil?: string | null
  deadline: string | null
  budgetRange: string | null
  specifications: Record<string, unknown> | null
  createdAt: string
  assignedUser: { name: string } | null
  files: Array<{
    id: string
    originalName: string
    fileType: string
    sizeBytes?: number
    status?: string
    createdAt?: Date
  }>
}

export function QuotesList({ initialQuotes }: { initialQuotes: QuoteItem[] }) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [expanded, setExpanded] = useState<string | null>(
    initialQuotes.find((q) => q.status === 'quoted')?.id ?? null
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [withdrawId, setWithdrawId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)

  if (quotes.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No quote requests yet
        </h3>
        <p className="text-gray-400 mb-6 max-w-sm mx-auto">
          Submit a quote request for large format printing, 3D printing, or any
          custom job.
        </p>
        <a
          href="/get-a-quote"
          className="bg-[#FF4D00] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#e64400] transition inline-block"
        >
          Get your first quote →
        </a>
      </div>
    )
  }

  const quotedItems = quotes.filter((q) => q.status === 'quoted')

  const performAction = async (
    quoteId: string,
    action: 'ACCEPT' | 'REJECT' | 'WITHDRAW',
    reason?: string
  ) => {
    setLoading(quoteId)
    try {
      const res = await fetch(`/api/account/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')

      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                status: data.quote?.status ?? q.status,
                acceptedAt: data.quote?.acceptedAt ?? q.acceptedAt,
                rejectedAt: data.quote?.rejectedAt ?? q.rejectedAt,
              }
            : q
        )
      )
      setWithdrawId(null)
      setRejectId(null)
      if (action === 'ACCEPT') setExpanded(quoteId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const res = await fetch(`/api/upload/${fileId}/download`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Download failed')
      const url = data.url
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.rel = 'noopener noreferrer'
        a.target = '_blank'
        a.click()
      }
    } catch {
      alert('Download is not available for this file.')
    }
  }

  const spec = (q: QuoteItem, key: string): string | undefined => {
    const s = q.specifications
    if (!s || typeof s !== 'object') return undefined
    const v = (s as Record<string, unknown>)[key]
    if (v === null || v === undefined) return undefined
    return String(v)
  }

  return (
    <div className="space-y-4">
      {quotedItems.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            {quotedItems.length === 1
              ? 'Your quote is ready! Review the price below.'
              : `${quotedItems.length} quotes are ready for your review.`}
          </p>
        </div>
      )}

      {quotes.map((quote) => {
        const cfg = STATUS_CONFIG[quote.status] ?? {
          label: quote.status.replace('_', ' '),
          color: 'bg-slate-100 text-slate-700',
          icon: FileText,
          description: 'Quote request.',
        }
        const isOpen = expanded === quote.id
        const isLoading = loading === quote.id

        return (
          <div
            key={quote.id}
            className={`border rounded-2xl overflow-hidden transition ${
              quote.status === 'quoted'
                ? 'border-green-300 shadow-sm shadow-green-100'
                : 'border-gray-200'
            }`}
          >
            <button
              type="button"
              className="w-full text-left p-5 hover:bg-gray-50 transition"
              onClick={() => setExpanded(isOpen ? null : quote.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-gray-900">
                      {quote.quoteNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${
                        cfg.pulse ? 'animate-pulse' : ''
                      }`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[quote.type] ?? quote.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {quote.description
                      ? quote.description.slice(0, 80) +
                        (quote.description.length > 80 ? '...' : '')
                      : quote.projectName ?? quote.type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted{' '}
                    {formatDistanceToNow(new Date(quote.createdAt))}
                    {quote.assignedUser &&
                      ` · Assigned to ${quote.assignedUser.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {quote.status === 'quoted' && quote.quotedAmount != null && (
                    <span className="text-lg font-bold text-[#FF4D00]">
                      KSh {quote.quotedAmount.toLocaleString()}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-start gap-2">
                    <cfg.icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                    <p className="text-sm text-gray-600">{cfg.description}</p>
                  </div>
                  {quote.quoteBreakdown && (
                    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Message from PrintHub team:
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {quote.quoteBreakdown}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Quote Details
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {quote.projectName && (
                      <Row label="Project" value={quote.projectName} />
                    )}
                    {quote.type === 'large_format' && (
                      <>
                        {spec(quote, 'widthCm') && (
                          <Row
                            label="Dimensions"
                            value={`${spec(quote, 'widthCm')} × ${spec(quote, 'heightCm')} cm`}
                          />
                        )}
                        {spec(quote, 'quantity') && (
                          <Row
                            label="Quantity"
                            value={`${spec(quote, 'quantity')} piece(s)`}
                          />
                        )}
                        {spec(quote, 'material') && (
                          <Row label="Material" value={spec(quote, 'material')!} />
                        )}
                        {spec(quote, 'lamination') && (
                          <Row
                            label="Lamination"
                            value={spec(quote, 'lamination')!}
                          />
                        )}
                        {spec(quote, 'usage') && (
                          <Row label="Usage" value={spec(quote, 'usage')!} />
                        )}
                        {spec(quote, 'urgency') && (
                          <Row label="Urgency" value={spec(quote, 'urgency')!} />
                        )}
                      </>
                    )}
                    {quote.type === 'three_d_print' && (
                      <>
                        {spec(quote, 'material') && (
                          <Row label="Material" value={spec(quote, 'material')!} />
                        )}
                        {spec(quote, 'colour') && (
                          <Row label="Colour" value={spec(quote, 'colour')!} />
                        )}
                        {spec(quote, 'quantity') && (
                          <Row
                            label="Quantity"
                            value={`${spec(quote, 'quantity')} piece(s)`}
                          />
                        )}
                        {spec(quote, 'infillPct') && (
                          <Row
                            label="Infill"
                            value={`${spec(quote, 'infillPct')}%`}
                          />
                        )}
                        {spec(quote, 'layerHeight') && (
                          <Row
                            label="Layer height"
                            value={spec(quote, 'layerHeight')!}
                          />
                        )}
                        {spec(quote, 'urgency') && (
                          <Row label="Urgency" value={spec(quote, 'urgency')!} />
                        )}
                      </>
                    )}
                    {quote.budgetRange && (
                      <Row label="Budget" value={quote.budgetRange} />
                    )}
                    {quote.deadline && (
                      <Row
                        label="Deadline"
                        value={formatDate(new Date(quote.deadline), 'dd MMM yyyy')}
                      />
                    )}
                  </div>
                  {quote.description && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Notes you provided:
                      </p>
                      <p className="text-sm text-gray-600 bg-white border border-gray-100 rounded-lg p-3">
                        {quote.description}
                      </p>
                    </div>
                  )}
                </div>

                {quote.files?.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Your Files ({quote.files.length})
                    </p>
                    <div className="space-y-2">
                      {quote.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-700 truncate">
                            {file.originalName}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {file.fileType}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadFile(file.id, file.originalName)
                            }
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quote.status === 'quoted' && quote.quotedAmount != null && (
                  <div className="px-5 py-4 border-b border-gray-100 bg-green-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Our Quote
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-green-200">
                        <span>Total</span>
                        <span className="text-[#FF4D00]">
                          KSh {quote.quotedAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {quote.quotedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Quoted on{' '}
                        {formatDate(new Date(quote.quotedAt), 'EEEE d MMMM yyyy')}
                      </p>
                    )}
                  </div>
                )}

                {quote.status === 'accepted' && (
                  <div className="px-5 py-4 border-b border-gray-100 bg-green-50">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium">
                          You&apos;ve accepted this quote!
                        </p>
                        <p className="mt-1 text-green-700">
                          Our team will contact you shortly to arrange payment
                          and confirm the order. You can also reach us on
                          WhatsApp.
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/254727410320?text=${encodeURIComponent(
                        `Hi PrintHub, I've accepted quote ${quote.quoteNumber}. Please let me know the next steps.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp to confirm
                    </a>
                  </div>
                )}

                <div className="px-5 py-4">
                  {quote.status === 'quoted' && (
                    <div className="space-y-2">
                      {rejectId === quote.id ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm font-medium text-red-800 mb-3">
                            Decline this quote?
                          </p>
                          <p className="text-xs text-red-600 mb-3">
                            If you&apos;d like a different price or have
                            questions, chat with us on WhatsApp first.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectId(null)}
                            >
                              Keep it
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              disabled={!!isLoading}
                              onClick={() =>
                                performAction(quote.id, 'REJECT', 'Customer declined')
                              }
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Yes, decline'
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-[#FF4D00] hover:bg-[#e64400] text-white"
                            disabled={!!isLoading}
                            onClick={() => performAction(quote.id, 'ACCEPT')}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Accept Quote
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setRejectId(quote.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                      <a
                        href={`https://wa.me/254727410320?text=${encodeURIComponent(
                          `Hi PrintHub, I have a question about quote ${quote.quoteNumber}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat about this quote
                      </a>
                    </div>
                  )}

                  {(quote.status === 'new' || quote.status === 'reviewing') && (
                    <div>
                      {withdrawId === quote.id ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-sm font-medium text-amber-800 mb-1">
                            Withdraw this quote request?
                          </p>
                          <p className="text-xs text-amber-700 mb-3">
                            {quote.status === 'reviewing'
                              ? 'Our team is already reviewing this. Are you sure you want to withdraw?'
                              : 'Your request will be cancelled and removed from our queue.'}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setWithdrawId(null)}
                            >
                              Keep it
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              disabled={!!isLoading}
                              onClick={() =>
                                performAction(quote.id, 'WITHDRAW')
                              }
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Yes, withdraw'
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <a
                            href={`https://wa.me/254727410320?text=${encodeURIComponent(
                              `Hi PrintHub, I have a question about quote ${quote.quoteNumber}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat with us about this
                          </a>
                          <button
                            type="button"
                            onClick={() => setWithdrawId(quote.id)}
                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
                          >
                            <X className="w-3 h-3" />
                            Withdraw request
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(quote.status === 'completed' || quote.status === 'in_production') && (
                    <p className="text-sm text-gray-600">
                      Our team is handling your order. Contact us on WhatsApp if
                      you have questions.
                    </p>
                  )}

                  {(quote.status === 'rejected' ||
                    quote.status === 'cancelled') && (
                    <a
                      href="/get-a-quote"
                      className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Submit a new request →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </>
  )
}
