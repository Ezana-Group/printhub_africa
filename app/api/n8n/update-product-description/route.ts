import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyN8nWebhook } from '@/lib/n8n-verify'

export async function PATCH(req: Request) {
  const isAuthorized = await verifyN8nWebhook(req)
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { productId, description, shortDescription, keyFeatures } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        description,
        shortDescription,
        keyFeatures: keyFeatures || [],
        aiDescriptionGenerated: true,
        aiGeneratedAt: new Date(),
      },
    })

    // Log the action to AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PRODUCT_DESCRIPTION_AI',
        category: 'AUTOMATION',
        details: { productId, fields: ['description', 'shortDescription', 'keyFeatures'] },
      },
    })

    return NextResponse.json({ success: true, productId: updatedProduct.id })
  } catch (err) {
    console.error('[api/n8n/update-product-description] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
