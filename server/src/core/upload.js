'use strict'
/* Reading a form that carries photographs (multipart/form-data).
   Written out by hand so the office keeps needing nothing from outside.

   Guards: a cap on the whole request, a cap per photograph, a cap on how many,
   and a check of the first bytes of each file so a renamed .exe cannot pose as
   a .jpg. */

const fs = require('node:fs')
const path = require('node:path')
const config = require('./config')
const ids = require('./ids')

const MAX_REQUEST = 40 * 1024 * 1024   // whole submission
const MAX_FILE = 12 * 1024 * 1024      // one photograph
const MAX_FILES = 8

const KINDS = [
  { ext: 'jpg',  type: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png',  type: 'image/png',  test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: 'webp', type: 'image/webp', test: (b) => b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP' },
]

const identify = (buf) => (buf.length < 12 ? null : KINDS.find((k) => k.test(buf)) || null)

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const parts = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_REQUEST) { reject(new Error('request too large')); req.destroy(); return }
      parts.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(parts)))
    req.on('error', reject)
  })
}

/* Returns { fields, files } where fields is a plain object and files is an
   array of { field, filename, data, kind }. */
async function parse(req) {
  const type = req.headers['content-type'] || ''
  const m = type.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!/multipart\/form-data/i.test(type) || !m) throw new Error('not a photo form')
  const boundary = Buffer.from('--' + (m[1] || m[2]).trim())
  const body = await readRaw(req)

  const fields = {}
  const files = []
  let at = body.indexOf(boundary)
  while (at !== -1) {
    const start = at + boundary.length
    if (body.slice(start, start + 2).toString() === '--') break          // closing boundary
    const next = body.indexOf(boundary, start)
    if (next === -1) break
    let chunk = body.slice(start + 2, next - 2)                           // strip the CRLFs
    const split = chunk.indexOf('\r\n\r\n')
    if (split !== -1) {
      const head = chunk.slice(0, split).toString('utf8')
      const data = chunk.slice(split + 4)
      const name = /name="([^"]*)"/i.exec(head)?.[1]
      const filename = /filename="([^"]*)"/i.exec(head)?.[1]
      if (name && filename !== undefined) {
        if (filename && data.length) {
          if (data.length > MAX_FILE) throw new Error('one photograph is larger than 12 MB')
          const kind = identify(data)
          if (!kind) throw new Error('only JPG, PNG or WEBP photographs are accepted')
          if (files.length >= MAX_FILES) throw new Error('at most 8 photographs')
          files.push({ field: name, filename, data, kind })
        }
      } else if (name) {
        fields[name] = data.toString('utf8')
      }
    }
    at = next
  }
  return { fields, files }
}

/* Writes one photograph under data/uploads/YYYY/MM/ and hands back the path to
   store in the database. The file name is an unguessable id, never the name the
   person uploaded - that keeps odd characters and look-alike names out. */
function save(file) {
  const now = new Date()
  const rel = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'))
  const dir = path.join(config.uploadDir, rel)
  fs.mkdirSync(dir, { recursive: true })
  const id = ids.newPublicId()
  const name = `${id}.${file.kind.ext}`
  fs.writeFileSync(path.join(dir, name), file.data, { mode: 0o640 })
  return { publicId: id, filePath: path.join(rel, name), type: file.kind.type }
}

function readSaved(filePath) {
  const full = path.resolve(config.uploadDir, filePath)
  if (!full.startsWith(path.resolve(config.uploadDir) + path.sep)) return null   // no climbing out
  return fs.existsSync(full) ? fs.readFileSync(full) : null
}

module.exports = { parse, save, readSaved, MAX_FILE, MAX_FILES }
