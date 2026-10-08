'use strict'
/* Telling one reader from another, without keeping anything about them. */

const crypto = require('node:crypto')

let salt = { day: null, value: null }

const today = () => new Date().toISOString().slice(0, 10)

function daySalt() {
  const day = today()
  if (salt.day !== day) salt = { day, value: crypto.randomBytes(16).toString('hex') }
  return salt.value
}

function fingerprint(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || ''
  const ua = req.headers['user-agent'] || ''
  const lang = req.headers['accept-language'] || ''
  return crypto.createHash('sha256').update(`${daySalt()}|${ip}|${ua}|${lang}`).digest('base64url').slice(0, 22)
}

module.exports = { fingerprint, today }
