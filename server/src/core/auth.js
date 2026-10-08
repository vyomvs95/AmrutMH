'use strict'
/* Passwords, sign-in cookies and form protection.
   Uses only what Node ships with - nothing to install, nothing to audit. */

const crypto = require('node:crypto')
const config = require('./config')

const SESSION_COOKIE = 'amrut_office'
const CSRF_COOKIE = 'amrut_csrf'
const SESSION_HOURS = 12

/* ---------- passwords ---------- */

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('base64url')
  const key = crypto.scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 }).toString('base64url')
  return `scrypt$16384$8$1$${salt}$${key}`
}

function verifyPassword(plain, stored) {
  try {
    const [scheme, N, r, p, salt, key] = String(stored).split('$')
    if (scheme !== 'scrypt') return false
    const want = Buffer.from(key)
    const got = Buffer.from(
      crypto.scryptSync(plain, salt, 64, { N: Number(N), r: Number(r), p: Number(p) }).toString('base64url')
    )
    return want.length === got.length && crypto.timingSafeEqual(want, got)
  } catch { return false }
}

/* ---------- cookies ---------- */

function parseCookies(header = '') {
  const out = {}
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function cookieHeader(name, value, { maxAge = null, clear = false } = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, `Path=${config.basePath || '/'}`, 'HttpOnly', 'SameSite=Lax']
  if (config.secureCookies) bits.push('Secure')
  if (clear) bits.push('Max-Age=0')
  else if (maxAge) bits.push(`Max-Age=${maxAge}`)
  return bits.join('; ')
}

/* ---------- sign-in token ---------- */

const sign = (data) =>
  crypto.createHmac('sha256', config.sessionSecret).update(data).digest('base64url')

function makeSession(userId) {
  const body = Buffer.from(JSON.stringify({
    uid: userId,
    exp: Date.now() + SESSION_HOURS * 3600 * 1000,
  })).toString('base64url')
  return body + '.' + sign(body)
}

function readSession(raw) {
  if (!raw || typeof raw !== 'string') return null
  const dot = raw.lastIndexOf('.')
  if (dot < 1) return null
  const body = raw.slice(0, dot)
  const got = Buffer.from(raw.slice(dot + 1))
  const want = Buffer.from(sign(body))
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!data.uid || !data.exp || Date.now() > data.exp) return null
    return data
  } catch { return null }
}

/* ---------- form protection (CSRF) ----------
   A random value is kept in a cookie and repeated in a hidden field on every
   form. A page on another website cannot read the cookie, so it cannot forge
   a matching field. */

const newCsrf = () => crypto.randomBytes(16).toString('base64url')

function csrfOk(cookieValue, formValue) {
  if (!cookieValue || !formValue) return false
  const a = Buffer.from(String(cookieValue))
  const b = Buffer.from(String(formValue))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

module.exports = {
  SESSION_COOKIE, CSRF_COOKIE, SESSION_HOURS,
  hashPassword, verifyPassword,
  parseCookies, cookieHeader,
  makeSession, readSession,
  newCsrf, csrfOk,
}
