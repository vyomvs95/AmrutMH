'use strict'
/* Starts the office. Run with:  node src/server.js  */

const http = require('node:http')
const config = require('./core/config')
const db = require('./core/db')
const app = require('./app')

async function main() {
  await db.connect()
  await db.applySchema()
  await require('../db/migrate').migrate(true)

  const server = http.createServer((req, res) => {
    app.handle(req, res).catch((err) => {
      console.error('[error]', req.method, req.url, err)
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Something went wrong. Please try again.')
    })
  })

  server.listen(config.port, () => {
    console.log(`AMRUT office running`)
    console.log(`  address   http://localhost:${config.port}${config.basePath}`)
    console.log(`  database  ${db.label}`)
    console.log(`  stop with Ctrl-C`)
  })

  const bye = async () => { try { await db.close() } catch {} process.exit(0) }
  process.on('SIGINT', bye)
  process.on('SIGTERM', bye)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
