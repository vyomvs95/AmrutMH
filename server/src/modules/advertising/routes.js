'use strict'
/* Advertising, sponsorship and payments.
 *
 * The flow is the one the client described on the call:
 *   a district coordinator sells a placement in the field and records it
 *     -> records the money taken, with a reference
 *     -> the head office checks the receipt and starts the advertisement
 *   and it stops on its own when its days are up.
 *
 * Taking money on the site itself (a payment gateway) plugs in at
 * recordPayment: the mode is already there as "gateway". Until AMRUT has a
 * merchant account, every other mode is recorded by hand - which is exactly
 * how the coordinators collect today.
 */

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
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

const AD_SELECT = `
  SELECT a.*, sl.name_mr AS slot_mr, sl.code AS slot_code, sl.width_px, sl.height_px,
         d.name_mr AS district_mr, d.division_id AS district_division_id,
         c.name AS created_by_name
    FROM ads a
    LEFT JOIN ad_slots  sl ON sl.id = a.slot_id
    LEFT JOIN districts d  ON d.id  = a.district_id
    LEFT JOIN users     c  ON c.id  = a.created_by`

const MR = db.isPg ? ' COLLATE "mr-IN-x-icu"' : ''
const AD_SORTS = {
  advertiser: `a.advertiser_name${MR}`, slot: `sl.name_mr${MR}`, district: `d.name_mr${MR}`,
  amount: 'a.amount_inr', status: 'a.status', updated: 'a.updated_at',
}

function scope(user) {
  if (user.role === 'district') return { sql: ' WHERE a.district_id = ?', params: [user.district_id] }
  if (user.role === 'divisional') {
    return { sql: ' WHERE a.district_id IN (SELECT id FROM districts WHERE division_id = ?)', params: [user.division_id] }
  }
  return { sql: '', params: [] }
}

const maySee = (user, ad) =>
  user.role === 'editor' ||
  (user.role === 'district' && ad.district_id === user.district_id) ||
  (user.role === 'divisional' && ad.district_division_id === user.division_id)

function abilities(user, ad) {
  const mine = user.role === 'district' && ad.district_id === user.district_id
  return {
    recordPayment: mine && ['draft', 'rejected'].includes(ad.status),
    confirm: user.role === 'editor' && ad.status === 'submitted',
    reject: user.role === 'editor' && ad.status === 'submitted',
    stop: user.role === 'editor' && ad.status === 'live',
  }
}

/** Numbers for the home screen. Returns null when there is nothing to show. */
async function summary(user) {
  const { sql, params } = scope(user)
  const where = sql || ''
  const live = await db.get(`SELECT COUNT(*) AS n FROM ads a${where}${where ? ' AND' : ' WHERE'} a.status = 'live'`, params)
  const wait = await db.get(`SELECT COUNT(*) AS n FROM ads a${where}${where ? ' AND' : ' WHERE'} a.status = 'submitted'`, params)
  const earned = await db.get(
    `SELECT COALESCE(SUM(p.amount_inr),0) AS n FROM ad_payments p
       JOIN ads a ON a.id = p.ad_id${where} ${where ? 'AND' : 'WHERE'} p.confirmed_at IS NOT NULL`, params)
  const mine = user.role === 'district'
    ? await db.get('SELECT COUNT(*) AS n FROM ads a WHERE a.created_by = ?', [user.id]) : null
  return { live: Number(live.n), awaiting: Number(wait.n), earned: Number(earned.n), mine: mine ? Number(mine.n) : null }
}

/* Anything whose last day has passed stops counting as running. */
async function expireOld() {
  await db.run("UPDATE ads SET status = 'ended', updated_at = ? WHERE status = 'live' AND ends_on < ?",
    [new Date().toISOString(), today()])
}

