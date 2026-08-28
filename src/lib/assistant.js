import { categories, schemes, schemeUrl, org, districts, districtMr } from './content'
import offices from '../data/offices.json'

/**
 * The assistant's answers are generated from this site's own content —
 * the scheme list, the eligibility rules the articles state, the district
 * data, and the 333 collected stories. Nothing is invented: where the
 * portal genuinely does not publish something (most district office
 * addresses), the assistant says so rather than guessing.
 */

const ALL = categories.flatMap((c) => c.items)

const CASTES =
  'ब्राह्मण, कायस्थ, कोमटी/वैश्य, मारवाडी, पटेल, राजपूत, यलमार, अय्यंगार, राजपुरोहित, पाटीदार, नायर, नायडू, कम्मा, कानबी, सिंधी, बनिया, बंगाली, त्यागी, सेनगुनथर, गुजराथी, जाट, लोहाना, हिंदू नेपाळी व भूमिहार'

const has = (q, ...words) => words.some((w) => q.includes(w))

/** A reply is { text, links?, chips? } */
const link = (label, to, external = false) => ({ label, to, external })

export const GREETING = {
  text: 'नमस्कार. मी अमृत महाराष्ट्रचा सहाय्यक. योजना, पात्रता, अर्ज आणि जिल्हा कार्यालयांबद्दल विचारा — किंवा एखादा विषय शोधा.',
  chips: ['मी पात्र आहे का?', 'कोणत्या योजना आहेत?', 'अर्ज कसा करायचा?', 'जिल्हा कार्यालय कुठे आहे?'],
}

