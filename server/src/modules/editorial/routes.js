'use strict'
/* Everything to do with a story: writing it, the review it goes through, and
   the photographs attached to it. */

const db = require('../../core/db')
const ids = require('../../core/ids')
const auth = require('../../core/auth')
const upload = require('../../core/upload')
const images = require('../../core/images')
const { send, redirect, readBody, clientIp, audit } = require('../../core/http')
const V = require('./views')
const T = require('../../shared/table')
const office = require('../office/views')

const notFound = (res) => send(res, 404, office.notFound())

/* ---------- who may see and do what ---------- */

function scopeClause(user) {
  if (user.role === 'district') return { sql: ' WHERE s.district_id = ?', params: [user.district_id] }
  if (user.role === 'divisional') {
    return { sql: ' WHERE s.district_id IN (SELECT id FROM districts WHERE division_id = ?)', params: [user.division_id] }
  }
  return { sql: '', params: [] }
}

function maySee(user, story) {
  if (user.role === 'editor') return true
  if (user.role === 'district') return story.district_id === user.district_id
  return story.district_division_id === user.division_id
}

function abilities(user, story) {
  const mine = user.role === 'district' && story.district_id === user.district_id
  return {
    edit: (mine && ['draft', 'returned'].includes(story.status)) || user.role === 'editor',
    submit: mine && ['draft', 'returned'].includes(story.status),
    approve: user.role === 'divisional' && story.status === 'submitted',
    return: (user.role === 'divisional' && story.status === 'submitted') ||
            (user.role === 'editor' && ['submitted', 'approved'].includes(story.status)),
    publish: user.role === 'editor' && ['submitted', 'approved'].includes(story.status),
  }
}

function checkStory(f) {
  if (!f || !String(f.title || '').trim()) return 'शीर्षक आवश्यक आहे. (a headline is needed)'
  if (!String(f.body || '').trim()) return 'बातमीचा मजकूर आवश्यक आहे. (the story cannot be empty)'
  if (!Number(f.section_id)) return 'विभाग निवडा. (choose a section)'
  return null
}

const STORY_SELECT = `
  SELECT s.*, d.name_mr AS district_mr, d.division_id AS district_division_id,
         se.name_mr AS section_mr, a.name AS author_name
    FROM stories s
    LEFT JOIN districts d  ON d.id  = s.district_id
    LEFT JOIN sections  se ON se.id = s.section_id
    LEFT JOIN users     a  ON a.id  = s.author_id`

const loadStory = (token) => db.get(STORY_SELECT + ' WHERE s.public_id = ?', [token])

/* Sorting only ever happens through this map, so nothing from the address bar
   reaches the query. Names sort in Marathi order. */
const MR = db.isPg ? ' COLLATE "mr-IN-x-icu"' : ''
const STORY_SORTS = {
  title: `s.title${MR}`, district: `d.name_mr${MR}`, section: `se.name_mr${MR}`,
  status: 's.status', updated: 's.updated_at',
}

async function listStories(user, { extra = '', sort = {}, page = 1, perPage = 10, q = '' } = {}) {
  const { sql, params } = scopeClause(user)
  let where = sql ? sql + extra : (extra ? ' WHERE 1=1' + extra : '')
  const args = [...params]
  if (q) {
    where += (where.includes('WHERE') ? ' AND ' : ' WHERE ') + 'LOWER(s.title) LIKE LOWER(?)'
    args.push('%' + String(q).slice(0, 80) + '%')
  }
  const counted = await db.get(
    `SELECT COUNT(*) AS n FROM stories s
       LEFT JOIN districts d ON d.id = s.district_id
       LEFT JOIN sections se ON se.id = s.section_id${where}`, args)
  const total = Number(counted.n)
  const by = STORY_SORTS[sort.key] || STORY_SORTS.updated
  const dir = sort.dir === 'asc' ? 'ASC' : 'DESC'
  const rows = await db.all(
    `${STORY_SELECT}${where} ORDER BY ${by} ${dir} LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`, args)
  return { rows, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) }
}

