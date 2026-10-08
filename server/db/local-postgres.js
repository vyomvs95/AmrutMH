'use strict'
/* A PostgreSQL for working on this machine only.
   It uses binaries that came with the "embedded-postgres" development package,
   so nothing is installed into macOS and nothing needs admin rights.

   AMRUT's own server will not use this file - there, DATABASE_URL in .env
   points at their PostgreSQL and this script is never run.

     node db/local-postgres.js start
     node db/local-postgres.js stop
*/

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const BIN = path.join(ROOT, 'node_modules', '@embedded-postgres', 'darwin-arm64', 'native', 'bin')
const DATA = path.join(ROOT, 'data', 'pg')
const LOG = path.join(ROOT, 'data', 'pg.log')
const PORT = 55432
const USER = 'amrut'
const PASS = 'amrutlocal'
const DB = 'amrut'

const run = (cmd, args) => execFileSync(path.join(BIN, cmd), args, { stdio: 'inherit' })

function start() {
  if (!fs.existsSync(BIN)) {
    console.error('The development PostgreSQL is not installed. Run:  npm install -D embedded-postgres')
    process.exit(1)
  }
  if (!fs.existsSync(DATA)) {
    const pwFile = path.join(ROOT, 'data', '.pgpw')
    fs.mkdirSync(path.dirname(pwFile), { recursive: true })
    fs.writeFileSync(pwFile, PASS, { mode: 0o600 })
    run('initdb', ['-D', DATA, '-U', USER, '--auth=scram-sha-256', `--pwfile=${pwFile}`, '-E', 'UTF8'])
    fs.unlinkSync(pwFile)
  }
  run('pg_ctl', ['-D', DATA, '-l', LOG, '-o',
    `-p ${PORT} -c listen_addresses=127.0.0.1 -c unix_socket_directories=''`, 'start'])
  console.log(`\nPostgreSQL is running on port ${PORT}.`)
  console.log(`Put this in .env:\n  DATABASE_URL=postgres://${USER}:${PASS}@127.0.0.1:${PORT}/${DB}`)
}

const stop = () => run('pg_ctl', ['-D', DATA, 'stop'])

async function ensureDatabase() {
  const { Client } = require('pg')
  const c = new Client({ host: '127.0.0.1', port: PORT, user: USER, password: PASS, database: 'postgres' })
  await c.connect()
  const has = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB])
  if (!has.rowCount) await c.query(`CREATE DATABASE ${DB}`)
  await c.end()
  console.log(`database "${DB}" ready`)
}

const what = process.argv[2]
if (what === 'start') { start(); setTimeout(() => ensureDatabase().catch((e) => console.error(e.message)), 1500) }
else if (what === 'stop') stop()
else console.log('usage: node db/local-postgres.js start|stop')
