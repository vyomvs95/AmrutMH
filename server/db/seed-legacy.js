'use strict'
/* Names, sections and districts for the stories that came across from the old
   site. They live in the portal's own data files, not in this database, so the
   dashboard would otherwise have nothing but a number to show.

   Reads ../public/data/a/*.json if the portal is sitting beside this folder.
   Harmless to skip. Safe to run again - it updates what it already has. */

const fs = require('node:fs')
const path = require('node:path')
const db = require('../src/core/db')

const DIR = path.resolve(__dirname, '..', '..', 'public', 'data', 'a')
const CATS = path.resolve(__dirname, '..', '..', 'public', 'data', 'cat')

/* The old site spells a few districts differently. Everything else matches once
   it is lower-cased. */
const ALIAS = {
  amaravati: 'amravati',
  aurangabad: 'chhatrapati_sambhajinagar',
  osmanabad: 'dharashiv',
  ahmednagar: 'ahilyanagar',
  buldana: 'buldhana',
}
const district = (d) => {
  const key = String(d || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return key ? (ALIAS[key] || key) : null
}

;(async () => {
  await db.connect()
  if (!fs.existsSync(DIR)) {
    console.log('No portal data folder beside the office - nothing to do.')
    await db.close(); return
  }
  /* The cover photograph is listed in the category files, not the article
     files, so collect those first: id -> photograph path on the old site. */
  const cover = new Map()
  if (fs.existsSync(CATS)) {
    for (const f of fs.readdirSync(CATS).filter((x) => x.endsWith('.json'))) {
      let list = []
      try { list = JSON.parse(fs.readFileSync(path.join(CATS, f), 'utf8')) } catch { continue }
      for (const it of list) if (it && it.id && it.im) cover.set(String(it.id), it.im)
    }
  }

  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))
  let added = 0, updated = 0
  for (const file of files) {
    let a
    try { a = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) } catch { continue }
    if (!a || !a.id) continue
    const id = String(a.id)
    const has = await db.get('SELECT id FROM legacy_stories WHERE id = ?', [id])
    if (has) {
      await db.run('UPDATE legacy_stories SET title = ?, cat = ?, district_en = ?, image_path = ? WHERE id = ?',
        [a.title || '', a.cat || null, district(a.district), cover.get(id) || null, id])
      updated++
    } else {
      await db.run('INSERT INTO legacy_stories (id, title, cat, district_en, image_path) VALUES (?,?,?,?,?)',
        [id, a.title || '', a.cat || null, district(a.district), cover.get(id) || null])
      added++
    }
  }
  const withDistrict = Number((await db.get('SELECT COUNT(*) AS c FROM legacy_stories WHERE district_en IS NOT NULL')).c)
  const withCover = Number((await db.get('SELECT COUNT(*) AS c FROM legacy_stories WHERE image_path IS NOT NULL')).c)
  console.log(`${added} added, ${updated} updated — ${withDistrict} carry a district, ${withCover} carry a cover photograph`)
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
