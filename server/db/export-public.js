'use strict'
/* Writes every published story out as plain files. */

const fs = require('node:fs')
const path = require('node:path')
const db = require('../src/core/db')
const config = require('../src/core/config')
const images = require('../src/core/images')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const dmy = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}
const hm = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0')
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
  return `${h}:${m} ${ap}`
}
const districtKey = (en) => String(en || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
const paragraphs = (b) => String(b || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
const summarise = (b) => { const f = paragraphs(b)[0] || ''; return f.length > 220 ? f.slice(0, 217).trimEnd() + '…' : f }

;(async () => {
  await db.connect()
  const outDir = path.resolve(__dirname, '..', arg('--out', 'data/export'))
  const imgDir = path.resolve(__dirname, '..', arg('--img', 'data/export/img'))
  fs.mkdirSync(path.join(outDir, 'a'), { recursive: true })
  fs.mkdirSync(imgDir, { recursive: true })

  const rows = await db.all(`
    SELECT s.*, d.name_mr AS district_mr, d.name_en AS district_en,
           se.key_en AS cat, se.slug AS cat_slug, se.name_mr AS cat_mr, a.name AS author
      FROM stories s
      LEFT JOIN districts d  ON d.id  = s.district_id
      LEFT JOIN sections  se ON se.id = s.section_id
      LEFT JOIN users     a  ON a.id  = s.author_id
     WHERE s.status = 'published'
     ORDER BY s.published_at DESC`)

  const index = []
  let copied = 0
  for (const r of rows) {
    const photos = await db.all(
      'SELECT public_id, file_path, widths, img_w, img_h FROM story_images WHERE story_id = ? ORDER BY sort_order, id', [r.id])
    const imgOut = []
    for (const p of photos) {
      const widths = String(p.widths || '').split(',').filter(Boolean).map(Number)
      for (const w of widths) {
        const from = path.join(config.uploadDir, images.variantPath(p.file_path, w))
        if (fs.existsSync(from)) { fs.copyFileSync(from, path.join(imgDir, `${p.public_id}-${w}.webp`)); copied++ }
      }
      imgOut.push({ key: p.public_id, widths, w: p.img_w || null, h: p.img_h || null })
    }
    const article = {
      id: r.public_id,
      title: r.title,
      summary: summarise(r.body),
      body: paragraphs(r.body),
      images: imgOut,
      youtube: null,
      author: r.author || '',
      date: dmy(r.published_at),
      time: hm(r.published_at),
      district: districtKey(r.district_en),
      cat: r.cat,
      related: [],
    }
    fs.writeFileSync(path.join(outDir, 'a', `${r.public_id}.json`), JSON.stringify(article))
    index.push({
      id: r.public_id, t: r.title, x: article.summary, d: article.date,
      district: article.district, cat: r.cat, catSlug: r.cat_slug,
      image: imgOut[0] || null,
    })
  }

  /* the six scrolling lines, written where the portal looks for them. */
  const ticker = await db.all(
    'SELECT public_id, text_mr, link_url FROM ticker_items WHERE is_active = 1 ORDER BY position, id')
  fs.writeFileSync(path.join(outDir, '..', 'ticker.json'),
    JSON.stringify(ticker.map((t) => ({ id: t.public_id, text: t.text_mr, href: t.link_url || null }))))
  console.log(`${ticker.length} scrolling line(s) -> ticker.json`)

  fs.writeFileSync(path.join(outDir, 'office-stories.json'),
    JSON.stringify({ generated: new Date().toISOString(), count: index.length, items: index }, null, 0))

  console.log(`${index.length} published story file(s) -> ${outDir}`)
  console.log(`${copied} image file(s) -> ${imgDir}`)
  console.log('Index: office-stories.json')
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
