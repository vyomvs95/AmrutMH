// Emits robots.txt and sitemap.xml into dist/ after the Vite build.
// The live site has neither, which is why ~3,000 Marathi articles are
// close to invisible in search (audit finding F-05).

import fs from 'node:fs/promises'

// Vercel exposes the real production domain at build time, so the sitemap
// never hard-codes a guess. SITE_URL overrides once a custom domain exists.
const SITE =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:5173'

const content = JSON.parse(await fs.readFile('src/data/content.json', 'utf8'))
// every migrated story: [id, title, categoryKey]
const index = JSON.parse(await fs.readFile('public/data/search.json', 'utf8'))

const slugify = (s) =>
  String(s).toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const titleSlug = (s) =>
  String(s).trim().replace(/[|/\\?#%.,!'"“”‘’;:()[\]]/g, '').replace(/\s+/g, '-').slice(0, 60).replace(/-+$/, '')

const urls = [{ loc: '/', priority: '1.0' }]

for (const c of Object.values(content.categories)) {
  urls.push({ loc: `/${slugify(c.slug)}`, priority: '0.8' })
}

urls.push({ loc: '/about-us', priority: '0.7' }, { loc: '/amrut-parivar-survey', priority: '0.7' })

for (const [id, title, key] of index) {
  urls.push({ loc: `/${slugify(key)}/${id}/${titleSlug(title)}`, priority: '0.6' })
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${SITE}${encodeURI(u.loc)}</loc>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>
`.replace('www.sitemap.org', 'www.sitemaps.org')

await fs.writeFile('dist/sitemap.xml', xml)

await fs.writeFile(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
)

console.log(`sitemap.xml  ${urls.length} urls`)
console.log('robots.txt   written')
