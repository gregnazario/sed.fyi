/**
 * Generates PNG versions of SVG assets for social media / favicons.
 *
 * Usage:  node scripts/generate-images.mjs
 * Requires: sharp (already in devDependencies)
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

async function generate() {
  // OG Image — 1200×630 (recommended by Facebook / Twitter / LinkedIn)
  const ogSvg = readFileSync(resolve(publicDir, 'og-image.svg'))
  await sharp(ogSvg, { density: 150 })
    .resize(1200, 630)
    .png({ quality: 90 })
    .toFile(resolve(publicDir, 'og-image.png'))
  console.log('  og-image.png       1200x630')

  // Favicon — 32×32
  const faviconSvg = readFileSync(resolve(publicDir, 'favicon.svg'))
  await sharp(faviconSvg, { density: 300 })
    .resize(32, 32)
    .png()
    .toFile(resolve(publicDir, 'favicon.png'))
  console.log('  favicon.png        32x32')

  // Apple Touch Icon — 180×180
  await sharp(faviconSvg, { density: 300 })
    .resize(180, 180)
    .png()
    .toFile(resolve(publicDir, 'apple-touch-icon.png'))
  console.log('  apple-touch-icon.png  180x180')
}

console.log('Generating PNG assets...\n')
generate()
  .then(() => console.log('\nDone.'))
  .catch((err) => {
    console.error('Failed:', err)
    process.exit(1)
  })
