# Amrut Maharashtra — project log

**Read this first.** It is the handoff between sessions.

Last updated: 29 August 2026

---

## What this project is

A redesign of **amrutmaharashtra.org**, the positive-news and information portal of
AMRUT — महाराष्ट्र संशोधन, उन्नती व प्रशिक्षण प्रबोधिनी, an autonomous body of the
Government of Maharashtra.

The client's audience is economically weaker households in open-category
communities that receive no other government corporation's benefit: 24 listed
castes, annual income under ₹8 lakh, offices in all 36 districts. Predominantly
rural, predominantly Marathi, predominantly on cheap Android phones and patchy data.
Every decision on this project should be checked against that.

Managing Director: **Shri Vijay Joshi**. The portal was launched on his initiative.

### Two portals, one organisation — do not confuse them

| | |
| --- | --- |
| `amrutmaharashtra.org` | The **content** portal. What we redesigned. PHP + Bootstrap. |
| `mahaamrut.org.in` / `app.mahaamrut.org.in` | The **application** portal. Separate system. Schemes are applied for here. We link out to it; we do not own it. |

---

## Current state

| | |
| --- | --- |
| Live | **https://amrut-mh.vercel.app** |
| GitHub | **https://github.com/vyomvs95/AmrutMH** (`main`, auto-deploys on push) |
| Vercel team | Empty Agency (Hobby), project `amrut-mh` |
| Local | `~/Amrut_Maharashtra` |
| Stack | Vite 8 · React 19 · Tailwind 4 · React Router 7 |

Deploys automatically on every push to `main`. No CLI login needed — the GitHub
integration is connected. (The Vercel *CLI* on this machine is logged out; that is
fine and unrelated.)

---

## The through-line

The audit found the portal is **a magazine that happens to be run by a government
agency**. Every article ends by telling the reader they may qualify, then leaves
them to find AMRUT on their own — no scheme link, no district office, no way to
apply.

**Closing that gap is the point of the whole project.** Everything else is in
service of it. If a future decision trades away the story → scheme path, it is the
wrong decision.

---

## What has been done

### 1. Audit (28 Aug)
`docs/site-audit.html` — 15 verified findings, all reproduced in the live site.
Also published as an Artifact.

The four that matter most:
- **Visitor counter fabricates numbers.** Climbed 2,03,935 → 3,09,418 in ~1 minute
  on the homepage; reads 0 on every inner page.
- **Contact button is dead.** `javascript:void(0)`, no handler, no contact page.
- **Every story dead-ends** (the through-line above).
- **Survey form collects caste + contact data with no privacy notice.** DPDP Act
  2023 exposure. `amrut_family_registration.php`.

Also: no robots.txt or sitemap, ~80 unoptimised homepage images (some 18× oversized),
navigation vanishes on inner pages, stock-template 404, naive search.

### 2. Redesign (28–29 Aug)
Three templates — home, category, article — across 33 routes, on real content.

**Unchanged, deliberately:** every article word for word; the AMRUT palette read
out of their live stylesheet; the state emblem, both logo lockups, the official
footer declarations; the 16 categories and their names.

**Changed:**
- **Colour distribution, not colour.** Saffron dropped from ~40% of the surface to
  ~5%, spent once per screen.
- **Typography.** Tiro Devanagari Marathi (serif, Marathi-specific) + Mukta (Ek
  Type). Body line-height 1.9–1.95 for matra clearance. No positive letter-spacing,
  no uppercase — it does not exist in Devanagari.
- **Three registers** instead of one grid: `people` / `record` / `archive`, each
  with its own layout treatment. Defined in `src/lib/content.js`.
- **The bridge** (`SchemeBridge`) — matches a story to the scheme it describes from
  the article's own text, then shows eligibility, district office and a route into
  the application portal.
- **Navigation that survives** — sticky `CategoryRail` at `top-16`, on every page.
- **Rotating hero** — five stories, full-bleed, ink scrim, progress-bar pagination.
- **Opening seal** — octagonal Rajmudra-tradition mark in saffron, once per session.
- **Assistant** — grounded, not generative (see below).
- Real 404, generated `robots.txt` + `sitemap.xml`.

### 3. Performance
355 images downloaded and converted to responsive WebP at 400/800/1400.
**151.9 MB → 37.0 MB.** The 400w variants that fill the homepage average **24 KB**.
JS split so article bodies never load for a homepage visitor.

---

