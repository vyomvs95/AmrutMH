'use strict'
/* Every figure on the dashboard comes from here, so there is one definition of each. */

const db = require('../../core/db')

/* Marathi alphabetical order. */
const MR = db.isPg ? ' COLLATE "mr-IN-x-icu"' : ''

/* Sorting only ever happens through these maps, so a column name can never arrive from. */
const order = (map, sort, fallback) => {
  const col = map[sort] || map[fallback]
  return col
}
const dirOf = (dir) => (dir === 'asc' ? 'ASC' : 'DESC')

/* One shape for every story-view query, office stories and archive alike. */
const BASE = `
  SELECT vd.subject, vd.day, vd.views, vd.uniques,
         COALESCE(s.title, l.title, vd.subject)        AS title,
         COALESCE(ds.id, dl.id)                        AS district_id,
         COALESCE(ds.name_mr, dl.name_mr, '—')         AS district_mr,
         COALESCE(ds.division_id, dl.division_id)      AS division_id,
         COALESCE(se.name_mr, lse.name_mr, l.cat, '—') AS section_mr,
         COALESCE(se.id, lse.id, 0)                    AS section_id,
         CASE WHEN s.id IS NULL THEN 'archive' ELSE 'office' END AS source,
         COALESCE(se.slug, lse.slug, l.cat)            AS cat_slug,
         l.image_path                                  AS archive_image,
         (SELECT i.public_id FROM story_images i
           WHERE i.story_id = s.id ORDER BY i.sort_order, i.id LIMIT 1) AS office_image
    FROM view_daily vd
    LEFT JOIN stories        s  ON s.public_id = vd.subject
    LEFT JOIN districts      ds ON ds.id = s.district_id
    LEFT JOIN sections       se ON se.id = s.section_id
    LEFT JOIN legacy_stories l  ON l.id = vd.subject
    LEFT JOIN sections       lse ON lse.slug = l.cat OR lse.key_en = l.cat
    LEFT JOIN districts      dl ON LOWER(REPLACE(dl.name_en, ' ', '_')) = l.district_en
   WHERE vd.subject_kind = 'story' AND vd.day >= ? AND vd.day <= ?`

/* What this person is allowed to count, and what they asked to narrow it to. */
function filters(user, f) {
  const where = []
  const params = []
  if (user.role === 'district') { where.push('district_id = ?'); params.push(user.district_id) }
  else if (user.role === 'divisional') { where.push('division_id = ?'); params.push(user.division_id) }
  else if (f.district) { where.push('district_id = ?'); params.push(Number(f.district)) }
  if (f.section) { where.push('section_id = ?'); params.push(Number(f.section)) }
  if (f.source) { where.push('source = ?'); params.push(f.source) }
  return { sql: where.length ? ' WHERE ' + where.join(' AND ') : '', params }
}

const scoped = (user, f) => {
  const w = filters(user, f)
  return { sql: `WITH v AS (${BASE}) SELECT`, from: ` FROM v${w.sql}`, params: [f.from, f.to, ...w.params] }
}

async function totals(user, f) {
  const q = scoped(user, f)
  const r = await db.get(`${q.sql} COALESCE(SUM(views),0) AS views, COALESCE(SUM(uniques),0) AS uniques,
                          COUNT(DISTINCT subject) AS stories${q.from}`, q.params)
  return { views: Number(r.views), uniques: Number(r.uniques), stories: Number(r.stories) }
}

async function byDay(user, f) {
  const q = scoped(user, f)
  const rows = await db.all(`${q.sql} day, SUM(views) AS views, SUM(uniques) AS uniques${q.from}
                             GROUP BY day ORDER BY day`, q.params)
  return rows.map((r) => ({ day: r.day, views: Number(r.views), uniques: Number(r.uniques) }))
}

const GROUP_SORTS = {
  name: `name${MR}`, views: 'SUM(views)', uniques: 'SUM(uniques)', stories: 'COUNT(DISTINCT subject)',
}

async function byDistrict(user, f, sort = {}) {
  const q = scoped(user, f)
  const by = order(GROUP_SORTS, sort.key, 'views').replace('name', 'district_mr')
  const rows = await db.all(`${q.sql} district_mr, SUM(views) AS views, SUM(uniques) AS uniques,
                             COUNT(DISTINCT subject) AS stories${q.from}
                             GROUP BY district_mr ORDER BY ${by} ${dirOf(sort.dir)} LIMIT 40`, q.params)
  return rows.map((r) => ({ name: r.district_mr, views: Number(r.views), uniques: Number(r.uniques), stories: Number(r.stories) }))
}

async function bySection(user, f, sort = {}) {
  const q = scoped(user, f)
  const by = order(GROUP_SORTS, sort.key, 'views').replace('name', 'section_mr')
  const rows = await db.all(`${q.sql} section_mr, SUM(views) AS views, SUM(uniques) AS uniques,
                             COUNT(DISTINCT subject) AS stories${q.from}
                             GROUP BY section_mr ORDER BY ${by} ${dirOf(sort.dir)} LIMIT 40`, q.params)
  return rows.map((r) => ({ name: r.section_mr, views: Number(r.views), uniques: Number(r.uniques), stories: Number(r.stories) }))
}

const STORY_SORTS = {
  title: `title${MR}`, district: `district_mr${MR}`, section: `section_mr${MR}`,
  views: 'SUM(views)', uniques: 'SUM(uniques)',
}

