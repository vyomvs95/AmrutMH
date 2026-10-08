'use strict'
/* Unguessable page addresses. */

const crypto = require('node:crypto')

const RAND_CHARS = 22   // 16 bytes in base64url
const SUM_CHARS = 6

const checksum = (random) =>
  crypto.createHash('sha256').update('amrut:' + random).digest('base64url').slice(0, SUM_CHARS)

function newPublicId() {
  const random = crypto.randomBytes(16).toString('base64url')
  return random + checksum(random)
}

/* Cheap sanity check before any database work. */
function looksValid(id) {
  if (typeof id !== 'string' || id.length !== RAND_CHARS + SUM_CHARS) return false
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return false
  const random = id.slice(0, RAND_CHARS)
  const given = Buffer.from(id.slice(RAND_CHARS))
  const want = Buffer.from(checksum(random))
  return given.length === want.length && crypto.timingSafeEqual(given, want)
}

module.exports = { newPublicId, looksValid }
