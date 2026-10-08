'use strict'
/* Creates the tables. Safe to run more than once. */
const db = require('../src/core/db')
;(async () => {
  await db.connect()
  await db.applySchema()
  await require('./migrate').migrate()
  console.log('Tables are ready in:', db.label)
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
