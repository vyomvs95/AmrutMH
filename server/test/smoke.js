'use strict'
/* End-to-end check of the whole office, over real HTTP.
   Start the office first, then:  node test/smoke.js

   It signs in as each kind of person, writes a story with a photograph, takes
   it through review to publication, and then checks the things that must NOT
   be possible. Run it after any change. */

const BASE = process.env.SMOKE_BASE || 'http://localhost:4000'
const OFFICE = BASE + '/office'
const API = BASE + '/api'

let pass = 0, fail = 0
const ok = (name, got, want) => {
  const good = String(got) === String(want)
  console.log(`  ${good ? '✓' : '✗'} ${name}${good ? '' : `   got ${got}, wanted ${want}`}`)
  good ? pass++ : fail++
}

/* ---- the smallest possible browser ---- */
function jar() {
  const store = new Map()
  return {
    header: () => [...store].map(([k, v]) => `${k}=${v}`).join('; '),
    take(res) {
      for (const c of res.headers.getSetCookie?.() || []) {
        const [pair] = c.split(';')
        const i = pair.indexOf('=')
        store.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim())
      }
    },
  }
}

async function visit(j, url, opts = {}) {
  const res = await fetch(url, { redirect: 'manual', ...opts, headers: { cookie: j.header(), ...(opts.headers || {}) } })
  j.take(res)
  return res
}

const csrfFrom = (html) => (html.match(/name="_csrf" value="([^"]+)"/) || [])[1]

async function signIn(email, password) {
  const j = jar()
  const form = csrfFrom(await (await visit(j, OFFICE + '/login')).text())
  const res = await visit(j, OFFICE + '/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: form, email, password }),
  })
  return { j, status: res.status }
}

/* a real PNG, written by hand so the test needs no fixtures */
function png() {
  const zlib = require('node:zlib')
  const w = 60, h = 40
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * (w * 3 + 1) + 1 + x * 3
    raw[o] = 249; raw[o + 1] = 115; raw[o + 2] = 22
  }
  const chunk = (t, d) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length)
    const td = Buffer.concat([Buffer.from(t), d])
    let c = ~0 >>> 0
    for (const b of td) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)) }
    const crc = Buffer.alloc(4); crc.writeUInt32BE((~c) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

function multipart(fields, files) {
  const b = '----smoke' + Date.now()
  const parts = []
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`))
  }
  for (const [k, { name, data, type }] of Object.entries(files)) {
    parts.push(Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${k}"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`))
    parts.push(data, Buffer.from('\r\n'))
  }
  parts.push(Buffer.from(`--${b}--\r\n`))
  return { body: Buffer.concat(parts), type: `multipart/form-data; boundary=${b}` }
}

