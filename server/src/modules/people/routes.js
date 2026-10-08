'use strict'
/* The accounts that may use the office. Head office only. */
const db = require('../../core/db')
const ids = require('../../core/ids')
const { send } = require('../../core/http')
const V = require('./views')
const T = require('../../shared/table')
const office = require('../office/views')

const notFound = (res) => send(res, 404, office.notFound())

const WITH_PLACE = `
  SELECT u.*, COALESCE(d.name_mr, dv.name_mr, 'मुख्य कार्यालय') AS place
    FROM users u
    LEFT JOIN districts d  ON d.id  = u.district_id
    LEFT JOIN divisions dv ON dv.id = u.division_id`

const MR = db.isPg ? ' COLLATE "mr-IN-x-icu"' : ''
const USER_SORTS = {
  name: `u.name${MR}`, email: 'u.email', role: "CASE u.role WHEN 'editor' THEN 0 WHEN 'divisional' THEN 1 ELSE 2 END",
  place: `place${MR}`,
}

async function handle({ res, route, url, user, withCsrf }) {
  if (route === '/users') {
    if (user.role !== 'editor') { notFound(res); return true }
    const sort = T.readSort(url, 'u_', Object.keys(USER_SORTS), 'role', 'asc')
    const rows = await db.all(
      `${WITH_PLACE} ORDER BY ${USER_SORTS[sort.key] || USER_SORTS.role} ${sort.dir === 'asc' ? 'ASC' : 'DESC'}, u.name${MR}`)
    send(res, 200, V.list({ user, rows, sort, url }), withCsrf())
    return true
  }

  const m = route.match(/^\/users\/([A-Za-z0-9_-]+)$/)
  if (m) {
    /* not allowed and not there look the same on purpose */
    if (user.role !== 'editor' || !ids.looksValid(m[1])) { notFound(res); return true }
    const row = await db.get(`${WITH_PLACE} WHERE u.public_id = ?`, [m[1]])
    if (!row) { notFound(res); return true }
    send(res, 200, V.detail({ user, row }), withCsrf())
    return true
  }
  return false
}

module.exports = { handle }
