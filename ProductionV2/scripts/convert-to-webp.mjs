// scripts/convert-to-webp.mjs
import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

async function convertDir(dir) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      await convertDir(fullPath)
      continue
    }
    if (!['.jpg', '.jpeg', '.png'].includes(extname(entry).toLowerCase())) continue
    const webpPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    await sharp(fullPath)
      .webp({ quality: 85 })
      .toFile(webpPath)
    console.log(`✓ Converted: ${webpPath}`)
  }
}

await convertDir('public/images')
console.log('\nWebP conversion complete.')