export function answer(rawInput) {
  const q = String(rawInput || '').toLowerCase().trim()
  if (!q) return GREETING

  /* ---- eligibility ---- */
  if (has(q, 'पात्र', 'पात्रता', 'कोण', 'eligib', 'qualify', 'मी घेऊ', 'लाभ घेऊ')) {
    return {
      text: `अमृतच्या योजना खुल्या प्रवर्गातील अशा जातींसाठी आहेत, ज्यांना इतर कोणत्याही शासकीय महामंडळाचा लाभ मिळत नाही.\n\n• वार्षिक कौटुंबिक उत्पन्न ₹८ लाखांपेक्षा कमी\n• महाराष्ट्राचे रहिवासी\n• समाविष्ट जाती: ${CASTES}\n\nअंतिम पात्रता अमृतच्या अधिकृत पोर्टलवर तपासली जाते.`,
      links: [link('अधिकृत पोर्टलवर तपासा', org.portal, true)],
      chips: ['कोणत्या योजना आहेत?', 'अर्ज कसा करायचा?', 'कागदपत्रे कोणती लागतात?'],
    }
  }

  /* ---- income ---- */
  if (has(q, 'उत्पन्न', 'income', 'लाख', 'पगार')) {
    return {
      text: 'वार्षिक कौटुंबिक उत्पन्न ₹८ लाखांपेक्षा कमी असणे आवश्यक आहे. उत्पन्नाचा दाखला अर्जासोबत जोडावा लागतो.',
      chips: ['मी पात्र आहे का?', 'कागदपत्रे कोणती लागतात?'],
    }
  }

  /* ---- documents ---- */
  if (has(q, 'कागदपत्र', 'document', 'दाखला', 'कागद')) {
    return {
      text: 'साधारणपणे लागणारी कागदपत्रे: आधार कार्ड, जातीचा दाखला, उत्पन्नाचा दाखला, रहिवासी दाखला, बँक खाते तपशील आणि व्यवसायाशी संबंधित कागदपत्रे.\n\nप्रत्येक योजनेची नेमकी यादी अर्जाच्या वेळी पोर्टलवर दिसते — ती अंतिम मानावी.',
      links: [link('अर्जाचे पोर्टल', org.portal, true)],
      chips: ['अर्ज कसा करायचा?', 'मी पात्र आहे का?'],
    }
  }

  /* ---- a specific scheme ---- */
  const hit = schemes.find((s) => {
    if (s.id === '146' && has(q, 'व्याज', 'परतावा', 'interest', 'कर्ज')) return true
    if (s.id === '264' && has(q, 'सोलार', 'सौर', 'सूर्यमित्र', 'solar')) return true
    if (s.id === '263' && has(q, 'बेकरी', 'bakery')) return true
    if (s.id === '245' && has(q, 'ड्रोन', 'drone')) return true
    return false
  })
  if (hit) {
    const stories = search(hit.mr.split(' ')[0], 3)
    return {
      text: `${hit.mr}\n${hit.note}\n\nपात्रता: खुल्या प्रवर्गातील आर्थिकदृष्ट्या दुर्बल घटक, वार्षिक उत्पन्न ₹८ लाखांपेक्षा कमी.\nअर्ज अमृतच्या अधिकृत पोर्टलवर स्वीकारले जातात.`,
      links: [
        link('या योजनेसाठी अर्ज करा', schemeUrl(hit.id), true),
        ...stories.map((s) => link(s.title.slice(0, 52), s.href)),
      ],
      chips: ['कोणत्या योजना आहेत?', 'कागदपत्रे कोणती लागतात?'],
    }
  }

  /* ---- scheme list ---- */
  if (has(q, 'योजना', 'scheme', 'प्रशिक्षण', 'training', 'काय आहे', 'कोणत्या')) {
    return {
      text: 'सध्या अर्ज सुरू असलेल्या अमृतच्या योजना:',
      links: schemes.map((s) => link(`${s.mr} — ${s.note}`, schemeUrl(s.id), true)),
      chips: ['मी पात्र आहे का?', 'अर्ज कसा करायचा?'],
    }
  }

  /* ---- how to apply ---- */
  if (has(q, 'अर्ज', 'apply', 'नोंदणी', 'register', 'कसा', 'कसे')) {
    return {
      text: `अर्ज करण्यासाठी:\n\n१. अमृतच्या अधिकृत पोर्टलवर जा\n२. योजना निवडा आणि पात्रता तपासा\n३. कागदपत्रे अपलोड करून अर्ज सादर करा\n\nअडचण आल्यास ${org.phone} वर संपर्क साधा किंवा आपल्या जिल्हा कार्यालयात भेट द्या.`,
      links: [
        link('अर्जाचे पोर्टल', org.portal, true),
        ...schemes.map((s) => link(s.mr, schemeUrl(s.id), true)),
      ],
      chips: ['कागदपत्रे कोणती लागतात?', 'जिल्हा कार्यालय कुठे आहे?'],
    }
  }

  /* ---- district office ---- */
  if (has(q, 'कार्यालय', 'जिल्हा', 'office', 'पत्ता', 'address', 'कुठे')) {
    const named = Object.keys(offices).find((k) => q.includes(k) || q.includes(districtMr(k).toLowerCase()))
    if (named) {
      const o = offices[named]
      return {
        text: `${districtMr(named)} जिल्हा कार्यालय:\n\n${o.address}${o.phone ? `\n\nसंपर्क: ${o.phone}` : ''}`,
        chips: ['अर्ज कसा करायचा?', 'मी पात्र आहे का?'],
      }
    }
    return {
      text: `अमृतची कार्यालये राज्यातील सर्व ३६ जिल्ह्यांत आहेत.\n\nया संकेतस्थळावर सध्या फक्त सोलापूर कार्यालयाचा संपूर्ण पत्ता प्रसिद्ध केलेला आहे — उर्वरित जिल्ह्यांचे पत्ते अद्याप उपलब्ध नाहीत. तोपर्यंत मुख्य कार्यालयाशी संपर्क साधावा.\n\nमुख्य कार्यालय: ${org.address}\nदूरध्वनी: ${org.phone}`,
        chips: ['सोलापूर कार्यालय', 'अर्ज कसा करायचा?'],
    }
  }

  /* ---- contact ---- */
  if (has(q, 'संपर्क', 'contact', 'फोन', 'phone', 'ईमेल', 'email', 'नंबर')) {
    return {
      text: `अमृत महाराष्ट्र संपर्क:\n\nदूरध्वनी: ${org.phone}\nईमेल: ${org.email}\nपत्ता: ${org.address}`,
      chips: ['जिल्हा कार्यालय कुठे आहे?', 'अर्ज कसा करायचा?'],
    }
  }

  /* ---- about ---- */
  if (has(q, 'अमृत म्हणजे', 'अमृत काय', 'about', 'संस्था', 'माहिती')) {
    return {
      text: `${org.mr} ही ${org.sub} आहे.\n\nखुल्या प्रवर्गातील ज्या जातींना इतर कोणत्याही शासकीय महामंडळाचा लाभ मिळत नाही, अशा जातींमधील आर्थिकदृष्ट्या दुर्बल घटक हा अमृतचा लक्ष्यित गट आहे. प्रशिक्षण, व्याज परतावा आणि उद्योजकता या माध्यमांतून अमृत काम करते.`,
      links: [link('आमच्याविषयी', '/'), link('अधिकृत संकेतस्थळ', org.portal, true)],
      chips: ['कोणत्या योजना आहेत?', 'मी पात्र आहे का?'],
    }
  }

  /* ---- category browse ---- */
  const cat = categories.find((c) => q.includes(c.mr.toLowerCase()))
  if (cat) {
    return {
      text: `${cat.mr} — ${cat.blurb}. एकूण ${cat.total} बातम्या.`,
      links: [link(`${cat.mr} पहा`, `/${cat.slug}`), ...cat.items.slice(0, 3).map((i) => link(i.title.slice(0, 52), i.href))],
    }
  }

  /* ---- fall back to searching the stories ---- */
  const found = search(q, 4)
  if (found.length) {
    return {
      text: `"${rawInput.trim()}" शी संबंधित ${found.length} गोष्टी सापडल्या:`,
      links: found.map((s) => link(`${s.title.slice(0, 56)} · ${s.catMr}`, s.href)),
      chips: ['कोणत्या योजना आहेत?', 'मी पात्र आहे का?'],
    }
  }

  return {
    text: 'याबद्दल या संकेतस्थळावर मला माहिती सापडली नाही. योजना, पात्रता, अर्ज, कागदपत्रे किंवा जिल्हा कार्यालय याबद्दल विचारून पहा — किंवा थेट संपर्क साधा.',
    links: [link(`दूरध्वनी ${org.phone}`, `tel:${org.phone.replace(/\s/g, '')}`, true)],
    chips: ['कोणत्या योजना आहेत?', 'मी पात्र आहे का?', 'संपर्क'],
  }
}

/** Keyword search across every collected story. */
export function search(q, limit = 6) {
  const terms = String(q).toLowerCase().split(/\s+/).filter((t) => t.length > 1)
  if (!terms.length) return []
  return ALL.map((item) => {
    const hay = `${item.title} ${item.excerpt} ${item.catMr}`.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (item.title.toLowerCase().includes(t)) score += 3
      else if (hay.includes(t)) score += 1
    }
    return { item, score }
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item)
}

export const districtList = districts
