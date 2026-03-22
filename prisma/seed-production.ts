import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.")
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting production seed...')

  // 1. Create admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.')
    process.exit(1)
  }

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
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
