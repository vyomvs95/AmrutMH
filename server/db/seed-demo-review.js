'use strict'
/* SAMPLE STORIES WAITING FOR REVIEW. */

const db = require('../src/core/db')
const ids = require('../src/core/ids')
const auth = require('../src/core/auth')

const DEMO = 'चाचणी खाते — '

/* district (English name), section slug, headline, opening line. */
const STORIES = [
  ['Nashik', 'beneficiary-story',
   'नाशिकमधील सुनीता पवार यांनी अमृत कर्ज योजनेतून उभारला शिवणकामाचा व्यवसाय',
   'अमृत संस्थेच्या कर्ज व्याजपरतावा योजनेचा लाभ घेऊन नाशिक येथील सुनीता पवार यांनी स्वतःचा शिवणकामाचा व्यवसाय सुरू केला आहे.'],
  ['Pune', 'successful-entrepreneur',
   'पुण्यातील तरुणाने अमृतच्या प्रशिक्षणातून सुरू केला ड्रोन सेवा व्यवसाय',
   'अमृत संस्थेमार्फत घेण्यात आलेल्या मोफत ड्रोन पायलट प्रशिक्षणानंतर पुणे येथील अनिकेत जाधव यांनी शेतीसाठी ड्रोन फवारणी सेवा सुरू केली आहे.'],
  ['Chhatrapati Sambhajinagar', 'smart-farmer',
   'छत्रपती संभाजीनगरात ठिबक सिंचनातून दुप्पट उत्पादन',
   'अमृतच्या कृषी प्रशिक्षणानंतर ठिबक सिंचन पद्धतीचा अवलंब करून स्थानिक शेतकऱ्यांनी उत्पादनात लक्षणीय वाढ नोंदवली आहे.'],
  ['Amravati', 'women-power',
   'अमरावतीत महिला बचत गटाच्या पापड उद्योगाला अमृतचे पाठबळ',
   'अमृत संस्थेच्या सहकार्याने सुरू झालेल्या पापड उद्योगातून अमरावती जिल्ह्यातील बारा महिलांना नियमित रोजगार मिळाला आहे.'],
  ['Nagpur', 'amrut-events',
   'नागपुरात अमृत संस्थेचा रोजगार मेळावा; तीनशेहून अधिक तरुणांचा सहभाग',
   'नागपूर येथे आयोजित रोजगार मेळाव्यात विविध कंपन्यांनी सहभाग घेतला असून तीनशेहून अधिक उमेदवारांनी नोंदणी केली.'],
  ['Gondia', 'capable-student',
   'गोंदियातील विद्यार्थिनीचे स्पर्धा परीक्षेत यश; अमृतच्या अभ्यासिकेचा आधार',
   'अमृत संस्थेच्या मोफत अभ्यासिकेत तयारी करून गोंदिया येथील प्रियांका मेश्राम यांनी राज्यसेवा पूर्वपरीक्षा उत्तीर्ण केली आहे.'],
  ['Ratnagiri', 'amrut-service',
   'रत्नागिरीत अमृततर्फे मोफत आरोग्य तपासणी शिबिर',
   'रत्नागिरी जिल्ह्यातील दुर्गम भागात आयोजित शिबिरात सातशेहून अधिक नागरिकांची आरोग्य तपासणी करण्यात आली.'],
]

const NOTE = '\n\n(ही चाचणीसाठी तयार केलेली नमुना बातमी आहे.)'

;(async () => {
  await db.connect()
  const now = new Date().toISOString()

  if (process.argv.includes('--clear')) {
    const r = await db.run("DELETE FROM stories WHERE body LIKE ?", ['%नमुना बातमी आहे.)%'])
    const u = await db.run('DELETE FROM users WHERE email LIKE ?', ['demo-%@amrutmaharashtra.org'])
    console.log(`removed ${r.changes} sample stories and ${u.changes} sample accounts`)
    await db.close(); return
  }

  /* one photograph already on disk, reused so the stories are not bare. */
  const photo = await db.get('SELECT file_path, widths, img_w, img_h FROM story_images ORDER BY id DESC LIMIT 1')

  let made = 0
  for (const [districtEn, sectionSlug, title, opening] of STORIES) {
    const district = await db.get('SELECT id, name_mr FROM districts WHERE name_en = ?', [districtEn])
    const section = await db.get('SELECT id FROM sections WHERE slug = ?', [sectionSlug])
    if (!district || !section) { console.log('skipped', districtEn, sectionSlug); continue }

    const email = `demo-${districtEn.toLowerCase().replace(/[^a-z]/g, '')}@amrutmaharashtra.org`
    let author = await db.get('SELECT id FROM users WHERE email = ?', [email])
    if (!author) {
      const r = await db.insert(
        `INSERT INTO users (public_id, name, email, password_hash, role, district_id, is_active, created_at)
         VALUES (?,?,?,?,'district',?,1,?)`,
        [ids.newPublicId(), DEMO + district.name_mr, email, auth.hashPassword(ids.newPublicId()), district.id, now])
      author = { id: r.id }
    }

    const already = await db.get('SELECT id FROM stories WHERE title = ?', [title])
    if (already) continue

    /* the last one is already approved, so the editor's queue shows both states. */
    const status = made === STORIES.length - 1 ? 'approved' : 'submitted'
    const story = await db.insert(
      `INSERT INTO stories (public_id, title, body, section_id, district_id, author_id, status,
                            created_at, updated_at, submitted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [ids.newPublicId(), title, opening + NOTE, section.id, district.id, author.id, status, now, now, now])

    if (photo && made % 2 === 0) {
      await db.run(
        `INSERT INTO story_images (public_id, story_id, file_path, widths, img_w, img_h, sort_order, created_at)
         VALUES (?,?,?,?,?,?,0,?)`,
        [ids.newPublicId(), story.id, photo.file_path, photo.widths, photo.img_w, photo.img_h, now])
    }
    made++
  }

  const waiting = await db.all("SELECT status, COUNT(*) AS n FROM stories WHERE status IN ('submitted','approved') GROUP BY status")
  console.log(`${made} sample stories added — queue now holds ${waiting.map((r) => r.status + '=' + r.n).join(', ')}`)
  console.log('Clear them with:  node db/seed-demo-review.js --clear')
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
