import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { n8n } from '@/lib/n8n'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId, platforms } = await req.json()

    if (!productId || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Missing productId or platforms' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Trigger n8n workflow for ad copy variations (AI-3)
    await n8n.generateAdCopy({
      productId: product.id,
      productName: product.name,
      platforms,
    })

    // Log the trigger
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_AD_COPY_GENERATION',
        category: 'MARKETING',
        details: { productId, platforms },
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true, message: 'AI Ad Copy Generation workflow triggered' })
  } catch (err) {
    console.error('[api/admin/marketing/generate-ad-copy] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
