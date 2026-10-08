'use strict'
/* Recording a read, or a click on an advertisement.

   Two numbers per subject per day: every read, and how many different people.
   A reader is only counted once a day towards "uniques", and the same reader
   refreshing within a minute does not inflate "views" either. */

const db = require('../../core/db')
const { today } = require('../../core/visitor')

const recent = new Map()          // visitor+subject -> when, to ignore refreshes
const RECENT_MS = 60 * 1000

function tooSoon(key) {
  const at = recent.get(key)
  const now = Date.now()
  if (at && now - at < RECENT_MS) return true
  recent.set(key, now)
  if (recent.size > 20000) {      // keep the map from growing without bound
    for (const [k, t] of recent) if (now - t > RECENT_MS) recent.delete(k)
  }
  return false
}

async function record(subject, kind, visitor) {
  if (!subject || !visitor) return
  const day = today()
  if (tooSoon(visitor + '|' + kind + '|' + subject)) return

  const ins = await db.run(
    `INSERT INTO view_seen (subject, subject_kind, day, visitor) VALUES (?,?,?,?)
     ON CONFLICT (subject, subject_kind, day, visitor) DO NOTHING`,
    [subject, kind, day, visitor])
  const isNew = ins.changes > 0

  await db.run(
    `INSERT INTO view_daily (subject, subject_kind, day, views, uniques, clicks)
     VALUES (?,?,?,1,?,0)
     ON CONFLICT (subject, subject_kind, day)
     DO UPDATE SET views = view_daily.views + 1, uniques = view_daily.uniques + ?`,
    [subject, kind, day, isNew ? 1 : 0, isNew ? 1 : 0])
}

async function click(subject, kind) {
  if (!subject) return
  const day = today()
  await db.run(
    `INSERT INTO view_daily (subject, subject_kind, day, views, uniques, clicks)
     VALUES (?,?,?,0,0,1)
     ON CONFLICT (subject, subject_kind, day)
     DO UPDATE SET clicks = view_daily.clicks + 1`,
    [subject, kind, day])
}

/* Housekeeping: the per-visitor rows are only needed to work out "uniques" on
   the day itself. Anything older can go. */
async function forget(daysToKeep = 40) {
  const cutoff = new Date(Date.now() - daysToKeep * 86400000).toISOString().slice(0, 10)
  const r = await db.run('DELETE FROM view_seen WHERE day < ?', [cutoff])
  return r.changes
}

module.exports = { record, click, forget }
