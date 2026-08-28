// Downloads every image referenced in src/data/content.json from the live
// AMRUT site, then emits responsive WebP variants into public/img.
// Originals are never committed — only the optimised derivatives.

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ORIGIN = 'https://amrutmaharashtra.org/'
const OUT = 'public/img'
const WIDTHS = [400, 800, 1400]
const CONCURRENCY = 6

const list = (await fs.readFile('scripts/imglist.txt', 'utf8')).split('\n').filter(Boolean)
await fs.mkdir(OUT, { recursive: true })

// Flatten "photos/dharashiv/coverphoto/cover_2026.jpg" -> "dharashiv-cover_2026"
const keyFor = (src) => {
  const base = src.split('/').pop().replace(/\.[a-z]+$/i, '')
  const dir = src.split('/').slice(-3, -1).join('-')
  return `${dir}-${base}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 90)
}

const manifest = {}
let done = 0, failed = 0, bytesIn = 0, bytesOut = 0

async function one(src) {
  const key = keyFor(src)
  try {
    const res = await fetch(new URL(src, ORIGIN))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    bytesIn += buf.length

    const img = sharp(buf, { failOn: 'none' })
    const { width = 0, height = 0 } = await img.metadata()

    const widths = WIDTHS.filter((w) => w <= width)
    if (!widths.length) widths.push(width || 400)

    const variants = []
    for (const w of widths) {
      const name = `${key}-${w}.webp`
      const out = await sharp(buf, { failOn: 'none' })
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 76, effort: 5 })
        .toBuffer()
      await fs.writeFile(path.join(OUT, name), out)
      bytesOut += out.length
      variants.push({ w, file: name })
    }

    manifest[src] = { key, width, height, ratio: +(width / height).toFixed(4), variants }
    done++
  } catch (err) {
    failed++
    manifest[src] = { key, error: String(err.message) }
  }
}

// simple concurrency pool
const queue = [...list]
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await one(queue.shift())
  })
)

await fs.writeFile('src/data/images.json', JSON.stringify(manifest, null, 0))

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB'
console.log(`ok ${done}  failed ${failed}`)
console.log(`original ${mb(bytesIn)}  ->  webp ${mb(bytesOut)}  (${(bytesIn / bytesOut).toFixed(1)}x smaller)`)
