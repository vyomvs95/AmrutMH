'use strict'
/* Unguessable page addresses.
   ---------------------------------------------------------------
   Every row gets a public id such as  "k3Qp8vV1nR2sT7xWq0Ab9c4f2e".
   It is 16 random bytes (enough that guessing is hopeless) followed by a
   6-character checksum of those bytes.

   The checksum is NOT a security measure - the randomness is. It lets the
   server throw out a mistyped or invented address instantly, without going
   to the database. It uses no secret key on purpose: rotating a secret would
   otherwise invalidate every address already stored. */

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
