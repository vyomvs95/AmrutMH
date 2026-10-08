# अमृत महाराष्ट्र — redesign

A Marathi-first redesign of [amrutmaharashtra.org](https://amrutmaharashtra.org/), the
positive-news and information portal of AMRUT (महाराष्ट्र संशोधन, उन्नती व प्रशिक्षण
प्रबोधिनी), an autonomous body of the Government of Maharashtra.

This is the **full migration**: all 3,035 stories across the 16 categories, the
About Us page and the Amrut Parivar survey, moved word for word into the new design.
Old URLs (`news.php?id=`, `category_news.php?category=`, `about_us.php`,
`amrut_family_registration.php`) redirect to their new pages.

Audit that preceded it: `docs/site-audit.html`.

## What is unchanged

The brief was to redesign, not rewrite. So:

- **Every article word for word.** Nothing is edited, shortened or rephrased.
- **The AMRUT palette**, taken from the live stylesheet rather than eyeballed —
  saffron `#F97316`, deep orange `#D35400`, creams `#FFF7ED` / `#FFEDD5`,
  charcoal `#212529`.
- **The identity**: state emblem strip, both logo lockups, the official footer
  declarations, Marathi-first voice.
- **The information architecture**: the same 16 categories, same names.

## What changed

**Colour distribution, not colour.** On the live site saffron runs the header, the
nav, the buttons, the headings and the links all at full strength, so nothing has
hierarchy. Here it drops to roughly 5% of the surface and is spent in one place per
screen — the scheme band, the apply button, the active state. Same hues, very
different weight.

**Typography.** Two families, both designed for Devanagari rather than adapted from
Latin:

- **Tiro Devanagari Marathi** — a text serif drawn specifically for Marathi.
  Headlines, standfirsts, article body.
- **Mukta** (Ek Type, Mumbai) — navigation, metadata, forms.

Devanagari needs more vertical room than Latin because matras sit above and below
the shirorekha, so body line-height is 1.9–1.95 rather than the 1.5 a Latin face
would take. Letter-spacing is never positive, which would break the headline
stroke. Uppercase is never used — it does not exist in Devanagari, and Latin caps
set beside it read as a foreign body.

**Three registers instead of one grid.** The audit split the portal in two; the
categories actually fall into three groups, and each gets its own treatment:

| Register | Categories | Treatment |
| --- | --- | --- |
| `people` | लाभार्थी स्टोरी, यशस्वी उद्योजक, स्मार्ट शेतकरी, सक्षम विद्यार्थी, स्त्रीशक्ती, सामाजिक परिवर्तक | Editorial rhythm — one person, one photograph, alternating, plenty of air |
| `record` | शासकीय योजना, वार्ता, अमृत घडामोडी, अमृत सेवाकार्य | Dense two-column rows, built to scan |
| `archive` | ब्लॉग, लेख, शब्दामृत, दिनविशेष, अध्यात्म, पर्यटन | Text-forward, because much of the artwork is posters rather than photographs |

**The bridge.** Every story on the live site ends by telling the reader they may
qualify, then leaving them to find AMRUT on their own. `SchemeBridge` closes that:
the scheme the story is actually about, the eligibility the article already states,
the district office, and a link into the application portal at
`app.mahaamrut.org.in`. Matched from the article's own text — no new copy.

**Navigation that survives.** The live site drops its category bar on every inner
page. Here it persists, plus a grouped overlay menu and a sibling rail on category
pages.

**Repeated boilerplate given its own place.** The district office address and the
"अमृत संस्थेविषयी" paragraph are identical across the whole archive. They are
lifted out of the prose and set as contact details and a reference disclosure —
same words, no longer read as part of the story.

## Assistant

A floating assistant answers scheme, eligibility, application, document,
district-office and contact questions, and falls back to searching all 3,035
collected stories.

It is **grounded, not generative** — every answer is composed from this
site's own content, so it cannot invent an eligibility rule or an office
address. On a government portal that matters more than fluency. Where the
portal genuinely does not publish something, it says so: ask for a district
office and it gives Solapur, the only one with a published address, and
points to the head office for the rest.

`answer()` in `src/lib/assistant.js` is the single seam — putting a real
model behind it is one change, plus a serverless route holding the key.

## Opening sequence

An octagonal seal in the Rajmudra tradition, drawn in saffron, resolving
into the wordmark. Runs once per browser session, never under
`prefers-reduced-motion`.

It is a stylised interpretation, not a reproduction — the royal seal
carries a specific Sanskrit shloka, and setting that by hand risks getting
a revered inscription wrong. Official artwork drops straight into
`Preloader.jsx` if the client supplies it.

## Motion

Scroll-progress hairline, route-change entrance, rotating hero with a slow
push on the active frame, scroll-triggered reveals, card lift on hover, and
counts that animate up when they scroll into view. All transform/opacity,
no animation library, and every piece of it is dropped under
`prefers-reduced-motion`.

## Performance

The live homepage loads ~80 images, none lazily, none responsive, some at 18× their
displayed size. Here every image is WebP at 400/800/1400 with `srcset`, lazy below
the fold.

```
originals   151.9 MB   ->   webp   37.0 MB across all three widths
400w variants (what fills the homepage grid): 24 KB average
```

JS is split so article bodies never reach a reader who stays on the homepage:

```
main      136 KB gzip
article    47 KB gzip   (loaded on demand)
category    1 KB gzip
```

`robots.txt` and `sitemap.xml` are generated at build time — the live site has
neither.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # + sitemap.xml and robots.txt into dist/
npm run images         # re-fetch and re-optimise from the live site
```

## Content

Re-scrape and rebuild (the scrape/ folder is not committed):

```sh
python3 scripts/scrape-live.py   # resumable; ~3,000 pages
node scripts/build-data.mjs
```

`src/data/content.json` — 16 categories with their 24 newest items and true totals (bundled).
`public/data/cat/<slug>.json` — every item in a category, fetched by the category page.
`public/data/a/<id>.json` — one full article each, fetched by the article page.
`public/data/search.json` — `[id, title, category]` for the assistant and sitemap.
`src/data/images.json` — compact manifest, `[key, width, height, [widths]]`.

Collected from the live site on 8 October 2026.

## Before the domain switch

- **Photos are hotlinked** from `amrutmaharashtra.org/photos/` (only the ~300
  images in the manifest are optimised and self-hosted). That path must keep
  serving after the domain moves — keep it on a subdomain, or move it to storage
  and change `ARCHIVE` in `src/lib/content.js`.
- **The survey posts to the old PHP handler** (`amrut_family_registration.php`)
  with the original field names, until the new backend exists.
- **Comments are not migrated** — they need the backend.

## Known limits
- Mobile and tablet layouts are built mobile-first and have no fixed widths, but
  were not visually confirmed on a device — worth checking on the deployed URL.
- Light theme only. Deliberate: the cream-and-saffron identity does not survive
  inversion, and a government portal is read in daylight.
- The photography is the real ceiling. Several source images are group shots under
  fluorescent light, or posters with text baked in. The layouts are forgiving of
  this, but a shot standard for the 36 district offices would lift the whole site
  further than any further design work.
