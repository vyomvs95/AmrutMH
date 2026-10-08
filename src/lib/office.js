/**
 * Stories written in the back office.
 *
 * The portal's own archive is a static snapshot in this repository. Anything
 * the district coordinators write afterwards lives in the office database, and
 * this module is the one place that knows how to reach it.
 *
 * It tries, in order:
 *   1. the office's public read path, if VITE_OFFICE_API is set at build time
 *      (e.g. VITE_OFFICE_API=https://amrutmaharashtra.org/api)
 *   2. files committed into public/data/office by `npm run export` in server/
 *   3. nothing — and the site behaves exactly as it did before.
 *
 * So the same build works whether or not the office is reachable from the
 * internet, which is still an open question with the client's hosting.
 */

const API = String(import.meta.env?.VITE_OFFICE_API || '').replace(/\/+$/, '')
const STATIC = '/data/office'

/* An office address is 16 random bytes plus a checksum, in base64url. */
export const isOfficeId = (id) => /^[A-Za-z0-9_-]{28}$/.test(String(id || ''))

/* Build the image reference the rest of the site understands. */
function imageRef(im) {
  if (!im) return null
  const widths = Array.isArray(im.widths) && im.widths.length ? im.widths : [400]
  const url = {}
  for (const w of widths) {
    url[w] = API ? `${API}/img/${im.key || im.id}?w=${w}` : `/img/${im.key || im.id}-${w}.webp`
  }
  return { office: true, widths, w: im.w || null, h: im.h || null, url }
}

/* The compact card shape the listings use. */
const toCard = (s) => ({
  id: s.id,
  t: s.title || s.t,
  x: s.summary || s.x || '',
  im: imageRef(s.images ? s.images[0] : s.image),
  au: s.author || '',
  dt: s.date || s.d || '',
  cat: s.cat,
  catSlug: s.catSlug,
})

let indexPromise = null

/** Every published office story, newest first. Never throws. */
export function officeIndex() {
  if (!indexPromise) {
    indexPromise = (async () => {
      if (API) {
        try {
          const r = await fetch(`${API}/stories?limit=50`)
          if (r.ok) return ((await r.json()).items || []).map(toCard)
        } catch { /* fall through to the files */ }
      }
      try {
        const r = await fetch(`${STATIC}/office-stories.json`)
        if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
          return ((await r.json()).items || []).map(toCard)
        }
      } catch { /* nothing published yet, or no office at all */ }
      return []
    })()
  }
  return indexPromise
}

/** Office stories for one category key (the English key, e.g. "Amrut Events"). */
export async function officeItemsFor(catKey) {
  const all = await officeIndex()
  return all.filter((s) => s.cat === catKey)
}

/** One office story in full, in the same shape as the archive's own files. */
export async function officeArticle(id) {
  if (!isOfficeId(id)) return null
  if (API) {
    try {
      const r = await fetch(`${API}/stories/${encodeURIComponent(id)}`)
      if (r.ok) {
        const a = await r.json()
        return { ...a, images: (a.images || []).map(imageRef).filter(Boolean) }
      }
    } catch { /* fall through */ }
  }
  try {
    const r = await fetch(`${STATIC}/a/${encodeURIComponent(id)}.json`)
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
      const a = await r.json()
      return { ...a, images: (a.images || []).map(imageRef).filter(Boolean) }
    }
  } catch { /* no such story */ }
  return null
}

/**
 * Tell the office a story was read.
 *
 * Works for both kinds of story: one written in the office, and one that came
 * across from the old site (those keep their original number). Nothing is sent
 * but the identifier — the office works out "a different reader" from a hash it
 * re-salts every day, and never stores an address.
 *
 * Silent by design: if the office is unreachable, or counting is simply not set
 * up, the reader must never notice.
 */
export function reportView(id) {
  if (!API || !id) return
  try {
    const url = `${API}/view/${encodeURIComponent(id)}`
    if (navigator.sendBeacon) navigator.sendBeacon(url)
    else fetch(url, { method: 'POST', keepalive: true }).catch(() => {})
  } catch { /* counting must never break a page */ }
}

/**
 * The six lines that scroll in the band under the navigation.
 *
 * Same three-step fallback as everything else here: the office when it is
 * reachable, then a file committed into the site, then nothing — in which case
 * the band simply does not appear.
 */
let tickerPromise = null

export function tickerLines() {
  if (!tickerPromise) {
    tickerPromise = (async () => {
      if (API) {
        try {
          const r = await fetch(`${API}/ticker`)
          if (r.ok) return await r.json()
        } catch { /* fall through to the file */ }
      }
      try {
        const r = await fetch('/data/ticker.json')
        if (r.ok && (r.headers.get('content-type') || '').includes('json')) return await r.json()
      } catch { /* no band set up */ }
      return []
    })()
  }
  return tickerPromise
}
