import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { QuotesList } from './QuotesList'

export const metadata = { title: 'My Quotes | PrintHub' }

export default async function QuotesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?next=/account/quotes')

  const userId = session.user.id as string
  const userEmail = (session.user.email as string) ?? ''

  let quotes: Awaited<ReturnType<typeof fetchQuotes>> = []
  try {
    quotes = await fetchQuotes(userId, userEmail)
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

      <QuotesList initialQuotes={quotes} />
    </div>
  )
}

async function fetchQuotes(userId: string, userEmail: string) {
  const [linkedQuotes, guestQuotes] = await Promise.all([
    prisma.quote.findMany({
      where: { customerId: userId },
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
          select: { user: { select: { name: true } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    userEmail
      ? prisma.quote.findMany({
          where: {
            customerId: null,
            customerEmail: { equals: userEmail, mode: 'insensitive' },
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
              select: { user: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [],
  ])

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
