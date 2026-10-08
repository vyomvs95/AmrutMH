// Turns the full live-site scrape (scrape/, from scripts/scrape-live.py) into
// the data the site ships:
//
//   src/data/content.json      categories with their 24 newest items + true totals
//                              (bundled: home, hero, rail, footer, assistant)
//   src/data/article-ids.json  every story id we hold in full (which cards link)
//   public/data/cat/<slug>.json  every item in a category (fetched by the category page)
//   public/data/a/<id>.json      one full article each (fetched by the article page)
//   public/data/search.json      [id, title, catKey] for the assistant's search
//
// Article text is kept word for word. Run after a fresh scrape:
//   node scripts/build-data.mjs

import fs from 'node:fs/promises'
import path from 'node:path'

const SCRAPE = 'scrape'
const content = JSON.parse(await fs.readFile('src/data/content.json', 'utf8'))
const scraped = JSON.parse(await fs.readFile(`${SCRAPE}/categories.json`, 'utf8'))

const slugify = (s) =>
  String(s).toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

await fs.rm('public/data', { recursive: true, force: true })
await fs.mkdir('public/data/cat', { recursive: true })
await fs.mkdir('public/data/a', { recursive: true })

/* Which category a story belongs to: the first category that lists it,
   in the order the live homepage presents them. */
const order = Object.keys(content.categories)
const catOf = {}
for (const key of order) {
  for (const it of scraped[key]?.items || []) catOf[it.id] ??= key
}

const held = {}
let written = 0
for (const id of Object.keys(catOf)) {
  let a
  try {
    a = JSON.parse(await fs.readFile(`${SCRAPE}/articles/${id}.json`, 'utf8'))
  } catch {
    continue
  }
  if (!a.title) continue
  const key = catOf[id]
  const list = scraped[key].items
  const at = list.findIndex((x) => x.id === id)
  const related = [...list.slice(at + 1, at + 4), ...list.slice(Math.max(0, at - 3), at)]
    .filter((x) => x.id !== id)
    .slice(0, 3)
  await fs.writeFile(
    `public/data/a/${id}.json`,
    JSON.stringify({ ...a, cat: key, related })
  )
  held[id] = 1
  written++
}

const search = []
for (const key of order) {
  const items = (scraped[key]?.items || []).filter((x) => held[x.id] || true)
  content.categories[key].total = items.length
  content.categories[key].items = items.slice(0, 24)
  await fs.writeFile(`public/data/cat/${slugify(key)}.json`, JSON.stringify(items))
  for (const it of items) if (catOf[it.id] === key) search.push([it.id, it.t, key])
}

content.meta.collected = new Date().toISOString().slice(0, 10)
content.meta.storiesHeld = written
await fs.writeFile('src/data/content.json', JSON.stringify(content))
await fs.writeFile('src/data/article-ids.json', JSON.stringify(held))
await fs.writeFile('public/data/search.json', JSON.stringify(search))

const kb = async (p) => Math.round((await fs.stat(p)).size / 1024)
console.log(`articles written   ${written}`)
console.log(`categories         ${order.length}  (${order.map((k) => content.categories[k].total).join(', ')})`)
console.log(`content.json       ${await kb('src/data/content.json')} KB`)
console.log(`article-ids.json   ${await kb('src/data/article-ids.json')} KB`)
console.log(`search.json        ${await kb('public/data/search.json')} KB`)
console.log(path.resolve('public/data'))
