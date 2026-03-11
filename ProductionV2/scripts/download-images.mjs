// scripts/download-images.mjs
// Run with: node scripts/download-images.mjs

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const images = [

  // ── HERO ──────────────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85',
    dest: 'public/images/hero/hero-main.jpg',
    description: 'Large format printer producing vibrant banner'
  },
  {
    url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1920&q=85',
    dest: 'public/images/hero/hero-alt.jpg',
    description: 'Print shop production floor'
  },

  // ── SERVICES — LARGE FORMAT ───────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200&q=85',
    dest: 'public/images/services/large-format-hero.jpg',
    description: 'Large format printing service hero'
  },
  {
    url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=85',
    dest: 'public/images/services/banner-outdoor.jpg',
    description: 'Outdoor vinyl banner installation'
  },
  {
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=85',
    dest: 'public/images/services/vehicle-wrap.jpg',
    description: 'Vehicle branding / wrap'
  },
  {
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=85',
    dest: 'public/images/services/event-backdrop.jpg',
    description: 'Event backdrop / exhibition display'
  },
  {
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85',
    dest: 'public/images/services/rollup-banner.jpg',
    description: 'Roll-up banner in corporate setting'
  },

  // ── SERVICES — 3D PRINTING ────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1631087670544-ece34d999956?w=1200&q=85',
    dest: 'public/images/services/3d-printing-hero.jpg',
    description: '3D printer in action'
  },
  {
    url: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=1200&q=85',
    dest: 'public/images/services/3d-objects.jpg',
    description: 'Collection of 3D printed objects'
  },
  {
    url: 'https://images.unsplash.com/photo-1579403124614-197f69d8187b?w=1200&q=85',
    dest: 'public/images/services/3d-nozzle.jpg',
    description: '3D printer nozzle close-up'
  },
  {
    url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbfbfb3?w=1200&q=85',
    dest: 'public/images/services/3d-prototype.jpg',
    description: '3D printed prototype model'
  },

  // ── HOMEPAGE — HOW IT WORKS ───────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=85',
    dest: 'public/images/how-it-works/step1-design.jpg',
    description: 'Designer working on laptop — Step 1'
  },
  {
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=85',
    dest: 'public/images/how-it-works/step2-quote.jpg',
    description: 'Online quote / pricing — Step 2'
  },
  {
    url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=85',
    dest: 'public/images/how-it-works/step3-payment.jpg',
    description: 'Mobile payment — Step 3'
  },
  {
    url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=85',
    dest: 'public/images/how-it-works/step4-delivery.jpg',
    description: 'Package delivery — Step 4'
  },

  // ── SHOP PRODUCTS ─────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1606189934846-a527add8a77b?w=800&q=85',
    dest: 'public/images/products/3d-keyholder.jpg',
    description: '3D printed key holder product'
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85',
    dest: 'public/images/products/vinyl-banner.jpg',
    description: 'Vinyl banner product'
  },
  {
    url: 'https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=800&q=85',
    dest: 'public/images/products/3d-figurine.jpg',
    description: '3D printed decorative object'
  },
  {
    url: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=800&q=85',
    dest: 'public/images/products/product-placeholder.jpg',
    description: 'Generic product placeholder'
  },

  // ── CATALOGUE — CATEGORY IMAGES ──────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=600&q=85',
    dest: 'public/images/catalogue/category-home-decor.jpg',
    description: 'Home decor 3D printed objects'
  },
  {
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=85',
    dest: 'public/images/catalogue/category-phone-tech.jpg',
    description: 'Phone tech accessories'
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85',
    dest: 'public/images/catalogue/category-toys.jpg',
    description: 'Toys and games'
  },
  {
    url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=85',
    dest: 'public/images/catalogue/category-tools.jpg',
    description: 'Tools and organisers'
  },
  {
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=85',
    dest: 'public/images/catalogue/category-jewellery.jpg',
    description: 'Jewellery and wearables'
  },
  {
    url: 'https://images.unsplash.com/photo-1532094349884-543559c17a34?w=600&q=85',
    dest: 'public/images/catalogue/category-education.jpg',
    description: 'Education and STEM models'
  },
  {
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=85',
    dest: 'public/images/catalogue/category-office.jpg',
    description: 'Office and desk accessories'
  },
  {
    url: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=600&q=85',
    dest: 'public/images/catalogue/category-kenya.jpg',
    description: 'Kenya collection'
  },

  // ── ABOUT US ──────────────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=85',
    dest: 'public/images/about/production-floor.jpg',
    description: 'Production floor interior'
  },
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=85',
    dest: 'public/images/about/team.jpg',
    description: 'Team working together'
  },
  {
    url: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=1200&q=85',
    dest: 'public/images/about/nairobi.jpg',
    description: 'Nairobi Kenya cityscape'
  },
  {
    url: 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=800&q=85',
    dest: 'public/images/about/quality-check.jpg',
    description: 'Quality check / inspection'
  },
  {
    url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=85',
    dest: 'public/images/about/delivery.jpg',
    description: 'Fast delivery courier'
  },

  // ── OG / SOCIAL META ─────────────────────────────────────────────
  {
    url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1200&h=630&fit=crop&q=85',
    dest: 'public/images/og/default-og.jpg',
    description: 'Default social media OG image'
  },
]

async function downloadImage(url, dest) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    writeFileSync(dest, bytes)
    console.log(`✓ Downloaded: ${dest}`)
  } catch (err) {
    console.error(`✗ Failed: ${dest} — ${err.message}`)
  }
}

// Create directories
const dirs = [...new Set(images.map(img => img.dest.split('/').slice(0, -1).join('/')))]
dirs.forEach(dir => mkdirSync(dir, { recursive: true }))

// Download all
console.log(`Downloading ${images.length} images...\n`)
for (const img of images) {
  await downloadImage(img.url, img.dest)
}
console.log('\nAll downloads complete.')
