import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { QuoteStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { QuotesList } from './QuotesList'

export const metadata = { title: 'My Quotes | PrintHub' }

type StatusFilter = 'all' | 'active' | 'new' | 'reviewing' | 'quoted' | 'accepted' | 'cancelled' | 'completed' | 'rejected' | 'in_production'

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
  const statusFilter = (statusParam ?? 'all') as StatusFilter

  let quotes: Awaited<ReturnType<typeof fetchQuotes>> = []
  let counts: Awaited<ReturnType<typeof fetchCounts>> = { all: 0, active: 0, new: 0, reviewing: 0, quoted: 0, accepted: 0, cancelled: 0, completed: 0, rejected: 0, in_production: 0 }
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
  const active = newCount + reviewing + quoted
  return { all, active, new: newCount, reviewing, quoted, accepted, cancelled, completed, rejected, in_production: inProduction }
}

async function fetchQuotes(userId: string, userEmail: string, statusFilter: StatusFilter) {
  const statusWhere =
    statusFilter === "all"
      ? undefined
      : statusFilter === "active"
        ? { status: { in: ["new", "reviewing", "quoted"] as QuoteStatus[] } }
        : { status: statusFilter }

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

  return combined.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    type: q.type,
    status: q.status,
    description: q.description,
    projectName: q.projectName,
    quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
    quoteBreakdown: q.quoteBreakdown,
    quotedAt: q.quotedAt?.toISOString() ?? null,
    deadline: q.deadline?.toISOString() ?? null,
    budgetRange: q.budgetRange,
    specifications: q.specifications as Record<string, unknown> | null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    acceptedAt: q.acceptedAt?.toISOString() ?? null,
    rejectedAt: q.rejectedAt?.toISOString() ?? null,
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
  }))
}
