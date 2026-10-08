'use strict'
/* Fills in the things that do not change: Maharashtra's 6 divisions and
   36 districts, the 16 sections of the portal, and one starting account for
   each of the three permission levels.
   Safe to run more than once - it skips anything already there. */

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const db = require('../src/core/db')
const ids = require('../src/core/ids')
const auth = require('../src/core/auth')

/* Divisions and their districts, as the state is actually organised.
   Note for the client: the brief said "6 districts under each divisional
   head". In practice the count runs from 5 to 8. Seeded as it really is. */
const DIVISIONS = [
  ['कोकण', 'Konkan', [
    ['मुंबई शहर', 'Mumbai City'], ['मुंबई उपनगर', 'Mumbai Suburban'], ['ठाणे', 'Thane'],
    ['पालघर', 'Palghar'], ['रायगड', 'Raigad'], ['रत्नागिरी', 'Ratnagiri'], ['सिंधुदुर्ग', 'Sindhudurg'],
  ]],
  ['पुणे', 'Pune', [
    ['पुणे', 'Pune'], ['सातारा', 'Satara'], ['सांगली', 'Sangli'],
    ['सोलापूर', 'Solapur'], ['कोल्हापूर', 'Kolhapur'],
  ]],
  ['नाशिक', 'Nashik', [
    ['नाशिक', 'Nashik'], ['धुळे', 'Dhule'], ['नंदुरबार', 'Nandurbar'],
    ['जळगाव', 'Jalgaon'], ['अहिल्यानगर', 'Ahilyanagar'],
  ]],
  ['छत्रपती संभाजीनगर', 'Chhatrapati Sambhajinagar', [
    ['छत्रपती संभाजीनगर', 'Chhatrapati Sambhajinagar'], ['जालना', 'Jalna'], ['परभणी', 'Parbhani'],
    ['हिंगोली', 'Hingoli'], ['बीड', 'Beed'], ['नांदेड', 'Nanded'],
    ['धाराशिव', 'Dharashiv'], ['लातूर', 'Latur'],
  ]],
  ['अमरावती', 'Amravati', [
    ['अमरावती', 'Amravati'], ['अकोला', 'Akola'], ['वाशिम', 'Washim'],
    ['बुलढाणा', 'Buldhana'], ['यवतमाळ', 'Yavatmal'],
  ]],
  ['नागपूर', 'Nagpur', [
    ['नागपूर', 'Nagpur'], ['वर्धा', 'Wardha'], ['भंडारा', 'Bhandara'],
    ['गोंदिया', 'Gondia'], ['चंद्रपूर', 'Chandrapur'], ['गडचिरोली', 'Gadchiroli'],
  ]],
]

/* The 16 sections, exactly as the live portal names them. */
const SECTIONS = [
  ['amrut-events', 'Amrut Events', 'अमृत घडामोडी'],
  ['beneficiary-story', 'Beneficiary Story', 'लाभार्थी स्टोरी'],
  ['successful-entrepreneur', 'Successful Entrepreneur', 'यशस्वी उद्योजक'],
  ['smart-farmer', 'Smart Farmer', 'स्मार्ट शेतकरी'],
  ['capable-student', 'Capable Student', 'सक्षम विद्यार्थी'],
  ['women-power', 'Women Power', 'स्त्रीशक्ती'],
  ['social-situation', 'Social Situation', 'सामाजिक परिवर्तक'],
  ['govet-schemes', 'Govet_Schemes', 'शासकीय योजना'],
  ['news', 'News', 'वार्ता'],
  ['amrut-service', 'Amrut Service', 'अमृत सेवाकार्य'],
  ['blog', 'Blog', 'ब्लॉग'],
  ['articles', 'Articles', 'लेख'],
  ['words-amrut', 'Words Amrut', 'शब्दामृत'],
  ['today-special', 'Today Special', 'दिनविशेष'],
  ['spirituality', 'Spirituality', 'अध्यात्म'],
  ['tourism', 'Tourism', 'पर्यटन'],
]

const password = () => crypto.randomBytes(9).toString('base64url')

;(async () => {
  await db.connect()
  await db.applySchema()
  const now = new Date().toISOString()

  /* divisions + districts */
  for (const [mr, en, districts] of DIVISIONS) {
    let div = await db.get('SELECT id FROM divisions WHERE name_en = ?', [en])
    if (!div) {
      const r = await db.insert('INSERT INTO divisions (public_id, name_mr, name_en) VALUES (?,?,?)',
        [ids.newPublicId(), mr, en])
      div = { id: r.id }
    }
    for (const [dmr, den] of districts) {
      const has = await db.get('SELECT id FROM districts WHERE name_en = ?', [den])
      if (!has) {
        await db.run('INSERT INTO districts (public_id, division_id, name_mr, name_en) VALUES (?,?,?,?)',
          [ids.newPublicId(), div.id, dmr, den])
      }
    }
  }

  /* sections */
  let order = 0
  for (const [slug, key, mr] of SECTIONS) {
    order += 1
    const has = await db.get('SELECT id FROM sections WHERE slug = ?', [slug])
    if (!has) {
      await db.run('INSERT INTO sections (public_id, slug, key_en, name_mr, sort_order) VALUES (?,?,?,?,?)',
        [ids.newPublicId(), slug, key, mr, order])
    }
  }

  /* one starting account per permission level */
  const gondia = await db.get('SELECT id FROM districts WHERE name_en = ?', ['Gondia'])
  const nagpur = await db.get('SELECT id FROM divisions WHERE name_en = ?', ['Nagpur'])
  const starters = [
    ['चाचणी खाते — संपादक', 'editor@amrutmaharashtra.org', 'editor', null, null],
    ['चाचणी खाते — विभागीय प्रमुख', 'nagpur@amrutmaharashtra.org', 'divisional', null, nagpur.id],
    ['चाचणी खाते — जिल्हा समन्वयक', 'gondia@amrutmaharashtra.org', 'district', gondia.id, null],
  ]

  const made = []
  for (const [name, email, role, districtId, divisionId] of starters) {
    const has = await db.get('SELECT id FROM users WHERE email = ?', [email])
    if (has) continue
    const pw = password()
    await db.run(
      `INSERT INTO users (public_id, name, email, phone, password_hash, role, district_id, division_id, is_active, created_at)
       VALUES (?,?,?,?,?,?,?,?,1,?)`,
      [ids.newPublicId(), name, email, null, auth.hashPassword(pw), role, districtId, divisionId, now])
    made.push([email, pw, role])
  }

  const counts = {
    divisions: Number((await db.get('SELECT COUNT(*) AS n FROM divisions')).n),
    districts: Number((await db.get('SELECT COUNT(*) AS n FROM districts')).n),
    sections: Number((await db.get('SELECT COUNT(*) AS n FROM sections')).n),
    users: Number((await db.get('SELECT COUNT(*) AS n FROM users')).n),
  }
  console.log('Ready:', counts)

  if (made.length) {
    const lines = made.map(([e, p, r]) => `${r.padEnd(11)} ${e}  password: ${p}`)
    const file = path.join(__dirname, '..', 'data', 'first-logins.txt')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, lines.join('\n') + '\n', { mode: 0o600 })
    console.log('\nStarting accounts (shown once, also saved to data/first-logins.txt):')
    for (const l of lines) console.log('  ' + l)
    console.log('\nChange these passwords before the office is reachable from the internet.')
  } else {
    console.log('Accounts already exist - no new passwords made.')
  }

  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
