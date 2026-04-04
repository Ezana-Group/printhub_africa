import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triggerN8nWorkflow } from '@/lib/n8n'

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId, platforms } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Prepare payload for n8n
    const payload = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      description: product.description || '',
      price: Number(product.basePrice),
      currency: 'KES',
      imageUrls: product.images,
      category: product.category.name,
      productUrl: `https://printhub.africa/products/${product.slug}`,
      exportFlags: platforms.reduce((acc: any, p: string) => {
        acc[p.toLowerCase()] = true
        return acc
      }, {}),
    }

    // Trigger n8n workflow for social post generation
    // Following AI-1 Social Post Generation workflow calling AI-11 via product-published route logic
    await triggerN8nWorkflow('product-published', payload, { blocking: false })

    // Log the manual trigger
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_SOCIAL_POST_CHURN',
        category: 'MARKETING',
        details: { productId, platforms },
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true, message: 'N8N Social Post workflow triggered' })
  } catch (err) {
    console.error('[api/admin/marketing/generate-social-posts] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
