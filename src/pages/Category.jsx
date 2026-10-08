import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { StoryFeature, StoryCard, RecordRow, CompactRow } from '../components/Cards'
import { SchemeBand } from '../components/Scheme'
import CategoryRail from '../components/CategoryRail'
import CountUp from '../components/CountUp'
import { categoryBySlug, loadCategory } from '../lib/content'
import NotFound from './NotFound'

const PAGE = 24

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
  /* The bundle holds the 24 newest; the rest of the category is fetched once the page is. */
  const [all, setAll] = useState(null)
  const [shown, setShown] = useState(PAGE)

  useEffect(() => {
    let live = true
    setAll(null)
    setShown(PAGE)
    if (cat) loadCategory(cat.slug).then((list) => live && setAll(list))
    return () => {
      live = false
    }
  }, [cat])

  useEffect(() => {
    if (cat) document.title = `${cat.mr} — अमृत महाराष्ट्र`
  }, [cat])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [catSlug])

  if (!cat) return <NotFound />

  const items = (all && all.length ? all : cat.items).slice(0, shown)
  const total = all ? all.length : cat.total
  const [lead, ...rest] = items

  return (
    <>
      {/* Header — the category named, counted and described, so the page announces what it holds. */}
      <section className="border-b border-warm-200 bg-cream">
        <div className="mx-auto max-w-[86rem] px-5 py-9 sm:px-8 sm:py-14">
          <Crumb mr={cat.mr} />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div className="max-w-2xl">
              <h1 className="font-serif text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.24] text-ink">{cat.mr}</h1>
              {cat.blurb && <p className="lede mt-3.5">{cat.blurb}</p>}
            </div>
            <p className="meta pb-2">
              <CountUp to={cat.total} className="font-serif text-[1.6rem] leading-none text-saffron-deep" />
              <span className="ml-2">बातम्या</span>
            </p>
          </div>
        </div>
      </section>

      {/* Same rail as the homepage, so the reader never loses the map — and it sticks under the. */}
      <CategoryRail label="संबंधित विभाग" />

      <div className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 sm:py-20">
        {/* ---- People: editorial rhythm . */}
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

        {/* ---- Record: dense two-column list . */}
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

        {/* ---- Archive: text-forward, a reading list . */}
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

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-warm-100 pt-8">
          {/* One untranslatable chunk, shown-first: a page translator reorders the words around a. */}
          <p className="meta text-warm-400">
            <span translate="no">{Math.min(shown, total)} / {total}</span> बातम्या दाखवल्या आहेत
          </p>
          {shown < total && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              disabled={!all}
              className="rounded-full border border-saffron px-7 py-2.5 text-[15px] font-semibold text-saffron-deep transition-colors hover:bg-saffron hover:text-white disabled:opacity-50"
            >
              आणखी बातम्या
            </button>
          )}
        </div>
      </div>

      {cat.register === 'people' && <SchemeBand />}
    </>
  )
}
