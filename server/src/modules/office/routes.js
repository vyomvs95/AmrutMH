'use strict'
/* Signing in and out, the home screen, your own account. */
const db = require('../../core/db')
const auth = require('../../core/auth')
const { send, redirect, readBody, clientIp, audit } = require('../../core/http')
const V = require('./views')
const editorial = require('../editorial/routes')
const advertising = require('../advertising/routes')

const LOGIN_TRIES = 8
const LOGIN_WINDOW = 15 * 60 * 1000
const tries = new Map()

async function handleAnonymous({ req, res, route, user, csrf, setCsrf, withCsrf, B }) {
  if (route === '/login' && req.method === 'GET') {
    if (user) { redirect(res, B + '/dashboard'); return true }
    send(res, 200, V.signIn({ csrf }), withCsrf())
    return true
  }

  if (route === '/login' && req.method === 'POST') {
    const form = await readBody(req).catch(() => null)
    if (!form || !auth.csrfOk(csrf, form.get('_csrf'))) {
      send(res, 200, V.signIn({ csrf, error: 'फॉर्म कालबाह्य झाला. पुन्हा प्रयत्न करा. (session expired)' }), withCsrf())
      return true
    }
    const email = (form.get('email') || '').trim().toLowerCase()
    const password = form.get('password') || ''
    const ip = clientIp(req)
    const key = email + '|' + ip
    const rec = tries.get(key)
    if (rec && rec.n >= LOGIN_TRIES && Date.now() - rec.at < LOGIN_WINDOW) {
      await audit(null, 'login.blocked', email, 'too many attempts', ip)
      send(res, 429, V.signIn({ csrf, email, error: 'खूप वेळा प्रयत्न झाले. थोड्या वेळाने पुन्हा करा. (too many attempts)' }), withCsrf())
      return true
    }

    const row = await db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email])
    if (!row || !auth.verifyPassword(password, row.password_hash)) {
      tries.set(key, { n: (rec && Date.now() - rec.at < LOGIN_WINDOW ? rec.n : 0) + 1, at: Date.now() })
      await audit(row?.id ?? null, 'login.failed', email, null, ip)
      send(res, 401, V.signIn({ csrf, email, error: 'ईमेल किंवा पासवर्ड चुकीचा आहे. (incorrect e-mail or password)' }), withCsrf())
      return true
    }

    tries.delete(key)
    await db.run('UPDATE users SET last_login_at = ? WHERE id = ?', [new Date().toISOString(), row.id])
    await audit(row.id, 'login.ok', email, null, ip)
    redirect(res, B + '/dashboard', {
      'set-cookie': [].concat(
        auth.cookieHeader(auth.SESSION_COOKIE, auth.makeSession(row.id), { maxAge: auth.SESSION_HOURS * 3600 }),
        setCsrf || []),
    })
    return true
  }

  if (route === '/logout' && req.method === 'POST') {
    const form = await readBody(req).catch(() => null)
    if (user && form && auth.csrfOk(csrf, form.get('_csrf'))) await audit(user.id, 'logout', null, null, clientIp(req))
    redirect(res, B + '/login', { 'set-cookie': auth.cookieHeader(auth.SESSION_COOKIE, '', { clear: true }) })
    return true
  }
  return false
}

async function handle(ctx) {
  const { res, route, user, withCsrf } = ctx
  if (route === '/' || route === '/dashboard') {
    const counts = await editorial.summary(user)
    const ads = await advertising.summary(user)
    send(res, 200, V.dashboard({ user, counts, ads, scope: user.place }), withCsrf())
    return true
  }
  if (route === '/account') {
    send(res, 200, V.account({ user, row: user }), withCsrf())
    return true
  }
  return false
}

module.exports = { handle, handleAnonymous, views: V }
