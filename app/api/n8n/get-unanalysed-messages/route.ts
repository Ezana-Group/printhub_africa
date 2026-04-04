import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyN8nWebhook } from '@/lib/n8n-verify'

export async function GET(req: Request) {
  const isAuthorized = await verifyN8nWebhook(req)
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Fetch messages from TicketMessage that don't have a corresponding SENTIMENT_LOGGED in AuditLog
    // Note: This logic assumes we can link them. For now, we'll just return all in last 24h.
    const messages = await prisma.ticketMessage.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        isInternal: false,
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      messages: messages.map(m => ({
        id: m.id,
        text: m.message,
        sender: m.sender?.name || 'Anonymous',
        email: m.sender?.email,
        phone: m.sender?.phone,
        createdAt: m.createdAt,
      }))
    })
  } catch (err) {
    console.error('[api/n8n/get-unanalysed-messages] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
