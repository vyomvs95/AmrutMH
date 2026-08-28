import raw from '../data/content.json'
import images from '../data/images.json'
import rawArticleIds from '../data/article-ids.json'

export const meta = raw.meta
export const org = raw.meta.org
export const palette = raw.meta.palette

/* ------------------------------------------------------------------
   Register
   The audit split the portal in two: stories about people, and the
   institutional record. The categories fall into three groups, and
   each gets a different layout treatment rather than one grid for all.
   ------------------------------------------------------------------ */
const REGISTER = {
  'Beneficiary Story':       'people',
  'Successful Entrepreneur': 'people',
  'Smart Farmer':            'people',
  'Capable Student':         'people',
  'Women Power':             'people',
  'Social Situation':        'people',

  'Govet_Schemes':           'record',
  'News':                    'record',
  'Amrut Events':            'record',
  'Amrut Service':           'record',

  'Blog':                    'archive',
  'Articles':                'archive',
  'Words Amrut':             'archive',
  'Today Special':           'archive',
  'Spirituality':            'archive',
  'Tourism':                 'archive',
}

/* A short Marathi line describing what each section holds. Drawn from
   how the site itself frames these categories — not new editorial. */
const BLURB = {
  'Beneficiary Story':       'अमृतच्या योजनांचा लाभ घेतलेल्या माणसांच्या गोष्टी',
  'Successful Entrepreneur': 'स्वतःचा व्यवसाय उभा करणाऱ्यांचा प्रवास',
  'Smart Farmer':            'आधुनिक शेतीतून समृद्धीकडे जाणारे शेतकरी',
  'Capable Student':         'शिक्षण आणि संशोधनातील तरुणांचे यश',
  'Women Power':             'आत्मनिर्भर होणाऱ्या महिलांची वाटचाल',
  'Social Situation':        'समाजात बदल घडवणारे उपक्रम आणि माणसे',
  'Govet_Schemes':           'अमृत आणि शासनाच्या योजनांची माहिती',
  'News':                    'राज्यभरातील अमृतशी निगडित वार्ता',
  'Amrut Events':            'अमृत संस्थेच्या घडामोडी आणि कार्यक्रम',
  'Amrut Service':           'अमृतचे सेवाकार्य आणि सामाजिक उपक्रम',
  'Blog':                    'विचार, अनुभव आणि निरीक्षणे',
  'Articles':                'विविध विषयांवरील सविस्तर लेख',
  'Words Amrut':             'संतवाणी आणि अभंगांचे रसग्रहण',
  'Today Special':           'इतिहासातील आजचा दिवस',
  'Spirituality':            'परंपरा, श्रद्धा आणि सण',
  'Tourism':                 'महाराष्ट्रातील पाहण्यासारखी ठिकाणे',
}

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/* Marathi title -> URL fragment. Devanagari survives in a URL and is
   what a Marathi reader recognises when a link is shared. */
