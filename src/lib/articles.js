import { categories, img, districtMr, toItem } from './content'
import { isOfficeId, officeArticle } from './office'

const titleSlug = (s) =>
  String(s)
    .trim()
    .replace(/[|/\\?#%.,!'"“”‘’;:()[\]]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '')

/**
 * Full article bodies — all 3,035 stories migrated from the live site,
 * one JSON file each under /data/a/, fetched only when a reader opens
 * that story.
 *
 * The live articles end with blocks repeated verbatim across the whole
 * archive: the district office address, a helpline, the website line and
 * a paragraph explaining who AMRUT is. They are separated out here so
 * each can be given its own treatment instead of being read as part of
 * the story. No wording is altered.
 */
function shape(a) {
  const cat = categories.find((c) => c.key === a.cat)
  const body = a.body || []
  const office = body.find((p) => /अमृत \(AMRUT\)\s*जिल्हा कार्यालय/.test(p)) || null
  const helpline = body.find((p) => /^संपर्क\s*:?-?/.test(p)) || null
  const boilerplate = body.find((p) => /^अमृत संस्थेविषयी/.test(p)) || null
  const website = body.find((p) => /^संकेतस्थळ/.test(p)) || null
  const dropped = new Set([office, helpline, boilerplate, website].filter(Boolean))

  return {
    ...a,
    catMr: cat?.mr || '',
    catSlug: cat?.slug || '',
    register: cat?.register || 'archive',
    districtMr: districtMr(a.district),
    href: `/${cat?.slug}/${a.id}/${titleSlug(a.title)}`,
    paragraphs: body.filter((p) => !dropped.has(p) && p.trim().length > 1),
    office,
    helpline,
    boilerplate,
    relatedItems: (a.related || []).map((it) => toItem(it, { slug: a.cat, mr: cat?.mr || '' })),
  }
}

const cache = new Map()

/** Resolves to the shaped article, or null if there is no such story. */
export function loadArticle(id) {
  const key = String(id)
  if (!cache.has(key)) {
    /* An office address is unguessable and 28 characters long; the archive's
       own ids are plain numbers. That tells us where to look. */
    if (isOfficeId(key)) {
      cache.set(key, officeArticle(key).then((a) => (a ? shape(a) : null)).catch(() => null))
      return cache.get(key)
    }
    cache.set(
      key,
      fetch(`/data/a/${encodeURIComponent(key)}.json`)
        .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
        .then((a) => (a ? shape(a) : null))
        .catch(() => null)
    )
  }
  return cache.get(key)
}

/* Hero for an article — prefer an image the article itself carries. */
export function articleHero(a) {
  if (!a) return null
  for (const s of a.images || []) {
    const r = img(s)
    if (r) return r
  }
  return null
}
