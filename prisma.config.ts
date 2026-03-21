import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-expect-error - directUrl is required by Prisma 7 CLI but missing from types
    directUrl: process.env.DATABASE_URL_UNPOOLED,
  },
})