async function savePhotos(storyId, files) {
  let n = Number((await db.get('SELECT COUNT(*) AS c FROM story_images WHERE story_id = ?', [storyId])).c)
  for (const f of files) {
    const saved = upload.save(f)
    let made = { widths: [], width: null, height: null }
    try { made = await images.makeVariants(saved.filePath) } catch (e) { console.error('[resize]', e.message) }
    await db.run(
      `INSERT INTO story_images (public_id, story_id, file_path, widths, img_w, img_h, sort_order, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [saved.publicId, storyId, saved.filePath, made.widths.join(','), made.width, made.height, n++, new Date().toISOString()])
  }
}

/** Numbers for the home screen. */
async function summary(user) {
  const { sql, params } = scopeClause(user)
  const rows = await db.all(`SELECT status, COUNT(*) AS n FROM stories s${sql} GROUP BY status`, params)
  const counts = {}
  for (const r of rows) counts[r.status] = Number(r.n)
  return counts
}

/* ---------- the pages ---------- */

async function handle(ctx) {
  const { req, res, route, url, user, csrf, withCsrf, B } = ctx

  if (route === '/stories') {
    const sort = T.readSort(url, 't_', Object.keys(STORY_SORTS), 'updated')
    const page = Math.max(1, Number(url.searchParams.get('t_page')) || 1)
    const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
    const found = await listStories(user, { sort, page, q })
    send(res, 200, V.list({
      user, ...found, url, sort, q, scope: user.place, heading: 'बातम्या', blurb: 'Stories',
      empty: ['अजून एकही बातमी नाही', user.role === 'district'
        ? 'वरील बटणावर टिचकी मारून पहिली बातमी लिहा.'
        : 'जिल्हा समन्वयकांनी बातमी लिहिल्यावर ती इथे दिसेल.'],
    }), withCsrf())
    return true
  }

  if (route === '/review') {
    if (user.role === 'district') { notFound(res); return true }
    const want = user.role === 'editor' ? "('submitted','approved')" : "('submitted')"
    const sort = T.readSort(url, 't_', Object.keys(STORY_SORTS), 'updated')
    const page = Math.max(1, Number(url.searchParams.get('t_page')) || 1)
    const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
    const found = await listStories(user, { extra: ` AND s.status IN ${want}`, sort, page, q })
    send(res, 200, V.list({
      user, ...found, url, sort, q, scope: user.place, heading: 'तपासणीसाठी', blurb: 'Awaiting your review',
      empty: ['तपासणीसाठी काहीही नाही', 'पाठवलेल्या बातम्या इथे दिसतील.'],
    }), withCsrf())
    return true
  }

  if (route === '/stories/new') {
    if (user.role !== 'district') { notFound(res); return true }
    const sections = await db.all('SELECT id, name_mr FROM sections ORDER BY sort_order')
    if (req.method === 'GET') { send(res, 200, V.form({ user, sections }), withCsrf()); return true }

    let got
    try { got = await upload.parse(req) } catch (e) {
      send(res, 400, V.form({ user, sections, error: e.message }), withCsrf()); return true
    }
    if (!auth.csrfOk(csrf, got.fields._csrf)) { notFound(res); return true }
    const bad = checkStory(got.fields)
    if (bad) { send(res, 400, V.form({ user, sections, error: bad, story: got.fields }), withCsrf()); return true }

    const now = new Date().toISOString()
    const publicId = ids.newPublicId()
    const ins = await db.insert(
      `INSERT INTO stories (public_id, title, body, section_id, district_id, author_id, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,'draft',?,?)`,
      [publicId, got.fields.title.trim(), got.fields.body.trim(), Number(got.fields.section_id),
       user.district_id, user.id, now, now])
    await savePhotos(ins.id, got.files)
    await audit(user.id, 'story.create', publicId, null, clientIp(req))
    redirect(res, B + '/stories/' + publicId)
    return true
  }

  const m = route.match(/^\/stories\/([A-Za-z0-9_-]+)(\/(edit|submit|approve|return|publish))?$/)
  if (m) {
    const token = m[1]
    const action = m[3] || null
    if (!ids.looksValid(token)) { notFound(res); return true }
    const story = await loadStory(token)
    if (!story || !maySee(user, story)) { notFound(res); return true }
    const can = abilities(user, story)
    const photos = await db.all('SELECT public_id FROM story_images WHERE story_id = ? ORDER BY sort_order, id', [story.id])

    if (!action && req.method === 'GET') { send(res, 200, V.view({ user, story, photos, can }), withCsrf()); return true }

    if (action === 'edit') {
      if (!can.edit) { notFound(res); return true }
      const sections = await db.all('SELECT id, name_mr FROM sections ORDER BY sort_order')
      if (req.method === 'GET') { send(res, 200, V.form({ user, story, sections, photos }), withCsrf()); return true }
      let got
      try { got = await upload.parse(req) } catch (e) {
        send(res, 400, V.form({ user, story, sections, photos, error: e.message }), withCsrf()); return true
      }
      if (!auth.csrfOk(csrf, got.fields._csrf)) { notFound(res); return true }
      const bad = checkStory(got.fields)
      if (bad) { send(res, 400, V.form({ user, story: { ...story, ...got.fields }, sections, photos, error: bad }), withCsrf()); return true }
      await db.run('UPDATE stories SET title = ?, body = ?, section_id = ?, updated_at = ? WHERE id = ?',
        [got.fields.title.trim(), got.fields.body.trim(), Number(got.fields.section_id), new Date().toISOString(), story.id])
      await savePhotos(story.id, got.files)
      await audit(user.id, 'story.edit', token, null, clientIp(req))
      redirect(res, B + '/stories/' + token)
      return true
    }

    if (req.method !== 'POST') { notFound(res); return true }
    const form = await readBody(req).catch(() => null)
    if (!form || !auth.csrfOk(csrf, form.get('_csrf'))) { notFound(res); return true }
    const now = new Date().toISOString()

    if (action === 'submit' && can.submit) {
      await db.run('UPDATE stories SET status = ?, submitted_at = ?, updated_at = ?, review_note = NULL WHERE id = ?',
        ['submitted', now, now, story.id])
    } else if (action === 'approve' && can.approve) {
      await db.run('UPDATE stories SET status = ?, reviewed_by = ?, updated_at = ?, review_note = NULL WHERE id = ?',
        ['approved', user.id, now, story.id])
    } else if (action === 'return' && can.return) {
      await db.run('UPDATE stories SET status = ?, reviewed_by = ?, review_note = ?, updated_at = ? WHERE id = ?',
        ['returned', user.id, (form.get('note') || '').slice(0, 500), now, story.id])
    } else if (action === 'publish' && can.publish) {
      await db.run('UPDATE stories SET status = ?, reviewed_by = ?, published_at = ?, updated_at = ? WHERE id = ?',
        ['published', user.id, now, now, story.id])
    } else { notFound(res); return true }

    await audit(user.id, 'story.' + action, token, null, clientIp(req))
    redirect(res, B + '/stories/' + token)
    return true
  }

  const img = route.match(/^\/img\/([A-Za-z0-9_-]+)$/)
  if (img) {
    if (!ids.looksValid(img[1])) { notFound(res); return true }
    const row = await db.get(
      `SELECT i.file_path, i.widths, s.district_id, d.division_id AS district_division_id
         FROM story_images i
         JOIN stories s ON s.id = i.story_id
         LEFT JOIN districts d ON d.id = s.district_id
        WHERE i.public_id = ?`, [img[1]])
    if (!row || !maySee(user, row)) { notFound(res); return true }
    const want = Number(url.searchParams.get('w')) || 400
    const have = String(row.widths || '').split(',').filter(Boolean).map(Number)
    const pick = have.includes(want) ? want : have[have.length - 1]
    const file = pick ? images.variantPath(row.file_path, pick) : row.file_path
    const data = upload.readSaved(file) || upload.readSaved(row.file_path)
    if (!data) { notFound(res); return true }
    const ext = pick ? 'webp' : row.file_path.split('.').pop()
    send(res, 200, data, {
      'content-type': ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg',
      'cache-control': 'private, max-age=3600',
    })
    return true
  }

  return false
}

module.exports = { handle, summary, scopeClause, maySee }
