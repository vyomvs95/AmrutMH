'use strict'
/* Carries the visitor count over from the existing portal so the two agree. */

const db = require('../src/core/db')

const CARRIED_OVER = 427786

;(async () => {
  await db.connect()
  await require('./migrate').migrate(true)
  const given = Number(process.argv[2])
  const start = Number.isFinite(given) && given > 0 ? Math.round(given) : CARRIED_OVER
  const now = new Date().toISOString()
  const has = await db.get('SELECT value FROM site_counters WHERE name = ?', ['visits'])
  if (!has) {
    await db.run('INSERT INTO site_counters (name, value, updated_at) VALUES (?,?,?)', ['visits', start, now])
    console.log(`visits started at ${start.toLocaleString('en-IN')}`)
  } else if (given) {
    await db.run('UPDATE site_counters SET value = ?, updated_at = ? WHERE name = ?', [start, now, 'visits'])
    console.log(`visits re-aligned to ${start.toLocaleString('en-IN')} (was ${Number(has.value).toLocaleString('en-IN')})`)
  } else {
    console.log(`visits already running at ${Number(has.value).toLocaleString('en-IN')} — pass a number to re-align`)
  }
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
