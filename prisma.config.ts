import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { defineConfig } from 'prisma/config'

// Prisma CLI (migrate deploy, etc.) does not load Next.js env files; mirror typical local setup.
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true })
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true, quiet: true })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-expect-error - directUrl is required by Prisma 7 CLI but missing from types
    directUrl: process.env.DATABASE_URL_UNPOOLED,
  },
})
