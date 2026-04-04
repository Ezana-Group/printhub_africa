import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Fetch sentiment logs from AuditLog
    const sentimentLogs = await prisma.auditLog.findMany({
      where: {
        action: 'SENTIMENT_LOGGED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        details: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Process logs to generate a summary
    const summary = {
      positive: 0,
      neutral: 0,
      negative: 0,
      totalCount: sentimentLogs.length,
      recentAlerts: [] as any[],
    }

    sentimentLogs.forEach((log: any) => {
      const details = log.details as any
      const sentiment = details.sentiment?.toLowerCase() || 'unknown'
      if (sentiment.includes('positive')) summary.positive++
      else if (sentiment.includes('negative')) summary.negative++
      else summary.neutral++

      // Pick out negative ones as alerts
      if (sentiment.includes('negative') && summary.recentAlerts.length < 5) {
        summary.recentAlerts.push({
          id: log.id || Math.random().toString(),
          message: details.message,
          platform: details.platform,
          phone: details.phone,
          date: log.createdAt,
        })
      }
    })

    return NextResponse.json({ success: true, summary })
  } catch (err) {
    console.error('[api/admin/marketing/sentiment-summary] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