async function handle(ctx) {
  const { req, res, route, url, user, csrf, withCsrf, B } = ctx
  if (!route.startsWith('/ads')) return false
  await expireOld()

  if (route === '/ads') {
    const { sql, params } = scope(user)
    const sort = T.readSort(url, 'a_', Object.keys(AD_SORTS), 'updated')
    const rows = await db.all(
      `${AD_SELECT}${sql} ORDER BY ${AD_SORTS[sort.key] || AD_SORTS.updated} ${sort.dir === 'asc' ? 'ASC' : 'DESC'} LIMIT 200`,
      params)
    send(res, 200, V.list({ user, rows, sort, url, scope: user.place }), withCsrf())
    return true
  }

  if (route === '/ads/rates') {
    const slots = await db.all('SELECT * FROM ad_slots WHERE is_active = 1 ORDER BY sort_order')
    for (const s of slots) s.rates = await db.all('SELECT days, amount_inr FROM ad_rates WHERE slot_id = ? ORDER BY days', [s.id])
    send(res, 200, V.rates({ user, slots }), withCsrf())
    return true
  }

  if (route === '/ads/new') {
    if (user.role !== 'district') { notFound(res); return true }
    const slots = await db.all('SELECT * FROM ad_slots WHERE is_active = 1 ORDER BY sort_order')
    if (req.method === 'GET') { send(res, 200, V.form({ user, slots }), withCsrf()); return true }

    let got
    try { got = await upload.parse(req) } catch (e) {
      send(res, 400, V.form({ user, slots, error: e.message }), withCsrf()); return true
    }
    if (!auth.csrfOk(csrf, got.fields._csrf)) { notFound(res); return true }
    const f = got.fields
    const slotId = Number(f.slot_id)
    const days = Number(f.days)
    if (!String(f.advertiser_name || '').trim() || !slotId || !days) {
      send(res, 400, V.form({ user, slots, ad: f, error: 'जाहिरातदार, जागा आणि कालावधी आवश्यक आहेत. (advertiser, placement and duration are needed)' }), withCsrf())
      return true
    }
    const rate = await db.get('SELECT amount_inr FROM ad_rates WHERE slot_id = ? AND days = ?', [slotId, days])
    if (!rate) {
      send(res, 400, V.form({ user, slots, ad: f, error: 'या जागेसाठी या कालावधीचा दर नाही. (no rate for that placement and duration)' }), withCsrf())
      return true
    }

    let image = { publicId: null, filePath: null, widths: '', w: null, h: null }
    const file = got.files[0]
    if (file) {
      const saved = upload.save(file)
      let made = { widths: [], width: null, height: null }
      try { made = await images.makeVariants(saved.filePath) } catch (e) { console.error('[resize]', e.message) }
      image = { publicId: saved.publicId, filePath: saved.filePath, widths: made.widths.join(','), w: made.width, h: made.height }
    }

    const now = new Date().toISOString()
    const publicId = ids.newPublicId()
    await db.run(
      `INSERT INTO ads (public_id, advertiser_name, advertiser_contact, slot_id, district_id, created_by,
                        days, amount_inr, target_url, status, image_public_id, image_path, image_widths,
                        image_w, image_h, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'draft',?,?,?,?,?,?,?)`,
      [publicId, f.advertiser_name.trim(), (f.advertiser_contact || '').trim() || null, slotId,
       user.district_id, user.id, days, rate.amount_inr, (f.target_url || '').trim() || null,
       image.publicId, image.filePath, image.widths, image.w, image.h, now, now])
    await audit(user.id, 'ad.create', publicId, `${rate.amount_inr} for ${days}d`, clientIp(req))
    redirect(res, B + '/ads/' + publicId)
    return true
  }

  /* the artwork, for staff */
  const imgMatch = route.match(/^\/ads\/img\/([A-Za-z0-9_-]+)$/)
  if (imgMatch) {
    if (!ids.looksValid(imgMatch[1])) { notFound(res); return true }
    const ad = await db.get(`${AD_SELECT} WHERE a.image_public_id = ?`, [imgMatch[1]])
    if (!ad || !maySee(user, ad)) { notFound(res); return true }
    const want = Number(url.searchParams.get('w')) || 800
    const have = String(ad.image_widths || '').split(',').filter(Boolean).map(Number)
    const pick = have.includes(want) ? want : have[have.length - 1]
    const data = upload.readSaved(pick ? images.variantPath(ad.image_path, pick) : ad.image_path) || upload.readSaved(ad.image_path)
    if (!data) { notFound(res); return true }
    send(res, 200, data, { 'content-type': pick ? 'image/webp' : 'image/jpeg', 'cache-control': 'private, max-age=3600' })
    return true
  }

  const m = route.match(/^\/ads\/([A-Za-z0-9_-]+)(\/(payment|confirm|reject|stop))?$/)
  if (m) {
    const token = m[1]
    const action = m[3] || null
    if (!ids.looksValid(token)) { notFound(res); return true }
    const ad = await db.get(`${AD_SELECT} WHERE a.public_id = ?`, [token])
    if (!ad || !maySee(user, ad)) { notFound(res); return true }
    const can = abilities(user, ad)

    if (!action && req.method === 'GET') {
      const payments = await db.all(
        `SELECT p.*, u.name AS confirmed_by_name FROM ad_payments p
           LEFT JOIN users u ON u.id = p.confirmed_by
          WHERE p.ad_id = ? ORDER BY p.id`, [ad.id])
      send(res, 200, V.view({ user, ad, payments, can }), withCsrf())
      return true
    }

    if (req.method !== 'POST') { notFound(res); return true }
    const form = await readBody(req).catch(() => null)
    if (!form || !auth.csrfOk(csrf, form.get('_csrf'))) { notFound(res); return true }
    const now = new Date().toISOString()

    if (action === 'payment' && can.recordPayment) {
      const amount = Math.max(0, Math.round(Number(form.get('amount')) || 0))
      if (!amount) { notFound(res); return true }
      await db.run(
        `INSERT INTO ad_payments (public_id, ad_id, amount_inr, mode, reference, received_on, recorded_by, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [ids.newPublicId(), ad.id, amount, (form.get('mode') || 'cash'),
         (form.get('reference') || '').slice(0, 120) || null, today(), user.id, now])
      await db.run("UPDATE ads SET status = 'submitted', review_note = NULL, updated_at = ? WHERE id = ?", [now, ad.id])
      await audit(user.id, 'ad.payment', token, String(amount), clientIp(req))
    } else if (action === 'confirm' && can.confirm) {
      await db.run('UPDATE ad_payments SET confirmed_by = ?, confirmed_at = ? WHERE ad_id = ? AND confirmed_at IS NULL',
        [user.id, now, ad.id])
      await db.run(
        "UPDATE ads SET status = 'live', starts_on = ?, ends_on = ?, live_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?",
        [today(), addDays(ad.days), now, user.id, now, ad.id])
      await audit(user.id, 'ad.confirm', token, null, clientIp(req))
    } else if (action === 'reject' && can.reject) {
      await db.run("UPDATE ads SET status = 'rejected', review_note = ?, reviewed_by = ?, updated_at = ? WHERE id = ?",
        [(form.get('note') || '').slice(0, 500), user.id, now, ad.id])
      await audit(user.id, 'ad.reject', token, null, clientIp(req))
    } else if (action === 'stop' && can.stop) {
      await db.run("UPDATE ads SET status = 'ended', ends_on = ?, updated_at = ? WHERE id = ?", [today(), now, ad.id])
      await audit(user.id, 'ad.stop', token, null, clientIp(req))
    } else { notFound(res); return true }

    redirect(res, B + '/ads/' + token)
    return true
  }

  return false
}

module.exports = { handle, summary, expireOld }
