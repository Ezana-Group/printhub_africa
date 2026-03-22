import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'prisma/config'

/**
 * Prisma CLI does not load Next.js env files. Use Node only (no dotenv) so
 * `migrate deploy` works in production images that omit devDependencies.
 */
function applyEnvFile(filePath: string, override: boolean) {
  if (!existsSync(filePath)) return
  const raw = readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    let s = line.trim()
    if (!s || s.startsWith('#')) continue
    if (s.startsWith('export ')) s = s.slice(7).trim()
    const eq = s.indexOf('=')
    if (eq === -1) continue
    const key = s.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    let val = s.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = val
    }
  }
}

const root = process.cwd()
applyEnvFile(resolve(root, '.env'), false)
applyEnvFile(resolve(root, '.env.local'), true)

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-expect-error - directUrl is required by Prisma 7 CLI but missing from types
    directUrl: process.env.DATABASE_URL_UNPOOLED,
  },
})
