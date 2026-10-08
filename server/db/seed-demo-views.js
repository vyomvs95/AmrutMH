'use strict'
/* SAMPLE READING FIGURES — for showing the dashboard before the portal is live. */

const db = require('../src/core/db')

const day = (back) => new Date(Date.now() - back * 86400000).toISOString().slice(0, 10)
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

;(async () => {
  await db.connect()
  if (process.argv.includes('--clear')) {
    const a = await db.run("DELETE FROM view_daily WHERE day < ?", [day(0)])
    const b = await db.run("DELETE FROM view_seen WHERE day < ?", [day(0)])
    console.log(`cleared ${a.changes} daily rows and ${b.changes} visitor rows from before today`)
    await db.close(); return
  }

  const office = await db.all("SELECT public_id FROM stories WHERE status = 'published'")
  const legacy = await db.all('SELECT id FROM legacy_stories ORDER BY id LIMIT 400')
  const ads = await db.all('SELECT public_id FROM ads')
  const subjects = [
    ...office.map((s) => s.public_id),
    ...legacy.map((l) => l.id),
  ]
  if (!subjects.length) { console.log('nothing published yet'); await db.close(); return }

  let rows = 0
  for (let back = 29; back >= 1; back--) {
    const d = day(back)
    const weekend = [0, 6].includes(new Date(d).getDay())
    for (const subject of subjects) {
      if (Math.random() > 0.35) continue
      const uniques = rnd(1, weekend ? 40 : 90)
      const views = uniques + rnd(0, Math.round(uniques * 0.8))
      await db.run(
        `INSERT INTO view_daily (subject, subject_kind, day, views, uniques, clicks) VALUES (?,?,?,?,?,0)
         ON CONFLICT (subject, subject_kind, day) DO UPDATE SET views = ?, uniques = ?`,
        [subject, 'story', d, views, uniques, views, uniques])
      rows++
    }
    for (const a of ads) {
      const shown = rnd(200, 2000)
      await db.run(
        `INSERT INTO view_daily (subject, subject_kind, day, views, uniques, clicks) VALUES (?,?,?,?,?,?)
         ON CONFLICT (subject, subject_kind, day) DO UPDATE SET views = ?, uniques = ?, clicks = ?`,
        [a.public_id, 'ad', d, shown, Math.round(shown * 0.7), rnd(2, 40),
         shown, Math.round(shown * 0.7), rnd(2, 40)])
      rows++
    }
  }
  console.log(`${rows} sample daily rows written across 29 days. Clear them with --clear.`)
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