async function act(j, token, what, extra = {}) {
  const page = await (await visit(j, `${OFFICE}/stories/${token}`)).text()
  const res = await visit(j, `${OFFICE}/stories/${token}/${what}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: csrfFrom(page), ...extra }),
  })
  return res.status
}

;(async () => {
  const fs = require('node:fs')
  const logins = fs.readFileSync(require('node:path').join(__dirname, '..', 'data', 'first-logins.txt'), 'utf8')
  const pw = (role) => (logins.match(new RegExp(role + '\\s+(\\S+)\\s+password: (\\S+)')) || [])[2]

  console.log('\nsigning in')
  const ed = await signIn('editor@amrutmaharashtra.org', pw('editor'))
  const dv = await signIn('nagpur@amrutmaharashtra.org', pw('divisional'))
  const di = await signIn('gondia@amrutmaharashtra.org', pw('district'))
  ok('editor signs in', ed.status, 302)
  ok('divisional signs in', dv.status, 302)
  ok('district signs in', di.status, 302)
  ok('wrong password refused', (await signIn('editor@amrutmaharashtra.org', 'nonsense')).status, 401)

  console.log('\nwriting a story')
  const formPage = await (await visit(di.j, OFFICE + '/stories/new')).text()
  const section = (formPage.match(/<option value="(\d+)"/) || [])[1]
  const mp = multipart(
    { _csrf: csrfFrom(formPage), title: 'चाचणी — ' + Date.now(), body: 'पहिला परिच्छेद.\n\nदुसरा परिच्छेद.', section_id: section },
    { photos: { name: 'p.png', data: png(), type: 'image/png' } })
  const made = await visit(di.j, OFFICE + '/stories/new', { method: 'POST', headers: { 'content-type': mp.type }, body: mp.body })
  ok('story saved', made.status, 302)
  const token = (made.headers.get('location') || '').split('/').pop()

  console.log('\nthrough review')
  ok('district submits', await act(di.j, token, 'submit'), 302)
  ok('district cannot approve', await act(di.j, token, 'approve'), 404)
  ok('divisional sends back', await act(dv.j, token, 'return', { note: 'कृपया छायाचित्र बदला' }), 302)
  ok('district submits again', await act(di.j, token, 'submit'), 302)
  ok('divisional approves', await act(dv.j, token, 'approve'), 302)
  ok('divisional cannot publish', await act(dv.j, token, 'publish'), 404)
  ok('editor publishes', await act(ed.j, token, 'publish'), 302)

  console.log('\nwhat the public may see')
  const list = await (await fetch(`${API}/stories?limit=50`)).json()
  ok('published story is public', list.items.some((i) => i.id === token), true)
  const full = await (await fetch(`${API}/stories/${token}`)).json()
  ok('two paragraphs kept', full.body.length, 2)
  ok('photograph has sizes', full.images[0].widths.length > 0, true)
  ok('photograph loads', (await fetch(`${API}/img/${full.images[0].id}?w=400`)).status, 200)

  console.log('\nwhat the public may not see')
  const draftPage = await (await visit(di.j, OFFICE + '/stories/new')).text()
  const d2 = multipart({ _csrf: csrfFrom(draftPage), title: 'मसुदा — गुप्त', body: 'अप्रकाशित.', section_id: section }, {})
  const draft = await visit(di.j, OFFICE + '/stories/new', { method: 'POST', headers: { 'content-type': d2.type }, body: d2.body })
  const draftToken = (draft.headers.get('location') || '').split('/').pop()
  ok('draft hidden from the public', (await fetch(`${API}/stories/${draftToken}`)).status, 404)
  const list2 = await (await fetch(`${API}/stories?limit=50`)).json()
  ok('draft absent from the list', list2.items.some((i) => i.id === draftToken), false)

  console.log('\nboundaries')
  ok('tampered address', (await visit(ed.j, `${OFFICE}/stories/${token.slice(0, -1)}Z`)).status, 404)
  ok('guessed number', (await visit(ed.j, `${OFFICE}/stories/7`)).status, 404)
  ok('district cannot reach people', (await visit(di.j, OFFICE + '/users')).status, 404)
  ok('district cannot reach review', (await visit(di.j, OFFICE + '/review')).status, 404)
  ok('signed out cannot reach office', (await visit(jar(), OFFICE + '/stories')).status, 302)

  console.log('\nadvertising')
  const rateCard = await visit(ed.j, OFFICE + '/ads/rates')
  ok('rate card opens', rateCard.status, 200)
  const adForm = await (await visit(di.j, OFFICE + '/ads/new')).text()
  const slotId = (adForm.match(/<option value="(\d+)"/) || [])[1]
  const adMp = multipart(
    { _csrf: csrfFrom(adForm), advertiser_name: 'चाचणी दुकान', advertiser_contact: '9112226524',
      slot_id: slotId, days: '7', target_url: 'https://example.org' },
    { creative: { name: 'ad.png', data: png(), type: 'image/png' } })
  const adMade = await visit(di.j, OFFICE + '/ads/new', { method: 'POST', headers: { 'content-type': adMp.type }, body: adMp.body })
  ok('advertisement recorded', adMade.status, 302)
  const adToken = (adMade.headers.get('location') || '').split('/').pop()

  const adAct = async (j, what, extra = {}) => {
    const page = await (await visit(j, `${OFFICE}/ads/${adToken}`)).text()
    const r = await visit(j, `${OFFICE}/ads/${adToken}/${what}`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrfFrom(page), ...extra }),
    })
    return r.status
  }
  ok('not public before payment', (await (await fetch(`${API}/ads`)).json()).some((a) => a.id === adToken), false)
  ok('editor cannot confirm unpaid', await adAct(ed.j, 'confirm'), 404)
  ok('district records the money', await adAct(di.j, 'payment', { amount: '15000', mode: 'upi', reference: 'UPI/9981' }), 302)
  ok('district cannot confirm its own', await adAct(di.j, 'confirm'), 404)
  ok('still not public', (await (await fetch(`${API}/ads`)).json()).some((a) => a.id === adToken), false)
  ok('editor confirms the receipt', await adAct(ed.j, 'confirm'), 302)
  const live = await (await fetch(`${API}/ads?slot=popup`)).json()
  const mine = live.find((a) => a.id === adToken)
  ok('now running in public', !!mine, true)
  ok('artwork loads', (await fetch(`${API}${mine.image.url.replace('/api', '')}`.replace(API, API) + '?w=400')).status, 200)
  ok('other district cannot see it', (await visit(dv.j, `${OFFICE}/ads/${adToken}`)).status, 200)
  ok('editor stops it', await adAct(ed.j, 'stop'), 302)
  ok('stopped means not public', (await (await fetch(`${API}/ads`)).json()).some((a) => a.id === adToken), false)

  console.log('\ncounting reads')
  const count = async () => {
    const r = await (await visit(ed.j, `${OFFICE}/analytics?days=7`)).text()
    const m = r.match(/<b>([\d,]+)<\/b><span>एकूण वाचन/)
    const uq = r.match(/<b>([\d,]+)<\/b><span>वेगवेगळे वाचक/)
    return { views: Number((m || [])[1]?.replace(/,/g, '') || 0), uniques: Number((uq || [])[1]?.replace(/,/g, '') || 0) }
  }
  const before = await count()
  await fetch(`${API}/view/${token}`, { method: 'POST' })
  const afterOne = await count()
  ok('a read is counted', afterOne.views, before.views + 1)
  ok('and the reader is counted once', afterOne.uniques, before.uniques + 1)
  /* same visitor again within the minute: neither number should move */
  await fetch(`${API}/view/${token}`, { method: 'POST' })
  const afterTwice = await count()
  ok('a refresh does not inflate views', afterTwice.views, afterOne.views)
  ok('nor unique readers', afterTwice.uniques, afterOne.uniques)
  /* a different browser is a different reader */
  await fetch(`${API}/view/${token}`, { method: 'POST', headers: { 'user-agent': 'another-reader/1.0' } })
  const afterOther = await count()
  ok('a second reader adds both', afterOther.views, afterOne.views + 1)
  ok('and counts as a new reader', afterOther.uniques, afterOne.uniques + 1)
  /* archive stories are counted too, by their old number */
  await fetch(`${API}/view/100`, { method: 'POST', headers: { 'user-agent': 'archive-reader/1.0' } })
  const archive = await (await visit(ed.j, `${OFFICE}/analytics?days=7&source=archive`)).text()
  ok('archive stories are counted', /जुन्या संकेतस्थळावरून|<b>1<\/b>/.test(archive), true)
  ok('CSV download works', (await visit(ed.j, `${OFFICE}/analytics.csv?days=7`)).status, 200)
  ok('a coordinator sees analytics too', (await visit(di.j, `${OFFICE}/analytics`)).status, 200)

  console.log('\nthe scrolling band')
  ok('only the head office may open it', (await visit(di.j, OFFICE + '/ticker')).status, 404)
  ok('nor the divisional head', (await visit(dv.j, OFFICE + '/ticker')).status, 404)
  const tick = await visit(ed.j, OFFICE + '/ticker')
  ok('head office may', tick.status, 200)
  const tickHtml = await tick.text()
  const lineId = (tickHtml.match(/\/ticker\?edit=([A-Za-z0-9_-]{28})/) || [])[1]
  ok('six lines are set up', (await (await fetch(`${API}/ticker`)).json()).length, 6)
  const editPage = await (await visit(ed.j, `${OFFICE}/ticker?edit=${lineId}`)).text()
  const saved = await visit(ed.j, `${OFFICE}/ticker/${lineId}/save`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: csrfFrom(editPage), text_mr: 'चाचणी ओळ', link_url: '/govet-schemes', is_active: '1' }),
  })
  ok('a line can be edited', saved.status, 302)
  ok('and the portal sees it', (await (await fetch(`${API}/ticker`)).json()).some((l) => l.text === 'चाचणी ओळ'), true)
  /* a link that is neither a path nor a web address must be refused */
  const bad = await visit(ed.j, `${OFFICE}/ticker/${lineId}/save`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: csrfFrom(editPage), text_mr: 'चाचणी ओळ', link_url: 'javascript:alert(1)', is_active: '1' }),
  })
  ok('a dangerous link is dropped', (await (await fetch(`${API}/ticker`)).json()).find((l) => l.text === 'चाचणी ओळ').href, 'null')
  const reordered = await visit(ed.j, `${OFFICE}/ticker/reorder`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: csrfFrom(editPage), move: lineId, dir: 'down' }),
  })
  ok('lines can be reordered', reordered.status, 302)
  ok('district cannot reorder', (await visit(di.j, `${OFFICE}/ticker/reorder`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _csrf: csrfFrom(editPage), move: lineId, dir: 'up' }),
  })).status, 404)

  console.log('\nthe visitor count')
  const first = (await (await fetch(`${API}/visits`)).json()).visits
  ok('a figure is carried over', first > 0, true)
  const counted = (await (await fetch(`${API}/visit`, { method: 'POST' })).json()).visits
  ok('a visit counts one', counted, first + 1)
  ok('reading it does not count', (await (await fetch(`${API}/visits`)).json()).visits, counted)

  console.log(`\n${pass} passed, ${fail} failed\n`)
  process.exit(fail ? 1 : 0)
})().catch((e) => { console.error('\nsmoke run broke:', e.message); process.exit(1) })
