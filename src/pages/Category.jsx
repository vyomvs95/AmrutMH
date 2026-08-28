import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { StoryFeature, StoryCard, RecordRow, CompactRow } from '../components/Cards'
import { SchemeBand } from '../components/Scheme'
import { categoryBySlug, categories } from '../lib/content'
import NotFound from './NotFound'

function Crumb({ mr }) {
  return (
    <nav aria-label="मार्ग" className="meta flex items-center gap-2">
      <Link to="/" className="transition-colors hover:text-saffron-deep">मुख्य पृष्ठ</Link>
      <span className="text-warm-300" aria-hidden="true">/</span>
      <span className="text-ink-2">{mr}</span>
    </nav>
  )
}

export default function Category() {
  const { catSlug } = useParams()
  const cat = categoryBySlug(catSlug)

  useEffect(() => {
    if (cat) document.title = `${cat.mr} — अमृत महाराष्ट्र`
  }, [cat])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [catSlug])

  if (!cat) return <NotFound />

  const [lead, ...rest] = cat.items
  const siblings = categories.filter((c) => c.register === cat.register && c.slug !== cat.slug)

  return (
    <>
      {/* Header — the category named, counted and described, so the
          page announces what it holds rather than starting cold. */}
      <section className="border-b border-warm-200 bg-cream">
        <div className="mx-auto max-w-[86rem] px-5 py-9 sm:px-8 sm:py-14">
          <Crumb mr={cat.mr} />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div className="max-w-2xl">
              <h1 className="font-serif text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.24] text-ink">{cat.mr}</h1>
              {cat.blurb && <p className="lede mt-3.5">{cat.blurb}</p>}
            </div>
            <p className="meta pb-2">
              <span className="font-serif text-[1.6rem] leading-none text-saffron-deep">{cat.total}</span>
              <span className="ml-2">बातम्या</span>
            </p>
          </div>
        </div>
      </section>

      {/* Sibling rail — moving sideways within a register, which the
          live site makes impossible once you leave the homepage. */}
      <nav aria-label="संबंधित विभाग" className="border-b border-warm-200 bg-paper">
        <div className="no-bar mx-auto flex max-w-[86rem] gap-6 overflow-x-auto px-5 py-3.5 sm:px-8">
          {siblings.map((c) => (
            <Link
              key={c.slug}
              to={`/${c.slug}`}
              className="shrink-0 whitespace-nowrap text-[14.5px] font-semibold text-ink-2 transition-colors hover:text-saffron-deep"
            >
              <span className="underline-grow">{c.mr}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 sm:py-20">
        {/* ---- People: editorial rhythm ---- */}
        {cat.register === 'people' && (
          <>
            <Reveal>
              <StoryFeature item={lead} eyebrow="ताजी गोष्ट" />
            </Reveal>
            <div className="mt-16 grid gap-x-8 gap-y-12 border-t border-warm-200 pt-14 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 90}>
                  <StoryCard item={item} />
                </Reveal>
              ))}
            </div>
          </>
        )}

        {/* ---- Record: dense two-column list ---- */}
        {cat.register === 'record' && (
          <>
            <Reveal>
              <StoryFeature item={lead} eyebrow="ताजी बातमी" />
            </Reveal>
            <div className="mt-14 grid gap-x-14 border-t border-warm-200 pt-6 lg:grid-cols-2">
              {rest.map((item, i) => (
                <Reveal key={item.id} delay={(i % 2) * 70}>
                  <RecordRow item={item} showCat={false} />
                </Reveal>
              ))}
            </div>
          </>
        )}

        {/* ---- Archive: text-forward, a reading list ---- */}
        {cat.register === 'archive' && (
          <>
            <Reveal>
              <StoryFeature item={lead} eyebrow="ताजा लेख" />
            </Reveal>
            <div className="mt-16 grid gap-x-8 gap-y-11 border-t border-warm-200 pt-14 sm:grid-cols-2 lg:grid-cols-3">
              {rest.slice(0, 6).map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 90}>
                  <StoryCard item={item} />
                </Reveal>
              ))}
            </div>
            {rest.length > 6 && (
              <div className="mt-16 border-t border-warm-200 pt-10">
                <p className="label mb-5">आणखी वाचा</p>
                <div className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.slice(6).map((item) => (
                    <CompactRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Honest about the sample: this proof holds 24 of each category,
            and only the stories we hold in full are clickable. */}
        <p className="meta mt-14 border-t border-warm-100 pt-6 text-warm-400">
          या प्रारूपात {cat.mr} मधील {cat.items.length} बातम्या दाखवल्या आहेत —
          एकूण {cat.total} पैकी. पूर्ण मजकूर उपलब्ध असलेल्या बातम्या उघडता येतात.
        </p>
      </div>

      {cat.register === 'people' && <SchemeBand />}
    </>
  )
}
