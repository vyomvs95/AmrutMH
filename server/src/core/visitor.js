'use strict'
/* Telling one reader from another, without keeping anything about them.
 *
 * A visitor becomes a short hash of their address and browser, mixed with a
 * secret that is re-made every day. Two consequences, both deliberate:
 *   - the same person is counted once a day per story, so "uniques" means
 *     something;
 *   - tomorrow their hash is different, so nobody - including us - can follow
 *     a reader from one day to the next.
 *
 * No address, no browser string and no identifier is ever written down.
 */

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
