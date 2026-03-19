import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { sendStaffQuoteAcceptedEmail } from '@/lib/email'

function isQuoteOwner(
  quote: { customerId: string | null; customerEmail: string },
  session: { user: { id?: string; email?: string | null } }
) {
  if (session.user.id && quote.customerId === session.user.id) return true
  if (
    quote.customerId === null &&
    session.user.email &&
    quote.customerEmail.toLowerCase() === (session.user.email as string).toLowerCase()
  )
    return true
  return false
}

// GET /api/account/quotes/[id] — single quote detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const quote = await prisma.quote.findFirst({
    where: { id },
    include: {
      uploadedFiles: true,
      assignedStaff: { select: { user: { select: { name: true } } } },
      cancelledByAdmin: { select: { name: true } },
    },
  })

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  if (!isQuoteOwner(quote, session)) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const serialized = {
    ...quote,
    quotedAmount: quote.quotedAmount != null ? Number(quote.quotedAmount) : null,
    quotedAt: quote.quotedAt?.toISOString() ?? null,
    acceptedAt: quote.acceptedAt?.toISOString() ?? null,
    rejectedAt: quote.rejectedAt?.toISOString() ?? null,
    deadline: quote.deadline?.toISOString() ?? null,
    cancelledAt: quote.cancelledAt?.toISOString() ?? null,
    cancellationReason: quote.cancellationReason ?? null,
    cancellationNotes: quote.cancellationNotes ?? null,
    cancelledBy: quote.cancelledBy ?? null,
    cancelledByAdminName: quote.cancelledByAdmin?.name ?? null,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    uploadedFiles: quote.uploadedFiles.map((f) => ({
      ...f,
      sizeBytes: f.size,
    })),
    assignedUser: quote.assignedStaff?.user?.name
      ? { name: quote.assignedStaff.user.name }
      : null,
  }

  return NextResponse.json({ quote: serialized })
}

// PATCH /api/account/quotes/[id] — customer actions: WITHDRAW | ACCEPT | REJECT
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: { action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { action, reason } = body
  if (typeof action !== 'string' || !['WITHDRAW', 'ACCEPT', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const existing = await prisma.quote.findFirst({
    where: { id },
    include: { assignedStaff: { select: { user: { select: { email: true } } } } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  if (!isQuoteOwner(existing, session)) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Customer cannot cancel/withdraw once in production or completed
  const CUSTOMER_CANCELLABLE = ['new', 'reviewing', 'quoted', 'accepted']
  if (
    (action === 'WITHDRAW' || action === 'REJECT') &&
    !CUSTOMER_CANCELLABLE.includes(existing.status)
  ) {
    return NextResponse.json(
      {
        error: 'This quote can no longer be cancelled from your account.',
        message:
          'Please contact us on WhatsApp: https://wa.me/254727410320',
        code: 'CANCELLATION_CUTOFF',
      },
      { status: 400 }
    )
  }

  const allowedActions: Record<string, string[]> = {
    new: ['WITHDRAW'],
    reviewing: ['WITHDRAW'],
    quoted: ['ACCEPT', 'REJECT'],
    accepted: ['WITHDRAW'],
  }

  const allowed = allowedActions[existing.status]
  if (!allowed?.includes(action)) {
    return NextResponse.json(
      {
        error: `Cannot ${action} a quote with status ${existing.status}`,
      },
      { status: 400 }
    )
  }

  const updateData: Prisma.QuoteUpdateInput = { status: existing.status }

  if (action === 'WITHDRAW') {
    updateData.status = 'cancelled'
    updateData.rejectedAt = new Date()
    updateData.rejectionReason = reason ?? 'Withdrawn by customer'
    updateData.cancelledAt = new Date()
    updateData.cancelledBy = 'customer'
    updateData.cancellationReason = 'customer_cancelled'
    updateData.cancellationNotes = reason ?? null
    updateData.closedBy = 'CUSTOMER'
    updateData.closedAt = new Date()
    updateData.closedReason = reason?.trim() ? `Withdrawn by customer: ${reason}` : 'Withdrawn by customer'
  }
  if (action === 'ACCEPT') {
    updateData.status = 'accepted'
    updateData.acceptedAt = new Date()
  }
  if (action === 'REJECT') {
    updateData.status = 'rejected'
    updateData.rejectedAt = new Date()
    updateData.rejectionReason = reason ?? 'Declined by customer'
    updateData.closedBy = 'CUSTOMER'
    updateData.closedAt = new Date()
    updateData.closedReason = reason?.trim() ? `Declined by customer: ${reason}` : 'Declined by customer'
  }

  const updated = await prisma.quote.update({
    where: { id },
    data: updateData,
  })

  if (action === 'WITHDRAW') {
    await prisma.quoteCancellation.create({
      data: {
        quoteId: id,
        cancelledBy: 'customer',
        cancelledByUserId: session?.user?.id ?? null,
        reason: 'customer_cancelled',
        notes: reason ?? null,
        notificationSent: false,
      },
    })
  }

  if (action === 'ACCEPT') {
    const staffEmail = existing.assignedStaff?.user?.email
    const amount = existing.quotedAmount != null ? Number(existing.quotedAmount) : 0
    if (staffEmail) {
      void sendStaffQuoteAcceptedEmail(
        staffEmail,
        existing.quoteNumber,
        existing.customerName,
        amount
      ).catch((err) => console.error('Staff quote accepted email error:', err))
    }
  }

  return NextResponse.json({
    success: true,
    quote: {
      ...updated,
      quotedAmount: updated.quotedAmount != null ? Number(updated.quotedAmount) : null,
      quotedAt: updated.quotedAt?.toISOString() ?? null,
      acceptedAt: updated.acceptedAt?.toISOString() ?? null,
      rejectedAt: updated.rejectedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
}
