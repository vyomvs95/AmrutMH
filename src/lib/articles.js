import rawArticles from '../data/articles.json'
import { categories, img, districtMr } from './content'

const titleSlug = (s) =>
  String(s)
    .trim()
    .replace(/[|/\\?#%.,!'"“”‘’;:()[\]]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '')

/**
 * Full article bodies. Imported only by the article route, which is
 * code-split, so these 250KB never reach a reader who stays on the
 * homepage.
 *
 * The live articles end with two blocks repeated verbatim across the
 * whole archive: the district office address, and a paragraph
 * explaining who AMRUT is. They are separated out here so each can be
 * given its own treatment instead of being read as part of the story.
 * No wording is altered.
 */
export const articles = Object.fromEntries(
  Object.entries(rawArticles).map(([id, a]) => {
    const cat = categories.find((c) => c.key === a.cat)
    const office = a.body.find((p) => /अमृत \(AMRUT\)\s*जिल्हा कार्यालय/.test(p)) || null
    const helpline = a.body.find((p) => /^संपर्क\s*:?-?/.test(p)) || null
    const boilerplate = a.body.find((p) => /^अमृत संस्थेविषयी/.test(p)) || null
    const website = a.body.find((p) => /^संकेतस्थळ/.test(p)) || null

    const dropped = new Set([office, helpline, boilerplate, website].filter(Boolean))

    return [
      id,
      {
        ...a,
        catMr: cat?.mr || '',
        catSlug: cat?.slug || '',
        register: cat?.register || 'archive',
        districtMr: districtMr(a.district),
        href: `/${cat?.slug}/${a.id}/${titleSlug(a.title)}`,
        paragraphs: a.body.filter((p) => !dropped.has(p) && p.trim().length > 1),
        office,
        helpline,
        boilerplate,
      },
    ]
  })
)

export const articleById = (id) => articles[String(id)]

/* Hero for an article — prefer an image the article itself carries. */
export function articleHero(a) {
  if (!a) return null
  for (const s of a.images || []) {
    const r = img(s)
    if (r) return r
  }
  return null
}
