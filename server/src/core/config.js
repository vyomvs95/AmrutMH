'use strict'
/* Settings. Everything the office needs to know about WHERE it is running
   lives here, read from the .env file next to this folder. No code changes
   are needed to move it to another server. */

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const ROOT = path.resolve(__dirname, '..', '..')

function readEnvFile() {
  const file = path.join(ROOT, '.env')
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
  return out
}

const file = readEnvFile()
const pick = (key, fallback) => process.env[key] ?? file[key] ?? fallback

/* The session secret may be left blank: we make one on first run and keep it
   in data/.session-secret so logins survive a restart. */
function sessionSecret() {
  const given = pick('SESSION_SECRET', '')
  if (given) return given
  const keep = path.join(ROOT, 'data', '.session-secret')
  if (fs.existsSync(keep)) return fs.readFileSync(keep, 'utf8').trim()
  const made = crypto.randomBytes(32).toString('base64url')
  fs.mkdirSync(path.dirname(keep), { recursive: true })
  fs.writeFileSync(keep, made, { mode: 0o600 })
  return made
}

const basePath = (pick('BASE_PATH', '/office') || '/office').replace(/\/+$/, '')

module.exports = {
  ROOT,
  port: Number(pick('PORT', 4000)),
  basePath,
  databaseUrl: pick('DATABASE_URL', ''),
  sqliteFile: path.join(ROOT, 'data', 'amrut.db'),
  sessionSecret: sessionSecret(),
  secureCookies: pick('SECURE_COOKIES', '0') === '1',
  uploadDir: path.resolve(ROOT, pick('UPLOAD_DIR', 'data/uploads')),
  /* Where the public portal lives, so the office can link out to a story as a
     reader sees it. Blank means no "view" links are shown. */
  portalUrl: (pick('PORTAL_URL', '') || '').replace(/\/+$/, ''),
  /* Where the archive's own photographs are still served from, for thumbnails
     of stories that came across from the old site. Blank means no thumbnail. */
  archiveImages: (pick('ARCHIVE_IMAGE_BASE', 'https://amrutmaharashtra.org/') || '').replace(/\/+$/, '') + '/',
  url: (p = '') => basePath + p,
}
