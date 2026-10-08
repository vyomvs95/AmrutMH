'use strict'
/* Applies anything in db/migrations that has not run yet, in name order, and remembers. */

const fs = require('node:fs')
const path = require('node:path')
const db = require('../src/core/db')

async function migrate(quiet = false) {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`)
  const dir = path.join(__dirname, 'migrations')
  /* A migration may be written once for both engines (001_x.sql) or, when the dialects. */
  const engine = db.isPg ? 'postgres' : 'sqlite'
  const all = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.sql')) : []
  const files = all
    .filter((f) => !/\.(postgres|sqlite)\.sql$/.test(f) || f.endsWith(`.${engine}.sql`))
    .sort()
  let n = 0
  for (const file of files) {
    const name = file.replace(/\.(postgres|sqlite)\.sql$/, '.sql')
    const done = await db.get('SELECT name FROM schema_migrations WHERE name = ?', [name])
    if (done) continue
    /* one transaction per file, so a failure never leaves a half-applied change. */
    await db.exec('BEGIN')
    try {
      await db.exec(fs.readFileSync(path.join(dir, file), 'utf8'))
      await db.run('INSERT INTO schema_migrations (name, applied_at) VALUES (?,?)', [name, new Date().toISOString()])
      await db.exec('COMMIT')
    } catch (e) {
      await db.exec('ROLLBACK').catch(() => {})
      throw new Error(`migration ${file} failed: ${e.message}`)
    }
    if (!quiet) console.log('applied', file)
    n++
  }
  if (!quiet && !n) console.log('nothing to apply - already up to date')
  return n
}

module.exports = { migrate }

if (require.main === module) {
  ;(async () => { await db.connect(); await migrate(); await db.close() })()
    .catch((e) => { console.error(e.message); process.exit(1) })
}
