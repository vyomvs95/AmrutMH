'use strict'
/* The scrolling band under the portal's navigation. */

const db = require('../../core/db')
const ids = require('../../core/ids')
const auth = require('../../core/auth')
const { send, redirect, readBody, clientIp, audit } = require('../../core/http')
const V = require('./views')
const office = require('../office/views')

const notFound = (res) => send(res, 404, office.notFound())
const all = () => db.all('SELECT * FROM ticker_items ORDER BY position, id')

async function renumber() {
  const rows = await all()
  let i = 1
  for (const r of rows) await db.run('UPDATE ticker_items SET position = ? WHERE id = ?', [i++, r.id])
}

async function handle(ctx) {
  const { req, res, route, url, user, csrf, withCsrf, B } = ctx
  if (!route.startsWith('/ticker')) return false
  if (user.role !== 'editor') { notFound(res); return true }

  if (route === '/ticker' && req.method === 'GET') {
    send(res, 200, V.list({
      user, items: await all(),
      editing: url.searchParams.get('edit') || null,
      saved: url.searchParams.get('saved') === '1',
    }), withCsrf())
    return true
  }

  if (req.method !== 'POST') { notFound(res); return true }
  const form = await readBody(req).catch(() => null)
  if (!form || !auth.csrfOk(csrf, form.get('_csrf'))) { notFound(res); return true }

  /* reorder: either a dragged list of addresses, or one line nudged up or down. */
  if (route === '/ticker/reorder') {
    const order = form.get('order')
    if (order) {
      const wanted = order.split(',').filter((x) => ids.looksValid(x))
      let i = 1
      for (const publicId of wanted) {
        await db.run('UPDATE ticker_items SET position = ? WHERE public_id = ?', [i++, publicId])
      }
    } else {
      const move = form.get('move')
      const dir = form.get('dir')
      if (!ids.looksValid(move) || !['up', 'down'].includes(dir)) { notFound(res); return true }
      const rows = await all()
      const at = rows.findIndex((r) => r.public_id === move)
      const to = dir === 'up' ? at - 1 : at + 1
      if (at === -1 || to < 0 || to >= rows.length) { redirect(res, B + '/ticker'); return true }
      const a = rows[at], b = rows[to]
      await db.run('UPDATE ticker_items SET position = ? WHERE id = ?', [b.position, a.id])
      await db.run('UPDATE ticker_items SET position = ? WHERE id = ?', [a.position, b.id])
    }
    await renumber()
    await audit(user.id, 'ticker.reorder', null, null, clientIp(req))
    redirect(res, B + '/ticker?saved=1')
    return true
  }

  const m = route.match(/^\/ticker\/([A-Za-z0-9_-]+)\/save$/)
  if (m) {
    if (!ids.looksValid(m[1])) { notFound(res); return true }
    const row = await db.get('SELECT id FROM ticker_items WHERE public_id = ?', [m[1]])
    if (!row) { notFound(res); return true }
    const text = (form.get('text_mr') || '').trim().slice(0, 160)
    if (!text) { redirect(res, B + '/ticker?edit=' + m[1]); return true }
    /* A link may point inside the portal (/govet-schemes) or at a full address. Anything else. */
    let link = (form.get('link_url') || '').trim().slice(0, 400)
    if (link && !/^(\/[^\s]*|https?:\/\/[^\s]+)$/i.test(link)) link = ''
    await db.run(
      'UPDATE ticker_items SET text_mr = ?, link_url = ?, is_active = ?, updated_at = ?, updated_by = ? WHERE id = ?',
      [text, link || null, form.get('is_active') ? 1 : 0, new Date().toISOString(), user.id, row.id])
    await audit(user.id, 'ticker.save', m[1], text.slice(0, 60), clientIp(req))
    redirect(res, B + '/ticker?saved=1')
    return true
  }

  notFound(res)
  return true
}

module.exports = { handle }
