'use strict'
/* Sending a reply, reading a form, writing to the audit record. */

const db = require('./db')

const SAFE_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'same-origin',
  'cache-control': 'no-store',
}

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...SAFE_HEADERS, ...headers })
  res.end(body)
}

const redirect = (res, to, headers = {}) => { res.writeHead(302, { location: to, ...headers }); res.end() }

const MAX_BODY = 1024 * 1024

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const parts = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); return }
      parts.push(c)
    })
    req.on('end', () => resolve(new URLSearchParams(Buffer.concat(parts).toString('utf8'))))
    req.on('error', reject)
  })
}

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || ''

async function audit(userId, action, target, detail, ip) {
  await db.run(
    'INSERT INTO audit_log (user_id, action, target, detail, ip, created_at) VALUES (?,?,?,?,?,?)',
    [userId ?? null, action, target ?? null, detail ?? null, ip ?? null, new Date().toISOString()])
}

module.exports = { send, redirect, readBody, clientIp, audit, MAX_BODY }
