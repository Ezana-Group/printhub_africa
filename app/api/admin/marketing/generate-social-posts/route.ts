import { NextResponse } from 'next/server'
import { requireAdminApi } from "@/lib/admin-api-guard";
import { prisma } from '@/lib/prisma'
export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "marketing_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { productId, platforms } = await req.json()
    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_SOCIAL_POST_CHURN',
        category: 'MARKETING',
        entity: 'Product',
        entityId: productId,
        details: { productId, platforms },
        userId: session.user.id,
      },
    })

    // AI generation not yet configured — wire to Claude API or similar
    return NextResponse.json({ success: false, message: 'AI generation not configured' }, { status: 501 })
  } catch (err) {
    console.error('[api/admin/marketing/generate-social-posts] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
