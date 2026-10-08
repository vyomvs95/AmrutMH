'use strict'
/* The dashboard, its filters, and the CSV of whatever is on screen. */

const db = require('../../core/db')
const { send } = require('../../core/http')
const Q = require('./queries')
const T = require('../../shared/table')
const V = require('./views')
const counter = require('./counter')

const day = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)

/* Read the filters off the address bar, keeping them within sensible bounds. */
function readFilters(url, user) {
  const days = [7, 30, 90, 365].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 30
  const f = {
    days,
    from: url.searchParams.get('from') || day(-(days - 1)),
    to: url.searchParams.get('to') || day(0),
    district: user.role === 'editor' ? (url.searchParams.get('district') || '') : '',
    section: url.searchParams.get('section') || '',
    source: ['office', 'archive'].includes(url.searchParams.get('source')) ? url.searchParams.get('source') : '',
    q: (url.searchParams.get('q') || '').trim().slice(0, 80),
  }
  return f
}

/* Each table remembers its own sort in the address, under its own prefix. */
function readSorts(url) {
  return {
    district: T.readSort(url, 'd_', ['name', 'views', 'uniques', 'stories'], 'views'),
    section: T.readSort(url, 's_', ['name', 'views', 'uniques', 'stories'], 'views'),
    story: T.readSort(url, 't_', ['title', 'views', 'uniques'], 'views'),
    ad: T.readSort(url, 'a_', ['advertiser', 'slot', 'shown', 'reach', 'clicks'], 'shown'),
  }
}

async function gather(user, f, sorts, page) {
  const [totals, published, days, byDistrict, bySection, top, ads, money] = await Promise.all([
    Q.totals(user, f), Q.publishedCount(user, f), Q.byDay(user, f),
    Q.byDistrict(user, f, sorts.district), Q.bySection(user, f, sorts.section),
    Q.topStories(user, f, { ...sorts.story, page, perPage: 10, q: f.q }),
    Q.ads(user, f, sorts.ad), Q.money(user, f),
  ])
  return { totals, published, days, byDistrict, bySection, top, ads, money }
}

const csvCell = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

async function handle({ res, route, url, user, withCsrf }) {
  if (route !== '/analytics' && route !== '/analytics.csv') return false

  const f = readFilters(url, user)
  const sorts = readSorts(url)
  const page = Math.max(1, Number(url.searchParams.get('t_page')) || 1)
  const data = await gather(user, f, sorts, page)

  if (route === '/analytics.csv') {
    const lines = [['section', 'name', 'views', 'uniques', 'stories']]
    for (const r of data.byDistrict) lines.push(['district', r.name, r.views, r.uniques, r.stories])
    for (const r of data.bySection) lines.push(['section', r.name, r.views, r.uniques, r.stories])
    for (const r of data.top.rows) lines.push(['story', r.title, r.views, r.uniques, ''])
    for (const a of data.ads) lines.push(['ad', a.advertiser, a.shown, a.reach, a.clicks])
    send(res, 200, '﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\n'), {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="amrut-analytics-${f.from}-to-${f.to}.csv"`,
    })
    return true
  }

  const districts = user.role === 'editor'
    ? await db.all('SELECT id, name_mr FROM districts ORDER BY name_mr') : []
  const sections = await db.all('SELECT id, name_mr FROM sections ORDER BY sort_order')
  send(res, 200, V.dashboard({ user, f, url, sorts, districts, sections, ...data }), withCsrf())
  return true
}

module.exports = { handle, counter }
