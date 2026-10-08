'use strict'
/* The placements that can be sold, and what each costs.

   IMPORTANT: these prices are PLACEHOLDERS. On the call the client said the
   rate chart from their other portal (heard as "RPTO India") sits with Hemant,
   and that AMRUT's 13-15 lakh monthly viewership means the numbers there need
   raising. Replace the figures below with theirs before anything is sold. */

const db = require('../src/core/db')
const ids = require('../src/core/ids')

const SLOTS = [
  ['popup',     'पॉपअप जाहिरात',        'Popup on arrival',   800, 600,
   'संकेतस्थळ उघडताच दिसते; वाचक ती बंद करू शकतो.'],
  ['hero',      'मुख्य पट्टिका',          'Hero rotation',     1600, 900,
   'मुख्यपृष्ठावरील फिरत्या बातम्यांमध्ये एक जागा.'],
  ['fullwidth', 'पूर्ण रुंदी पट्टिका',     'Full-width banner', 1400, 150,
   'पानाच्या पूर्ण रुंदीची आडवी पट्टिका.'],
  ['footer',    'तळातील पट्टिका',        'Above the footer',  1200, 150,
   'पानाच्या तळाशी, फूटरच्या वर.'],
  ['side',      'बाजूची पट्टिका',         'Side banner',        300, 600,
   'आतील पानांवर बाजूला.'],
  ['instory',   'बातमीतील जाहिरात',       'Inside a story',     800, 200,
   'बातमीच्या मजकुरात, विषयाशी जुळणारी.'],
]

/* placeholder rates in rupees: [2 days, 7, 14, 30] */
const RATES = {
  popup:     [4000, 12000, 20000, 35000],
  hero:      [5000, 15000, 25000, 45000],
  fullwidth: [3000,  9000, 15000, 26000],
  footer:    [1500,  4500,  8000, 14000],
  side:      [2000,  6000, 10000, 18000],
  instory:   [2500,  7500, 12500, 22000],
}
const DAYS = [2, 7, 14, 30]

;(async () => {
  await db.connect()
  await require('./migrate').migrate(true)
  let order = 0
  for (const [code, mr, en, w, h, note] of SLOTS) {
    order += 1
    let slot = await db.get('SELECT id FROM ad_slots WHERE code = ?', [code])
    if (!slot) {
      const r = await db.insert(
        `INSERT INTO ad_slots (public_id, code, name_mr, name_en, width_px, height_px, note_mr, sort_order, is_active)
         VALUES (?,?,?,?,?,?,?,?,1)`, [ids.newPublicId(), code, mr, en, w, h, note, order])
      slot = { id: r.id }
    }
    for (let i = 0; i < DAYS.length; i++) {
      const has = await db.get('SELECT id FROM ad_rates WHERE slot_id = ? AND days = ?', [slot.id, DAYS[i]])
      if (!has) {
        await db.run('INSERT INTO ad_rates (slot_id, days, amount_inr) VALUES (?,?,?)',
          [slot.id, DAYS[i], RATES[code][i]])
      }
    }
  }
  const s = Number((await db.get('SELECT COUNT(*) AS n FROM ad_slots')).n)
  const r = Number((await db.get('SELECT COUNT(*) AS n FROM ad_rates')).n)
  console.log(`${s} placements, ${r} rates ready`)
  console.log('Reminder: the rates are placeholders until Hemant\'s chart arrives.')
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
