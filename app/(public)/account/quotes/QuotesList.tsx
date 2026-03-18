'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  FileText,
  Download,
  MessageCircle,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Tag,
  Inbox,
  CheckSquare,
  Printer,
  Archive,
  FileQuestion,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getStatusBadgeStyle,
  getStatusIcon,
  getStatusIconBg,
  canCustomerWithdraw,
} from '@/lib/quote-status-display'

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
  quotedValidUntil?: string | null
  acceptedAt?: string | null
  rejectedAt?: string | null
  deadline: string | null
  budgetRange: string | null
  specifications: Record<string, unknown> | null
  createdAt: string
  cancellationReason?: string | null
  cancellationBy?: string | null
  cancelledAt?: string | null
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

type TabCounts = { all: number; active: number; awaiting_you: number; in_progress: number; closed: number }
type StatusTab = {
  id: string;
  label: string;
  countKey: keyof TabCounts;
  bgColor: string;
  textColor: string;
}
const TABS: StatusTab[] = [
  { id: 'all', label: 'All', countKey: 'all', bgColor: '#FFF3E0', textColor: '#E65100' },
  { id: 'active', label: 'Active', countKey: 'active', bgColor: '#E8F5E9', textColor: '#2E7D32' },
  { id: 'awaiting_you', label: 'Awaiting You', countKey: 'awaiting_you', bgColor: '#E3F2FD', textColor: '#1565C0' },
  { id: 'in_progress', label: 'In Progress', countKey: 'in_progress', bgColor: '#E0F7FA', textColor: '#00695C' },
  { id: 'closed', label: 'Closed', countKey: 'closed', bgColor: '#FCE4EC', textColor: '#880E4F' },
]

const defaultCounts: TabCounts = { all: 0, active: 0, awaiting_you: 0, in_progress: 0, closed: 0 }

const EMPTY_STATES: Record<string, { icon: React.ReactNode; title: string; subtitle: string }> = {
  all: {
    icon: <FileQuestion className="h-12 w-12 text-gray-300" />,
    title: "No quote requests yet",
    subtitle: "Submit a request for custom printing and we'll send you a price.",
  },
  active: {
    icon: <Inbox className="h-12 w-12 text-gray-300" />,
    title: "No active quotes",
    subtitle: "All your current quotes will appear here.",
  },
  awaiting_you: {
    icon: <CheckSquare className="h-12 w-12 text-gray-300" />,
    title: "Nothing waiting for you",
    subtitle: "When we send you a price, it'll appear here for you to accept or decline.",
  },
  in_progress: {
    icon: <Printer className="h-12 w-12 text-gray-300" />,
    title: "Nothing in production yet",
    subtitle: "Accepted quotes that are being printed will appear here.",
  },
  closed: {
    icon: <Archive className="h-12 w-12 text-gray-300" />,
    title: "No closed quotes",
    subtitle: "Withdrawn, cancelled, and expired quotes are archived here.",
  },
}