const titleSlug = (s) =>
  String(s)
    .trim()
    .replace(/[|/\\?#%.,!'"“”‘’;:()\[\]]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '')

export const categories = Object.values(raw.categories).map((c) => ({
  key: c.slug,
  slug: slugify(c.slug),
  mr: c.mr,
  total: c.total,
  register: REGISTER[c.slug] || 'archive',
  blurb: BLURB[c.slug] || '',
  items: c.items.map((it) => ({
    id: it.id,
    title: it.t,
    excerpt: it.x,
    image: it.im,
    author: it.au,
    date: it.dt,
    catKey: c.slug,
    catMr: c.mr,
    catSlug: slugify(c.slug),
    href: `/${slugify(c.slug)}/${it.id}/${titleSlug(it.t)}`,
  })),
}))

export const byRegister = (r) => categories.filter((c) => c.register === r)
export const categoryBySlug = (s) => categories.find((c) => c.slug === s)

const allItems = categories.flatMap((c) => c.items)
export const itemById = (id) => allItems.find((i) => i.id === String(id))

/* Only the ids of the stories we hold in full — enough for the card
   components to decide what is linkable, without pulling the bodies
   into the main bundle. The bodies live in lib/articles.js, imported
   only by the (code-split) article route. */
export const ARTICLE_IDS = new Set(Object.keys(rawArticleIds))

export const hasArticle = (id) => ARTICLE_IDS.has(String(id))

/* ------------------------------------------------------------------
   Schemes
   The four live AMRUT schemes the homepage already advertises, with
   their real banner artwork. These deep-link into the application
   portal — the bridge the current site never builds from its stories.
   ------------------------------------------------------------------ */
const SCHEME_MR = {
  '146': { mr: 'वैयक्तिक व्याज परतावा योजना', note: 'व्यवसाय कर्जावरील व्याजाचा परतावा' },
  '245': { mr: 'रिमोट ड्रोन प्रशिक्षण', note: 'शेती व सर्वेक्षणासाठी ड्रोन कौशल्य' },
  '263': { mr: 'अमृत बेकरी प्रशिक्षण', note: 'बेकरी व्यवसायाचे मोफत प्रशिक्षण' },
  '264': { mr: 'सूर्यमित्र सोलार प्रशिक्षण', note: 'सोलार तंत्रज्ञानाचे निवासी प्रशिक्षण' },
}

const seen = new Set()
export const schemes = Object.entries(raw.schemes)
  .map(([image, v]) => {
    const [id, label] = v.split('|')
    return { id, label, image, ...(SCHEME_MR[id] || { mr: label, note: '' }) }
  })
  .filter((s) => {
    if (seen.has(s.id) || !SCHEME_MR[s.id]) return false
    seen.add(s.id)
    return true
  })

export const schemeUrl = (id) => `https://app.mahaamrut.org.in/amrut-new/scheme/${id}`

/* Match a story to the scheme it describes, so the article can offer a
   real next step instead of ending on "contact your district office". */
const SCHEME_HINTS = [
  ['146', /व्याज परतावा|व्याज ?परतावा|interest/i],
  ['264', /सूर्यमित्र|सोलार|सौर|solar/i],
  ['263', /बेकरी|bakery/i],
  ['245', /ड्रोन|drone/i],
]

export function schemeFor(article) {
  if (!article) return null
  const hay = [article.title, article.summary, ...(article.body || [])].join(' ')
  for (const [id, re] of SCHEME_HINTS) {
    if (re.test(hay)) return schemes.find((s) => s.id === id) || null
  }
  return null
}

/* ------------------------------------------------------------------
   Images
   Every path resolves to responsive WebP built at 400/800/1400.
   ------------------------------------------------------------------ */
/* Manifest is stored compactly as [key, width, height, [widths]] and the
   filenames are rebuilt here — it keeps ~70KB out of the bundle. */
export function img(src) {
  const m = images[src]
  if (!m) return null
  const [key, width, height, widths] = m
  const file = (w) => `/img/${key}-${w}.webp`
  return {
    src: file(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${file(w)} ${w}w`).join(', '),
    width,
    height,
    ratio: +(width / height).toFixed(4),
    portrait: width / height < 0.92,
  }
}

/* Lead image for a card. The cover photo is what the archive stores
   per story, so it is the right source everywhere except the article
   page, which passes its own hero in. */
export function leadImage(item) {
  if (!item) return null
  return item.image ? img(item.image) : null
}

/* Marathi date. The source mixes "August 27, 2026" and "26-08-2026". */
const MONTHS_MR = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर']
const MONTHS_EN = ['january','february','march','april','may','june','july','august','september','october','november','december']

export function dateMr(s) {
  if (!s) return ''
  const long = String(s).match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/)
  if (long) {
    const mi = MONTHS_EN.indexOf(long[1].toLowerCase())
    if (mi >= 0) return `${long[2]} ${MONTHS_MR[mi]} ${long[3]}`
  }
  const dmy = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) return `${+dmy[1]} ${MONTHS_MR[+dmy[2] - 1]} ${dmy[3]}`
  return s
}

/* The archive stores district names inconsistently — mixed case, some
   with underscores. Normalised here, and given their Marathi names,
   which is what belongs on a Marathi-first site. */
const DISTRICT_MR = {
  ahilyanagar: 'अहिल्यानगर', bhandara: 'भंडारा', buldhana: 'बुलढाणा',
  chhatrapati_sambhajinagar: 'छत्रपती संभाजीनगर', dharashiv: 'धाराशिव',
  gadchiroli: 'गडचिरोली', gondia: 'गोंदिया', hingoli: 'हिंगोली',
  jalgaon: 'जळगाव', jalna: 'जालना', kolhapur: 'कोल्हापूर', nagpur: 'नागपूर',
  nanded: 'नांदेड', nashik: 'नाशिक', pune: 'पुणे', satara: 'सातारा',
  solapur: 'सोलापूर', yavatmal: 'यवतमाळ', akola: 'अकोला',
  amaravati: 'अमरावती', wardha: 'वर्धा',
}

export const districtMr = (d) =>
  d ? DISTRICT_MR[String(d).toLowerCase().trim()] || String(d).replace(/_/g, ' ') : ''

/* Districts named across the collected stories — the beginnings of the
   office directory the site has never had. */
export const districts = [...new Set((raw.meta.districts || []).map(districtMr))].sort((a, b) =>
  a.localeCompare(b, 'mr')
)
