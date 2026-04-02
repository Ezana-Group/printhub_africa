import { NextRequest, NextResponse } from 'next/server'
import { verifyN8nWebhook } from '@/lib/n8n-verify'
import { prisma } from '@/lib/prisma'

/**
 * Used by n8n to track sent alerts.
 */
export async function POST(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req)
    if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { alertId, type, urgency } = await req.json()

    await prisma.auditLog.create({
      data: {
        category: 'AUTOMATION',
        action: 'STAFF_ALERT_SENT',
        details: { alertId, type, urgency },
        severity: urgency === 'critical' || urgency === 'high' ? 'HIGH' : 'LOW',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[mark-alert-sent] Error marking alert:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
