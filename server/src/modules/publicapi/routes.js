'use strict'
/* The public read path.

   Everything here is open to anyone and shows ONLY published stories. Nothing
   in a draft, awaiting review or sent back is reachable, and no staff detail
   leaves this file. It is what the portal itself reads so a story written in
   the office appears on the site without anybody copying files around. */

const db = require('../../core/db')
const visitor = require('../../core/visitor')
const counter = require('../analytics/counter')
const ids = require('../../core/ids')
const upload = require('../../core/upload')
const images = require('../../core/images')

const PAGE = 20

const json = (res, status, data, extra = {}) => {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'cache-control': 'public, max-age=60',
    'x-content-type-options': 'nosniff',
    ...extra,
  })
  res.end(body)
}

const dmy = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

const districtKey = (en) => String(en || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')

const paragraphs = (body) => String(body || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

const summarise = (body) => {
  const first = paragraphs(body)[0] || ''
  return first.length > 220 ? first.slice(0, 217).trimEnd() + '…' : first
}

async function photosFor(storyIds) {
  if (!storyIds.length) return new Map()
  const marks = storyIds.map(() => '?').join(',')
  const rows = await db.all(
    `SELECT story_id, public_id, widths, img_w, img_h FROM story_images
      WHERE story_id IN (${marks}) ORDER BY sort_order, id`, storyIds)
  const out = new Map()
  for (const r of rows) {
    const list = out.get(r.story_id) || []
    list.push({
      id: r.public_id,
      url: `/api/img/${r.public_id}`,
      widths: String(r.widths || '').split(',').filter(Boolean).map(Number),
      w: r.img_w || null,
      h: r.img_h || null,
    })
    out.set(r.story_id, list)
  }
  return out
}

const LIST_SELECT = `
  SELECT s.id, s.public_id, s.title, s.body, s.published_at,
         d.name_mr AS district_mr, d.name_en AS district_en,
         se.key_en AS cat, se.slug AS cat_slug, se.name_mr AS cat_mr,
         a.name AS author
    FROM stories s
    LEFT JOIN districts d  ON d.id  = s.district_id
    LEFT JOIN sections  se ON se.id = s.section_id
    LEFT JOIN users     a  ON a.id  = s.author_id
   WHERE s.status = 'published'`

const brief = (r, photos) => ({
  id: r.public_id,
  title: r.title,
  summary: summarise(r.body),
  date: dmy(r.published_at),
  district: districtKey(r.district_en),
  districtMr: r.district_mr,
  cat: r.cat,
  catSlug: r.cat_slug,
  catMr: r.cat_mr,
  images: photos.get(r.id) || [],
})

/* Returns true if it handled the request. */
async function handle(req, res, route, url) {
  if (!route.startsWith('/api/')) return false

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' })
    res.end()
    return true
  }
  /* Two things the portal may POST: "this was read" and "this was clicked".
     Both take an identifier and nothing else. */
  if (req.method === 'POST') {
    const view = route.match(/^\/api\/view\/([A-Za-z0-9_-]{1,40})$/)
    if (view) {
      await counter.record(view[1], 'story', visitor.fingerprint(req))
      json(res, 200, { ok: true })
      return true
    }
    const clicked = route.match(/^\/api\/ads\/([A-Za-z0-9_-]{1,40})\/click$/)
    if (clicked) {
      await counter.click(clicked[1], 'ad')
      json(res, 200, { ok: true })
      return true
    }
    json(res, 404, { error: 'not found' })
    return true
  }
  if (req.method !== 'GET') { json(res, 405, { error: 'read only' }); return true }

  /* the 16 sections, with how many published stories each holds */
  if (route === '/api/sections') {
    const rows = await db.all(`
      SELECT se.slug, se.key_en, se.name_mr, COUNT(s.id) AS n
        FROM sections se
        LEFT JOIN stories s ON s.section_id = se.id AND s.status = 'published'
       GROUP BY se.id, se.slug, se.key_en, se.name_mr, se.sort_order
       ORDER BY se.sort_order`)
    json(res, 200, rows.map((r) => ({ slug: r.slug, key: r.key_en, mr: r.name_mr, stories: Number(r.n) })))
    return true
  }

  /* a page of published stories, newest first, optionally one section */
  if (route === '/api/stories') {
    const section = url.searchParams.get('section')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || PAGE))
    const where = section ? ' AND se.slug = ?' : ''
    const params = section ? [section] : []
    const total = Number((await db.get(
      `SELECT COUNT(*) AS n FROM stories s LEFT JOIN sections se ON se.id = s.section_id
        WHERE s.status = 'published'${where}`, params)).n)
    const rows = await db.all(
      `${LIST_SELECT}${where} ORDER BY s.published_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit])
    const photos = await photosFor(rows.map((r) => r.id))
    json(res, 200, {
      page, limit, total, pages: Math.max(1, Math.ceil(total / limit)),
      items: rows.map((r) => brief(r, photos)),
    })
    return true
  }

  /* one story, in full */
  const one = route.match(/^\/api\/stories\/([A-Za-z0-9_-]+)$/)
  if (one) {
    if (!ids.looksValid(one[1])) { json(res, 404, { error: 'not found' }); return true }
    const r = await db.get(`${LIST_SELECT} AND s.public_id = ?`, [one[1]])
    if (!r) { json(res, 404, { error: 'not found' }); return true }
    const photos = await photosFor([r.id])
    const related = await db.all(
      `${LIST_SELECT} AND se.slug = ? AND s.public_id <> ? ORDER BY s.published_at DESC LIMIT 4`,
      [r.cat_slug, r.public_id])
    json(res, 200, {
      ...brief(r, photos),
      author: r.author || '',
      body: paragraphs(r.body),
      related: related.map((x) => ({ id: x.public_id, t: x.title, x: summarise(x.body) })),
    })
    return true
  }

  /* advertisements that are running right now, for one placement */
  if (route === '/api/ads') {
    const slot = url.searchParams.get('slot')
    const today = new Date().toISOString().slice(0, 10)
    const where = slot ? ' AND sl.code = ?' : ''
    const rows = await db.all(
      `SELECT a.public_id, a.target_url, a.image_public_id, a.image_widths, a.image_w, a.image_h,
              sl.code AS slot, sl.width_px, sl.height_px
         FROM ads a JOIN ad_slots sl ON sl.id = a.slot_id
        WHERE a.status = 'live' AND a.starts_on <= ? AND a.ends_on >= ?${where}
        ORDER BY a.live_at DESC LIMIT 20`, slot ? [today, today, slot] : [today, today])
    const shown = rows.filter((r) => r.image_public_id)
    const who = visitor.fingerprint(req)
    for (const r of shown) await counter.record(r.public_id, 'ad', who)
    json(res, 200, shown.map((r) => ({
      id: r.public_id,
      slot: r.slot,
      href: r.target_url || null,
      box: { w: r.width_px, h: r.height_px },
      image: {
        id: r.image_public_id,
        url: `/api/ads/img/${r.image_public_id}`,
        widths: String(r.image_widths || '').split(',').filter(Boolean).map(Number),
        w: r.image_w || null, h: r.image_h || null,
      },
    })))
    return true
  }

  /* the artwork of a running advertisement */
  const adImg = route.match(/^\/api\/ads\/img\/([A-Za-z0-9_-]+)$/)
  if (adImg) {
    if (!ids.looksValid(adImg[1])) { json(res, 404, { error: 'not found' }); return true }
    const today = new Date().toISOString().slice(0, 10)
    const row = await db.get(
      `SELECT image_path, image_widths FROM ads
        WHERE image_public_id = ? AND status = 'live' AND starts_on <= ? AND ends_on >= ?`,
      [adImg[1], today, today])
    if (!row) { json(res, 404, { error: 'not found' }); return true }
    const want = Number(url.searchParams.get('w')) || 800
    const have = String(row.image_widths || '').split(',').filter(Boolean).map(Number)
    const pick = have.includes(want) ? want : have[have.length - 1]
    const data = upload.readSaved(pick ? images.variantPath(row.image_path, pick) : row.image_path) || upload.readSaved(row.image_path)
    if (!data) { json(res, 404, { error: 'not found' }); return true }
    res.writeHead(200, {
      'content-type': pick ? 'image/webp' : 'image/jpeg',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=3600',
    })
    res.end(data)
    return true
  }

  /* a photograph, at the size asked for */
  const img = route.match(/^\/api\/img\/([A-Za-z0-9_-]+)$/)
  if (img) {
    if (!ids.looksValid(img[1])) { json(res, 404, { error: 'not found' }); return true }
    const row = await db.get(
      `SELECT i.file_path, i.widths FROM story_images i
         JOIN stories s ON s.id = i.story_id
        WHERE i.public_id = ? AND s.status = 'published'`, [img[1]])
    if (!row) { json(res, 404, { error: 'not found' }); return true }
    const want = Number(url.searchParams.get('w')) || 800
    const have = String(row.widths || '').split(',').filter(Boolean).map(Number)
    const pick = have.includes(want) ? want : have[have.length - 1]
    const file = pick ? images.variantPath(row.file_path, pick) : row.file_path
    const data = upload.readSaved(file) || upload.readSaved(row.file_path)
    if (!data) { json(res, 404, { error: 'not found' }); return true }
    const ext = pick ? 'webp' : row.file_path.split('.').pop()
    res.writeHead(200, {
      'content-type': ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=31536000, immutable',
    })
    res.end(data)
    return true
  }

  json(res, 404, { error: 'not found' })
  return true
}

module.exports = { handle }
