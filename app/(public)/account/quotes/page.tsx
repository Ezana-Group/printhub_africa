import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { QuoteStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { QuotesList } from './QuotesList'

export const metadata = { title: 'My Quotes | PrintHub' }

export type TabFilter = 'all' | 'active' | 'awaiting_you' | 'in_progress' | 'closed'

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?next=/account/quotes')

  const userId = session.user.id as string
  const userEmail = (session.user.email as string) ?? ''
  const { status: statusParam } = await searchParams
  const statusFilter = (statusParam ?? 'all') as TabFilter

  let quotes: Awaited<ReturnType<typeof fetchQuotes>> = []
  let counts: Awaited<ReturnType<typeof fetchCounts>> = {
    all: 0,
    active: 0,
    awaiting_you: 0,
    in_progress: 0,
    closed: 0,
  }
  try {
    const [quotesList, countsResult] = await Promise.all([
      fetchQuotes(userId, userEmail, statusFilter),
      fetchCounts(userId, userEmail),
    ])
    quotes = quotesList
    counts = countsResult
  } catch {
    quotes = []
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
          <p className="text-gray-500 mt-1">
            Track and manage your quote requests
          </p>
        </div>
        <a
          href="/get-a-quote"
          className="bg-[#FF4D00] hover:bg-[#e64400] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + New Quote
        </a>
      </div>

      <Suspense fallback={<div className="animate-pulse rounded-xl h-12 bg-gray-100" />}>
        <QuotesList initialQuotes={quotes} initialStatus={statusFilter} counts={counts} />
      </Suspense>
    </div>
  )
}

async function fetchCounts(userId: string, userEmail: string) {
  const baseWhere = {
    OR: [
      { customerId: userId },
      ...(userEmail ? [{ customerId: null, customerEmail: { equals: userEmail, mode: 'insensitive' as const } }] : []),
    ],
  }
  const [all, newCount, reviewing, quoted, accepted, cancelled, completed, rejected, inProduction] = await Promise.all([
    prisma.quote.count({ where: baseWhere }),
    prisma.quote.count({ where: { ...baseWhere, status: 'new' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'reviewing' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'quoted' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'accepted' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'cancelled' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'completed' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'rejected' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'in_production' } }),
  ])
  const active = newCount + reviewing + quoted + accepted
  const awaiting_you = quoted
  const in_progress = inProduction + completed
  const closed = cancelled + rejected
  return { all, active, awaiting_you, in_progress, closed }
}

async function fetchQuotes(userId: string, userEmail: string, statusFilter: TabFilter) {
  const statusWhere =
    statusFilter === "all"
      ? undefined
      : statusFilter === "active"
        ? { status: { in: ["new", "reviewing", "quoted", "accepted"] as QuoteStatus[] } }
        : statusFilter === "awaiting_you"
          ? { status: "quoted" as QuoteStatus }
          : statusFilter === "in_progress"
            ? { status: { in: ["in_production", "completed"] as QuoteStatus[] } }
            : statusFilter === "closed"
              ? { status: { in: ["cancelled", "rejected"] as QuoteStatus[] } }
              : undefined

  const linkedQuotes = await prisma.quote.findMany({
    where: { customerId: userId, ...statusWhere },
    include: {
      uploadedFiles: {
        select: {
          id: true,
          originalName: true,
          fileType: true,
          size: true,
          status: true,
          createdAt: true,
        },
      },
      assignedStaff: {
        select: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const guestQuotes = userEmail
    ? await prisma.quote.findMany({
        where: {
          customerId: null,
          customerEmail: { equals: userEmail, mode: "insensitive" },
          ...statusWhere,
        },
        include: {
          uploadedFiles: {
            select: {
              id: true,
              originalName: true,
              fileType: true,
              size: true,
              status: true,
              createdAt: true,
            },
          },
          assignedStaff: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  const seenIds = new Set(linkedQuotes.map((q) => q.id))
  const guestOnly = guestQuotes.filter((q) => !seenIds.has(q.id))
  const combined = [...linkedQuotes, ...guestOnly].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  return combined.map((q) => {
    const quotedAt = q.quotedAt
    const validityDays = q.quoteValidityDays ?? 14
    const quotedValidUntil =
      quotedAt
        ? new Date(quotedAt.getTime() + validityDays * 24 * 60 * 60 * 1000)
        : null
    return {
      id: q.id,
      quoteNumber: q.quoteNumber,
      type: q.type,
      status: q.status,
      description: q.description,
      projectName: q.projectName,
      quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
      quoteBreakdown: q.quoteBreakdown,
      quotedAt: quotedAt?.toISOString() ?? null,
      quotedValidUntil: quotedValidUntil?.toISOString() ?? null,
      deadline: q.deadline?.toISOString() ?? null,
      budgetRange: q.budgetRange,
      specifications: q.specifications as Record<string, unknown> | null,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      acceptedAt: q.acceptedAt?.toISOString() ?? null,
      rejectedAt: q.rejectedAt?.toISOString() ?? null,
      cancellationReason: q.cancellationReason ?? q.closedReason ?? null,
      cancellationBy: q.closedBy ?? (q.cancelledBy === 'customer' ? 'CUSTOMER' : q.cancelledBy ? 'ADMIN' : null),
      cancelledAt: q.cancelledAt?.toISOString() ?? null,
      assignedUser: q.assignedStaff?.user?.name
        ? { name: q.assignedStaff.user.name }
        : null,
      files: q.uploadedFiles.map((f) => ({
        id: f.id,
        originalName: f.originalName,
        fileType: f.fileType,
        sizeBytes: f.size,
        status: f.status,
        createdAt: f.createdAt,
      })),
    }
  })
}
