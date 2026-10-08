'use strict'
/* The front door. */

const fs = require('node:fs')
const path = require('node:path')
const config = require('./core/config')
const db = require('./core/db')
const auth = require('./core/auth')
const { send } = require('./core/http')

const publicApi = require('./modules/publicapi/routes')
const office = require('./modules/office/routes')
const editorial = require('./modules/editorial/routes')
const people = require('./modules/people/routes')
const advertising = require('./modules/advertising/routes')
const analytics = require('./modules/analytics/routes')
const ticker = require('./modules/ticker/routes')

const B = config.basePath
const notFound = (res) => send(res, 404, office.views.notFound())

async function currentUser(cookies) {
  const session = auth.readSession(cookies[auth.SESSION_COOKIE])
  if (!session) return null
  const row = await db.get(
    `SELECT u.*, d.name_mr AS district_mr, dv.name_mr AS division_mr,
            COALESCE(d.name_mr, dv.name_mr, 'मुख्य कार्यालय') AS place
       FROM users u
       LEFT JOIN districts d  ON d.id  = u.district_id
       LEFT JOIN divisions dv ON dv.id = u.division_id
      WHERE u.id = ? AND u.is_active = 1`, [session.uid])
  if (!row) return null
  if (row.role === 'divisional' && row.division_mr) row.place = row.division_mr + ' विभाग'
  return row
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  let route = url.pathname
  const cookies = auth.parseCookies(req.headers.cookie)

  /* open to anyone. */
  if (route.startsWith('/api/')) { await publicApi.handle(req, res, route, url); return }
  if (route === '/' || route === '') return send(res, 302, '', { location: B + '/dashboard' })
  if (route === B + '/health') {
    return send(res, 200, JSON.stringify({ ok: true, database: db.label }), { 'content-type': 'application/json' })
  }
  if (route === B + '/style.css') {
    return send(res, 200, fs.readFileSync(path.join(__dirname, 'public', 'office.css')),
      { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=600' })
  }
  if (!route.startsWith(B)) return notFound(res)
  route = route.slice(B.length) || '/'

  /* the form-protection cookie. */
  let csrf = cookies[auth.CSRF_COOKIE]
  let setCsrf = null
  if (!csrf) { csrf = auth.newCsrf(); setCsrf = auth.cookieHeader(auth.CSRF_COOKIE, csrf, { maxAge: 86400 }) }
  const withCsrf = (h = {}) => (setCsrf ? { ...h, 'set-cookie': [].concat(h['set-cookie'] || [], setCsrf) } : h)

  const user = await currentUser(cookies)
  const ctx = { req, res, route, url, user, csrf, setCsrf, withCsrf, B }

  if (await office.handleAnonymous(ctx)) return
  if (!user) return send(res, 302, '', { location: B + '/login' })
  user.csrf = csrf

  for (const mod of [office, editorial, people, advertising, analytics, ticker]) {
    if (await mod.handle(ctx)) return
  }
  return notFound(res)
}

module.exports = { handle }
