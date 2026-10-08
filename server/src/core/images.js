'use strict'
/* Making a photograph light enough for a phone on a weak connection.

   Each upload is kept as it arrived, and alongside it we write WebP copies at
   400, 800 and 1400 pixels wide - the same three sizes the public portal
   already uses. A page then asks for the size it needs instead of pulling down
   a 4 MB photograph from a camera.

   This needs the "sharp" package. If it is not installed - some locked-down
   servers cannot build it - the office carries on and simply serves the
   original. Nothing breaks; the photographs are just heavier. */

const fs = require('node:fs')
const path = require('node:path')
const config = require('./config')

const WIDTHS = [400, 800, 1400]

let sharp = null
try { sharp = require('sharp') } catch { /* optional on purpose */ }

const available = () => !!sharp

/* filePath is what is stored in the database, e.g. 2026/10/<id>.jpg */
async function makeVariants(filePath) {
  if (!sharp) return { widths: [], width: null, height: null }
  const full = path.join(config.uploadDir, filePath)
  const dir = path.dirname(full)
  const base = path.basename(full, path.extname(full))
  const made = []
  const meta = await sharp(full).metadata()
  for (const w of WIDTHS) {
    if (meta.width && meta.width < w && made.length) break      // never upscale
    const out = path.join(dir, `${base}-${w}.webp`)
    await sharp(full).rotate().resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 }).toFile(out)
    made.push(w)
  }
  return { widths: made, width: meta.width || null, height: meta.height || null }
}

function variantPath(filePath, width) {
  const dir = path.dirname(filePath)
  const base = path.basename(filePath, path.extname(filePath))
  return path.join(dir, `${base}-${width}.webp`)
}

module.exports = { WIDTHS, available, makeVariants, variantPath }