export function QuotesList({
  initialQuotes,
  initialStatus = 'all',
  counts = defaultCounts,
}: {
  initialQuotes: QuoteItem[]
  initialStatus?: string
  counts?: TabCounts
}) {
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [expanded, setExpanded] = useState<string | null>(
    initialQuotes.find((q) => q.status === 'quoted')?.id ?? null
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [withdrawId, setWithdrawId] = useState<string | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const activeTab = (searchParams?.get('status') ?? initialStatus) as string

  useEffect(() => {
    setQuotes(initialQuotes)
    setExpanded(initialQuotes.find((q) => q.status === 'quoted')?.id ?? null)
  }, [initialQuotes, initialStatus])

  const quotedQuotes = quotes.filter((q) => q.status === 'quoted')
  const selectedQuote = withdrawId ? quotes.find((q) => q.id === withdrawId) : null

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

  const confirmWithdraw = () => {
    if (!withdrawId) return
    performAction(withdrawId, 'WITHDRAW', withdrawReason.trim() || undefined)
    setWithdrawId(null)
    setWithdrawReason('')
  }

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-3 overflow-x-auto rounded-xl bg-slate-50 p-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const count = counts[tab.countKey] ?? 0
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.id === 'all' ? '/account/quotes' : `/account/quotes?status=${tab.id}`}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#FF4D00] text-white shadow-sm'
                  : 'hover:brightness-95'
              }`}
              style={isActive ? undefined : { backgroundColor: tab.bgColor, color: tab.textColor }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/60 text-current'
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {activeTab === 'awaiting_you' && quotedQuotes.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {quotedQuotes.length === 1
                ? 'You have 1 quote waiting for your response'
                : `You have ${quotedQuotes.length} quotes waiting for your response`}
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Review the pricing below and accept or decline each quote. Quotes expire after 14 days if not responded to.
            </p>
          </div>
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            {EMPTY_STATES[activeTab]?.icon ?? <FileQuestion className="h-12 w-12 text-gray-300" />}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-600">
            {EMPTY_STATES[activeTab]?.title ?? 'No quotes'}
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-gray-400">
            {EMPTY_STATES[activeTab]?.subtitle ?? 'Try another tab or submit a new quote.'}
          </p>
          <a
            href="/get-a-quote"
            className="inline-block rounded-xl bg-[#FF4D00] px-6 py-3 font-medium text-white transition hover:bg-[#e64400]"
          >
            {activeTab === 'all' ? 'Get your first quote →' : 'New quote request'}
          </a>
        </div>
      ) : (
        <>
          {quotes.map((quote) => {
            const badgeStyle = getStatusBadgeStyle(quote.status)
            const isOpen = expanded === quote.id
            const isLoading = loading === quote.id

            return (
              <div
                key={quote.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isOpen ? 'border-[#FF4D00]/30 shadow-sm' : 'border-gray-100'
                } ${quote.status === 'quoted' ? 'border-amber-300 bg-amber-50/30' : 'bg-white'}`}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : quote.id)}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getStatusIconBg(quote.status)}`}
                    >
                      {getStatusIcon(quote.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {quote.quoteNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text}`}
                        >
                          {badgeStyle.label}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {TYPE_LABELS[quote.type] ?? quote.type}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {quote.description ?? quote.projectName ?? 'No description'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                        <span>Submitted {formatDistanceToNow(new Date(quote.createdAt))}</span>
                        {quote.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Deadline: {formatDate(new Date(quote.deadline), 'dd MMM yyyy')}
                          </span>
                        )}
                        {quote.quotedAmount != null && (
                          <span className="flex items-center gap-1 font-semibold text-[#FF4D00]">
                            <Tag className="h-3 w-3" />
                            KES {quote.quotedAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {quote.status === 'quoted' && (
                      <span className="hidden rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 sm:block">
                        Response needed
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                {quote.quoteBreakdown && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-500">Message from PrintHub team</p>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{quote.quoteBreakdown}</p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
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

                {quote.files && quote.files.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Attached Files
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quote.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate text-sm text-gray-700">{file.originalName}</span>
                          <button
                            type="button"
                            onClick={() => downloadFile(file.id, file.originalName)}
                            className="shrink-0 text-gray-400 hover:text-gray-600"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {quote.status === 'quoted' && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
                      Your quote is ready
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      KES {quote.quotedAmount?.toLocaleString() ?? '—'}
                    </p>
                    {quote.quoteBreakdown && (
                      <p className="mt-0.5 text-xs text-gray-500">{quote.quoteBreakdown}</p>
                    )}
                    {quote.quotedValidUntil && (
                      <p className="mt-1 text-xs text-amber-700">
                        Valid until {formatDate(new Date(quote.quotedValidUntil), 'dd MMM yyyy')}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        className="bg-[#FF4D00] hover:bg-[#e64400]"
                        disabled={!!isLoading}
                        onClick={() => performAction(quote.id, 'ACCEPT')}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Accept & Proceed
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!!isLoading}
                        onClick={() => setRejectId(quote.id)}
                      >
                        Decline
                      </Button>
                    </div>
                    <a
                      href={`https://wa.me/254727410320?text=${encodeURIComponent(`Hi PrintHub, I have a question about quote ${quote.quoteNumber}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:bg-amber-100/50 rounded-xl transition"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat about this quote
                    </a>
                  </div>
                )}

                {quote.status === 'accepted' && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium">You&apos;ve accepted this quote!</p>
                        <p className="mt-1 text-green-700">
                          Our team will contact you shortly to arrange payment and confirm the order.
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/254727410320?text=${encodeURIComponent(`Hi PrintHub, I've accepted quote ${quote.quoteNumber}. Please let me know the next steps.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat on WhatsApp to confirm
                    </a>
                  </div>
                )}

                {quote.status === 'quoted' && rejectId === quote.id && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-800">Decline this quote?</p>
                    <p className="mb-3 text-xs text-red-600">
                      If you&apos;d like a different price or have questions, chat with us on WhatsApp first.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setRejectId(null)}>
                        Keep it
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        disabled={!!isLoading}
                        onClick={() => performAction(quote.id, 'REJECT', 'Customer declined')}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, decline'}
                      </Button>
                    </div>
                  </div>
                )}

                {canCustomerWithdraw(quote.status) && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setWithdrawId(quote.id)}
                      className="text-sm text-gray-400 transition-colors hover:text-red-500"
                    >
                      Withdraw this quote request
                    </button>
                  </div>
                )}

                {(quote.status === 'in_production' || quote.status === 'completed') && (
                  <p className="mt-4 text-sm text-gray-600">
                    Our team is handling your order. Contact us on{' '}
                    <a
                      href="https://wa.me/254727410320"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF4D00] hover:underline"
                    >
                      WhatsApp
                    </a>{' '}
                    if you have questions.
                  </p>
                )}

                {['rejected', 'cancelled'].includes(quote.status) && quote.cancellationReason && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-500">
                      {quote.cancellationBy === 'ADMIN' ? 'Cancelled by PrintHub' : 'Reason'}
                    </p>
                    <p className="text-sm text-gray-600">{quote.cancellationReason}</p>
                  </div>
                )}

                {['rejected', 'cancelled'].includes(quote.status) && (
                  <a
                    href="/get-a-quote"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-2.5 text-sm font-medium transition hover:bg-gray-50"
                  >
                    Submit a new request →
                  </a>
                )}
              </div>
            )}
          </div>
        )
          })}
        </>
      )}

      <Dialog open={!!withdrawId} onOpenChange={(open) => !open && setWithdrawId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Quote Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to withdraw <strong>{selectedQuote?.quoteNumber}</strong>? You can always submit a new request.
          </p>
          {selectedQuote?.status === 'accepted' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                <strong>Heads up:</strong> You&apos;ve already accepted this quote. Withdrawing after acceptance may incur a cancellation fee if materials have been prepared. Our team will review and contact you.
              </p>
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
          <textarea
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="e.g. Changed my mind, found another supplier, budget constraints..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4D00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20"
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setWithdrawId(null); setWithdrawReason('') }}
            >
              Keep it
            </Button>
            <Button
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
              onClick={confirmWithdraw}
            >
              Yes, withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
