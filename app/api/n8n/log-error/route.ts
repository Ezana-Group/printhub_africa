import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyN8nWebhook } from '@/lib/n8n-verify'

/**
 * Endpoint for n8n to log workflow errors to the AuditLog.
 */
export async function POST(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { workflowName, errorMessage, payload } = body

    await (prisma.auditLog as any).create({
      data: {
        category: 'AUTOMATION',
        action: 'N8N_WORKFLOW_ERROR',
        entity: 'Workflow',
        entityId: workflowName,
        details: {
          workflowName,
          errorMessage,
          payload,
        },
        severity: 'HIGH',
        // Optional: linking to user if applicable
        userId: null, // system event
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[log-error] Error logging workflow error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