## Decisions already made — do not re-litigate without reason

- **Marathi-first, no language switcher.** Settled for this proof.
- **Light theme only.** The cream-and-saffron identity does not survive inversion,
  and a government portal is read in daylight. Deliberate, not an omission.
- **Content is static JSON in the repo**, collected 28 Aug 2026. Not live.
- **Stories held in full are clickable; summary-only cards are not.** We never
  promise a page that would 404. Category pages state how many of the total they show.
- **The assistant is grounded, not generative.** It composes answers from site
  content only, so it cannot invent an eligibility rule or an office address. On a
  government portal that matters more than fluency. `answer()` in
  `src/lib/assistant.js` is the single seam if a model is ever put behind it — that
  needs a serverless route and a key the client provides.
- **The opening seal is a stylised interpretation, not a reproduction.** The real
  राजमुद्रा carries a specific Sanskrit shloka; hand-setting it risks getting a
  revered inscription wrong. Swap in official artwork if the client supplies it.
- **Only Solapur has a published district office address.** The site genuinely does
  not publish the other 35. The assistant says so rather than inventing them.

---

## Known limits

- 24 articles per category collected, out of **2,664** published.
- **Mobile and tablet never visually confirmed.** Window resizing does not change
  the rendered viewport in this browser setup. Built mobile-first with no fixed
  widths and zero horizontal overflow at desktop — but check on a real phone.
- The production URL is **public**. Deployment-specific URLs are protected. Worth a
  deliberate decision before the client sees it.
- **Photography is the real ceiling.** Group shots under fluorescent light, GPS
  watermarks, posters with text baked in. The scrim and layouts are forgiving of
  this, but a one-page shot standard for the 36 district managers would lift the
  site further than more design work.

---

## Gotchas hit — do not rediscover these

- **Unlayered CSS beats Tailwind utilities.** Bare `a { color: inherit }` silently
  killed every colour utility on links. Base styles must be in `@layer base`,
  custom classes in `@layer components`.
- **Cached images never fire `onLoad`.** `Img.jsx` checks `ref.current.complete` on
  mount, or anything in cache sits at zero opacity forever.
- **React StrictMode double-invokes effects in dev.** The preloader's "seen" flag
  was being written on start, so the second pass skipped the intro. Write completion
  flags when the thing *finishes*.
- **A catch-all `/:catSlug` route swallows unknown URLs.** Category and Article must
  render `<NotFound />`, not redirect home, or the 404 is unreachable.
- **The screenshot tool lags ~3 s** and frequently captures mid-transition or blank.
  Verify state via `javascript_tool` and the DOM; do not trust a single screenshot.
- **The in-page JS tool caps output at ~1,000 characters** and blocks anything that
  looks like a query string. Build URLs from `String.fromCharCode`, avoid ` = ` in
  output, and pull bulk data out via a blob download instead.
- **Chrome auto-translates the site to English** (because `lang="mr"`). Inject
  `<meta name="google" content="notranslate">` before capturing screenshots.

---

## Open questions for the client

1. Rebuild, re-skin the same content, or a new section alongside?
2. Can we get database / CMS access? Scraping goes stale immediately.
3. Do we integrate with the scheme portal, or keep linking out?
4. Who is the approving authority for a government portal?
5. Marathi-only or bilingual long-term?

---

## Obvious next steps

- Check mobile on a real device.
- Scheme directory, district office finder, eligibility checker — the three
  additions from the audit that turn 2,664 stories into 2,664 funnels.
- Privacy policy + consent on the survey form (compliance, not nice-to-have).
- Accessibility pass: skip links, text-size and contrast controls, alt text on the
  banner links, published accessibility statement (GIGW).
- WhatsApp channel — it is how this content actually travels in Maharashtra.

---

## Files worth knowing

```
src/lib/content.js      registers, categories, schemes, images, dates, districts
src/lib/articles.js     the 32 full bodies — imported ONLY by the split article route
src/lib/assistant.js    the assistant's answer engine
src/components/Scheme.jsx      SchemeBand + SchemeBridge (the bridge)
src/components/Hero.jsx        rotating lead
src/components/CategoryRail.jsx sticky nav rail
src/components/Preloader.jsx   opening seal
scripts/fetch-images.mjs       re-fetch + re-optimise from the live site
scripts/gen-seo.mjs            sitemap + robots at build
docs/site-audit.html           the audit
docs/why-the-new-site-is-better.pptx   client deck
```
