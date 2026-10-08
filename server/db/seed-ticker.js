'use strict'
/* The six lines that run in the band under the navigation.
   Seeded once with sensible starting text; after that the head office edits
   them from the office at /office/ticker. */

const db = require('../src/core/db')
const ids = require('../src/core/ids')

const LINES = [
  ['अमृत कर्ज व्याजपरतावा योजना — आता ऑनलाइन अर्ज करा', 'https://mahaamrut.org.in'],
  ['मोफत ड्रोन पायलट प्रशिक्षण — नोंदणी सुरू', '/govet-schemes'],
  ['खुल्या प्रवर्गातील विद्यार्थ्यांसाठी शिष्यवृत्ती योजना', '/govet-schemes'],
  ['जिल्ह्यातील यशोगाथा वाचा — लाभार्थी स्टोरी', '/beneficiary-story'],
  ['अमृत सेवाकार्य — राज्यभरातील उपक्रम', '/amrut-service'],
  ['संपर्क : ३६ जिल्ह्यांतील अमृत कार्यालये', '/about-us'],
]

;(async () => {
  await db.connect()
  await require('./migrate').migrate(true)
  const now = new Date().toISOString()
  let n = 0
  for (let i = 0; i < LINES.length; i++) {
    const at = await db.get('SELECT id FROM ticker_items WHERE position = ?', [i + 1])
    if (at) continue
    await db.run(
      'INSERT INTO ticker_items (public_id, position, text_mr, link_url, is_active, updated_at) VALUES (?,?,?,?,1,?)',
      [ids.newPublicId(), i + 1, LINES[i][0], LINES[i][1], now])
    n++
  }
  console.log(`${n} line(s) added — the band now holds ${Number((await db.get('SELECT COUNT(*) AS c FROM ticker_items')).c)}`)
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
