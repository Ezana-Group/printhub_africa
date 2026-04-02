import { getServerSession } from 'next-auth'
import { authOptionsCustomer } from '@/lib/auth-customer'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/account/quotes — all quotes for the currently logged-in customer
export async function GET() {
  const session = await getServerSession(authOptionsCustomer)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id as string
  const userEmail = (session.user.email as string) ?? ''

  try {
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
            select: { user: { select: { name: true } } },
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
    const quotes = [...linkedQuotes, ...guestOnly].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    const serialized = quotes.map((q) => ({
      ...q,
      quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
      quotedAt: q.quotedAt?.toISOString() ?? null,
      acceptedAt: q.acceptedAt?.toISOString() ?? null,
      rejectedAt: q.rejectedAt?.toISOString() ?? null,
      deadline: q.deadline?.toISOString() ?? null,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      uploadedFiles: q.uploadedFiles.map((f) => ({
        ...f,
        sizeBytes: f.size,
      })),
      assignedUser: q.assignedStaff?.user?.name
        ? { name: q.assignedStaff.user.name }
        : null,
    }))

    return NextResponse.json({ quotes: serialized })
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }
    if (err.code === 'P2021' || err.message?.includes('does not exist')) {
      return NextResponse.json({ quotes: [] })
    }
    console.error('Quotes fetch error:', error)
    return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 })
  }
}