/* The most-read list, a page at a time, searchable by headline. Returns the rows plus. */
async function topStories(user, f, opts = {}) {
  const page = Math.max(1, Number(opts.page) || 1)
  const perPage = Math.min(100, Math.max(5, Number(opts.perPage) || 10))
  const q = scoped(user, f)
  const params = [...q.params]
  let where = q.from                                  // ' FROM v' or ' FROM v WHERE ...'
  if (opts.q) {
    where += (where.includes('WHERE') ? ' AND ' : ' WHERE ') + 'LOWER(title) LIKE LOWER(?)'
    params.push('%' + String(opts.q).slice(0, 80) + '%')
  }

  const counted = await db.get(
    `WITH v AS (${BASE}) SELECT COUNT(*) AS n FROM (SELECT subject${where} GROUP BY subject) z`, params)
  const total = Number(counted.n)

  const by = order(STORY_SORTS, opts.key || opts.sort, 'views')
  const rows = await db.all(`${q.sql} subject, title, district_mr, section_mr, source,
                             cat_slug, archive_image, office_image,
                             SUM(views) AS views, SUM(uniques) AS uniques${where}
                             GROUP BY subject, title, district_mr, section_mr, source,
                                      cat_slug, archive_image, office_image
                             ORDER BY ${by} ${dirOf(opts.dir)} LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
                            params)
  return {
    rows: rows.map((r) => ({
      id: r.subject, title: r.title, district: r.district_mr, section: r.section_mr,
      source: r.source, catSlug: r.cat_slug, archiveImage: r.archive_image, officeImage: r.office_image,
      views: Number(r.views), uniques: Number(r.uniques),
    })),
    total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)),
  }
}

/* How many stories were published in the window - a different question from how many were. */
async function publishedCount(user, f) {
  const where = ['s.status = ?', 's.published_at >= ?', 's.published_at <= ?']
  const params = ['published', f.from, f.to + 'T23:59:59']
  if (user.role === 'district') { where.push('s.district_id = ?'); params.push(user.district_id) }
  else if (user.role === 'divisional') { where.push('d.division_id = ?'); params.push(user.division_id) }
  else if (f.district) { where.push('s.district_id = ?'); params.push(Number(f.district)) }
  if (f.section) { where.push('s.section_id = ?'); params.push(Number(f.section)) }
  const r = await db.get(
    `SELECT COUNT(*) AS n FROM stories s LEFT JOIN districts d ON d.id = s.district_id
      WHERE ${where.join(' AND ')}`, params)
  return Number(r.n)
}

/* Advertisements: how often shown, how often clicked, and what came in. */
const AD_SORTS = {
  advertiser: `a.advertiser_name${MR}`, slot: `sl.name_mr${MR}`,
  shown: 'SUM(vd.views)', reach: 'SUM(vd.uniques)', clicks: 'SUM(vd.clicks)',
}

async function ads(user, f, sort = {}) {
  const where = ['vd.subject_kind = ?', 'vd.day >= ?', 'vd.day <= ?']
  const params = ['ad', f.from, f.to]
  if (user.role === 'district') { where.push('a.district_id = ?'); params.push(user.district_id) }
  else if (user.role === 'divisional') { where.push('d.division_id = ?'); params.push(user.division_id) }
  else if (f.district) { where.push('a.district_id = ?'); params.push(Number(f.district)) }
  const rows = await db.all(
    `SELECT a.public_id, a.advertiser_name, a.amount_inr, a.status, sl.name_mr AS slot_mr,
            d.name_mr AS district_mr,
            SUM(vd.views) AS shown, SUM(vd.uniques) AS reach, SUM(vd.clicks) AS clicks
       FROM view_daily vd
       JOIN ads a       ON a.public_id = vd.subject
       LEFT JOIN ad_slots sl ON sl.id = a.slot_id
       LEFT JOIN districts d ON d.id = a.district_id
      WHERE ${where.join(' AND ')}
      GROUP BY a.public_id, a.advertiser_name, a.amount_inr, a.status, sl.name_mr, d.name_mr
      ORDER BY ${order(AD_SORTS, sort.key, 'shown')} ${dirOf(sort.dir)} LIMIT 40`, params)
  return rows.map((r) => ({
    id: r.public_id, advertiser: r.advertiser_name, slot: r.slot_mr, district: r.district_mr,
    status: r.status, amount: Number(r.amount_inr),
    shown: Number(r.shown), reach: Number(r.reach), clicks: Number(r.clicks),
  }))
}

async function money(user, f) {
  const where = ['p.confirmed_at IS NOT NULL', 'p.received_on >= ?', 'p.received_on <= ?']
  const params = [f.from, f.to]
  if (user.role === 'district') { where.push('a.district_id = ?'); params.push(user.district_id) }
  else if (user.role === 'divisional') { where.push('d.division_id = ?'); params.push(user.division_id) }
  else if (f.district) { where.push('a.district_id = ?'); params.push(Number(f.district)) }
  const r = await db.get(
    `SELECT COALESCE(SUM(p.amount_inr),0) AS n FROM ad_payments p
       JOIN ads a ON a.id = p.ad_id
       LEFT JOIN districts d ON d.id = a.district_id
      WHERE ${where.join(' AND ')}`, params)
  return Number(r.n)
}

module.exports = { totals, byDay, byDistrict, bySection, topStories, publishedCount, ads, money }
