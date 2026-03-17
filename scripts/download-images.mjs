// scripts/download-images.mjs
// Run with: node scripts/download-images.mjs
// Downloads printing-relevant photos from Unsplash and saves as .webp (matches app paths).

import { writeFileSync, mkdirSync } from 'fs'

const Q = '&fm=webp&q=85' // webp format, quality 85

const images = [
  // ── HERO ──────────────────────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920${Q}`,
    dest: 'public/images/hero/hero-main.webp',
    description: 'Large format printer / vibrant print'
  },
  {
    url: `https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1920${Q}`,
    dest: 'public/images/hero/hero-alt.webp',
    description: 'Print shop / production'
  },

  // ── SERVICES — LARGE FORMAT ───────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200${Q}`,
    dest: 'public/images/services/large-format-hero.webp',
    description: 'Large format printing hero'
  },
  {
    url: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200${Q}`,
    dest: 'public/images/services/banner-outdoor.webp',
    description: 'Outdoor vinyl banner'
  },
  {
    url: `https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200${Q}`,
    dest: 'public/images/services/vehicle-wrap.webp',
    description: 'Vehicle wrap / branding'
  },
  {
    url: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200${Q}`,
    dest: 'public/images/services/event-backdrop.webp',
    description: 'Event backdrop / exhibition'
  },
  {
    url: `https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200${Q}`,
    dest: 'public/images/services/rollup-banner.webp',
    description: 'Roll-up banner'
  },

  // ── SERVICES — 3D PRINTING ────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1707286993616-5fed002cf505?w=1200${Q}`,
    dest: 'public/images/services/3d-printing-hero.webp',
    description: '3D printer in action'
  },
  {
    url: `https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=1200${Q}`,
    dest: 'public/images/services/3d-objects.webp',
    description: '3D printed objects'
  },
  {
    url: `https://images.unsplash.com/photo-1579403124614-197f69d8187b?w=1200${Q}`,
    dest: 'public/images/services/3d-nozzle.webp',
    description: '3D printer nozzle'
  },
  {
    url: `https://images.unsplash.com/photo-1758387933125-5ac945b4e2cd?w=1200${Q}`,
    dest: 'public/images/services/3d-prototype.webp',
    description: '3D printer in operation / prototype'
  },

  // ── HOW IT WORKS ──────────────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800${Q}`,
    dest: 'public/images/how-it-works/step1-design.webp',
    description: 'Design — Step 1'
  },
  {
    url: `https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800${Q}`,
    dest: 'public/images/how-it-works/step2-quote.webp',
    description: 'Quote — Step 2'
  },
  {
    url: `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800${Q}`,
    dest: 'public/images/how-it-works/step3-payment.webp',
    description: 'Payment — Step 3'
  },
  {
    url: `https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800${Q}`,
    dest: 'public/images/how-it-works/step4-delivery.webp',
    description: 'Delivery — Step 4'
  },

  // ── SHOP PRODUCTS ─────────────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1606189934846-a527add8a77b?w=800${Q}`,
    dest: 'public/images/products/3d-keyholder.webp',
    description: '3D printed keyholder'
  },
  {
    url: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800${Q}`,
    dest: 'public/images/products/vinyl-banner.webp',
    description: 'Vinyl banner product'
  },
  {
    url: `https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=800${Q}`,
    dest: 'public/images/products/3d-figurine.webp',
    description: '3D printed figurine'
  },
  {
    url: `https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=800${Q}`,
    dest: 'public/images/products/product-placeholder.webp',
    description: 'Product placeholder'
  },

  // ── CATALOGUE CATEGORIES ──────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=600${Q}`,
    dest: 'public/images/catalogue/category-home-decor.webp',
    description: 'Home decor'
  },
  {
    url: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600${Q}`,
    dest: 'public/images/catalogue/category-phone-tech.webp',
    description: 'Phone & tech'
  },
  {
    url: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600${Q}`,
    dest: 'public/images/catalogue/category-toys.webp',
    description: 'Toys and games'
  },
  {
    url: `https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600${Q}`,
    dest: 'public/images/catalogue/category-tools.webp',
    description: 'Tools and organisers'
  },
  {
    url: `https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600${Q}`,
    dest: 'public/images/catalogue/category-jewellery.webp',
    description: 'Jewellery'
  },
  {
    url: `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600${Q}`,
    dest: 'public/images/catalogue/category-education.webp',
    description: 'Education & STEM'
  },
  {
    url: `https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600${Q}`,
    dest: 'public/images/catalogue/category-office.webp',
    description: 'Office and desk'
  },
  {
    url: `https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=600${Q}`,
    dest: 'public/images/catalogue/category-kenya.webp',
    description: 'Kenya collection'
  },

  // ── ABOUT ─────────────────────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200${Q}`,
    dest: 'public/images/about/production-floor.webp',
    description: 'Production floor'
  },
  {
    url: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200${Q}`,
    dest: 'public/images/about/team.webp',
    description: 'Team'
  },
  {
    url: `https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=1200${Q}`,
    dest: 'public/images/about/nairobi.webp',
    description: 'Nairobi'
  },
  {
    url: `https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=800${Q}`,
    dest: 'public/images/about/quality-check.webp',
    description: 'Quality check'
  },
  {
    url: `https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800${Q}`,
    dest: 'public/images/about/delivery.webp',
    description: 'Delivery'
  },

  // ── OG / SOCIAL ──────────────────────────────────────────────────
  {
    url: `https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200&h=630&fit=crop${Q}`,
    dest: 'public/images/og/default-og.webp',
    description: 'Default OG image'
  },
]

async function downloadImage(url, dest) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    writeFileSync(dest, bytes)
    console.log(`✓ ${dest}`)
  } catch (err) {
    console.error(`✗ ${dest} — ${err.message}`)
  }
}

const dirs = [...new Set(images.map(img => img.dest.split('/').slice(0, -1).join('/')))]
dirs.forEach(dir => mkdirSync(dir, { recursive: true }))

console.log('Downloading printing-relevant images (.webp)...\n')
for (const img of images) {
  await downloadImage(img.url, img.dest)
}
console.log('\nDone.')
