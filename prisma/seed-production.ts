import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  console.error('⚠️ DATABASE_URL is not set. Skipping seed.')
  process.exit(0) // Exit 0 so the container still starts
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting production seed...')

  // 1. Create admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL
  // Support both ADMIN_PASSWORD and SUPER_ADMIN_PASSWORD (Railway env var naming)
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️ Missing ADMIN_EMAIL/SUPER_ADMIN_EMAIL or ADMIN_PASSWORD/SUPER_ADMIN_PASSWORD — skipping admin user seed.')
    // Do NOT process.exit(1) here — let the server start without seeding
  }

  if (adminEmail && adminPassword) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!existingAdmin) {
      console.log(`Creating admin user: ${adminEmail}`)
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      })
      console.log('✅ Admin user created.')
    } else {
      console.log('ℹ️ Admin user already exists. Skipping.')
    }
  }

  // 2. Seed legal pages if not exists
  const { getLegalContent } = await import('./legal-content')
  const LEGAL_PAGES = [
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-of-service', title: 'Terms of Service' },
    { slug: 'refund-policy', title: 'Refund and Returns Policy' },
  ]

  for (const page of LEGAL_PAGES) {
    const existingPage = await prisma.legalPage.findUnique({
      where: { slug: page.slug },
    })

    if (!existingPage) {
      console.log(`Creating legal page: ${page.slug}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = getLegalContent(page.slug as any)
      await prisma.legalPage.create({
        data: {
          slug: page.slug,
          title: page.title,
          content,
          lastUpdated: new Date(),
          isPublished: true,
          version: 1,
        },
      })
      console.log(`✅ ${page.slug} created.`)
    } else {
      console.log(`ℹ️ ${page.slug} already exists. Skipping.`)
    }
  }

  console.log('✅ Production seed complete.')
}

main()
  .catch((e) => {
    // Log the error but exit 0 so the container can still start
    console.error('⚠️ Seed encountered an error (non-fatal):', e.message || e)
    process.exit(0)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
