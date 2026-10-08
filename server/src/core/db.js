'use strict'
/* One layer over PostgreSQL, or the fallback file database. */

const fs = require('node:fs')
const path = require('node:path')
const config = require('./config')

const isPg = !!config.databaseUrl
let sqlite = null
let pool = null

function toPg(sql) {
  let n = 0
  return sql.replace(/\?/g, () => '$' + ++n)
}

async function connect() {
  if (isPg) {
    let pg
    try {
      pg = require('pg')
    } catch {
      throw new Error(
        'DATABASE_URL is set but the "pg" package is not installed.\n' +
        'Run:  npm install pg    (inside the server folder)'
      )
    }
    pool = new pg.Pool({ connectionString: config.databaseUrl })
    await pool.query('SELECT 1')
  } else {
    const { DatabaseSync } = require('node:sqlite')
    fs.mkdirSync(path.dirname(config.sqliteFile), { recursive: true })
    sqlite = new DatabaseSync(config.sqliteFile)
    sqlite.exec('PRAGMA journal_mode = WAL')
    sqlite.exec('PRAGMA foreign_keys = ON')
  }
}

async function all(sql, params = []) {
  if (isPg) return (await pool.query(toPg(sql), params)).rows
  return sqlite.prepare(sql).all(...params)
}

async function get(sql, params = []) {
  if (isPg) return (await pool.query(toPg(sql), params)).rows[0] ?? null
  return sqlite.prepare(sql).get(...params) ?? null
}

/* Returns { changes }. Use insert() when you need the new row's id. */
async function run(sql, params = []) {
  if (isPg) {
    const res = await pool.query(toPg(sql), params)
    return { changes: res.rowCount }
  }
  const res = sqlite.prepare(sql).run(...params)
  return { changes: Number(res.changes) }
}

/* An INSERT that hands back the new row's id. Only for tables that have one. */
async function insert(sql, params = []) {
  if (isPg) {
    const res = await pool.query(toPg(sql + ' RETURNING id'), params)
    return { id: res.rows[0]?.id ?? null, changes: res.rowCount }
  }
  const res = sqlite.prepare(sql).run(...params)
  return { id: Number(res.lastInsertRowid), changes: Number(res.changes) }
}

async function exec(sqlText) {
  if (isPg) { await pool.query(sqlText); return }
  sqlite.exec(sqlText)
}

async function applySchema() {
  const file = path.join(config.ROOT, 'db', isPg ? 'schema.postgres.sql' : 'schema.sqlite.sql')
  await exec(fs.readFileSync(file, 'utf8'))
}

async function close() {
  if (isPg) await pool.end()
  else sqlite.close()
}

module.exports = { connect, all, get, run, insert, exec, applySchema, close, isPg, label: isPg ? 'PostgreSQL' : 'SQLite file (data/amrut.db)' }
