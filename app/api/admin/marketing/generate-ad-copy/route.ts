import { NextResponse } from 'next/server'
import { requireAdminApi } from "@/lib/admin-api-guard";
import { prisma } from '@/lib/prisma'
import { n8n } from '@/lib/n8n'

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "marketing_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

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
        entity: 'Product',
        entityId: productId,
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
