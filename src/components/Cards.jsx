import { Link } from 'react-router-dom'
import Img from './Img'
import { leadImage, dateMr, hasArticle } from '../lib/content'

/* A story we hold the full text for gets a link; one we only hold a
   card for is shown but not linked, rather than promising a page that
   would 404. */
function Wrap({ item, className, children }) {
  if (hasArticle(item.id)) {
    return (
      <Link to={item.href} className={className}>
        {children}
      </Link>
    )
  }
  return <div className={className}>{children}</div>
}

/* ------------------------------------------------------------------
   Feature — the People strand. One person, one photograph, room to
   breathe. Alternates side on wide screens so the page has a pulse.
   ------------------------------------------------------------------ */
export function StoryFeature({ item, flip = false, eyebrow }) {
  const image = leadImage(item)

  return (
    <Wrap item={item} className="group block">
      <article className="grid items-center gap-7 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className={`zoom-wrap rounded-lg bg-warm-100 ${flip ? 'md:order-2' : ''}`}>
          <Img
            data={image}
            alt={item.title}
            sizes="(min-width: 768px) 46vw, 100vw"
            className="aspect-[4/3] w-full object-cover md:aspect-[5/4]"
          />
        </div>

        <div className={flip ? 'md:order-1' : ''}>
          <p className="label">{eyebrow || item.catMr}</p>
          <h3 className="mt-3 font-serif text-[clamp(1.45rem,2.6vw,2rem)] leading-[1.32] text-ink transition-colors group-hover:text-saffron-deep">
            {item.title}
          </h3>
          <p className="lede mt-4 line-clamp-3 max-w-[32rem]">{item.excerpt}</p>
          <p className="meta mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-ink-2">{item.author}</span>
            <span className="text-warm-300" aria-hidden="true">·</span>
            <span>{dateMr(item.date)}</span>
          </p>
        </div>
      </article>
    </Wrap>
  )
}

/* ------------------------------------------------------------------
   Card — the workhorse. Used in grids across category pages.
   ------------------------------------------------------------------ */
export function StoryCard({ item, showCat = false, priority = false }) {
  const image = leadImage(item)

  return (
    <Wrap item={item} className="group flex h-full flex-col">
      <div className="zoom-wrap mb-4 rounded-md bg-warm-100">
        <Img
          data={image}
          alt={item.title}
          priority={priority}
          sizes="(min-width: 1024px) 27vw, (min-width: 640px) 44vw, 100vw"
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      {showCat && <p className="label mb-2">{item.catMr}</p>}

      <h3 className="font-serif text-[1.1875rem] leading-[1.42] text-ink transition-colors group-hover:text-saffron-deep">
        {item.title}
      </h3>

      <p className="meta mt-2 line-clamp-2 leading-relaxed">{item.excerpt}</p>

      <p className="meta mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-4 text-warm-400">
        <span>{item.author}</span>
        <span className="text-warm-300" aria-hidden="true">·</span>
        <span>{dateMr(item.date)}</span>
      </p>
    </Wrap>
  )
}

/* ------------------------------------------------------------------
   Row — the Record register. Dense, scannable, thumbnail-led.
   ------------------------------------------------------------------ */
export function RecordRow({ item, showCat = true }) {
  const image = leadImage(item)

  return (
    <Wrap item={item} className="group flex gap-4 border-b border-warm-100 py-5 sm:gap-6">
      <div className="zoom-wrap w-24 shrink-0 rounded bg-warm-100 sm:w-36">
        <Img
          data={image}
          alt={item.title}
          sizes="150px"
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        {showCat && <p className="label mb-1 text-[12.5px]">{item.catMr}</p>}
        <h3 className="font-serif text-[1.05rem] leading-[1.42] text-ink transition-colors group-hover:text-saffron-deep sm:text-[1.125rem]">
          {item.title}
        </h3>
        <p className="meta mt-1.5 hidden line-clamp-2 sm:block">{item.excerpt}</p>
        <p className="meta mt-2 flex flex-wrap items-center gap-x-2 text-warm-400">
          <span>{item.author}</span>
          <span className="text-warm-300" aria-hidden="true">·</span>
          <span>{dateMr(item.date)}</span>
        </p>
      </div>
    </Wrap>
  )
}

/* ------------------------------------------------------------------
   Compact — text-only, for archive lists where the artwork is a poster
   or a graphic rather than a photograph worth showing large.
   ------------------------------------------------------------------ */
export function CompactRow({ item }) {
  return (
    <Wrap item={item} className="group block border-b border-warm-100 py-4">
      <h3 className="font-serif text-[1.0625rem] leading-[1.45] text-ink transition-colors group-hover:text-saffron-deep">
        {item.title}
      </h3>
      <p className="meta mt-1.5 flex flex-wrap items-center gap-x-2">
        <span>{item.author}</span>
        <span className="text-warm-300" aria-hidden="true">·</span>
        <span>{dateMr(item.date)}</span>
      </p>
    </Wrap>
  )
}

/* Section heading used across the homepage and category pages. */
export function SectionHead({ mr, blurb, to, count }) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-warm-200 pb-4">
      <div>
        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.05rem)] leading-tight text-ink">{mr}</h2>
        {blurb && <p className="meta mt-1.5 max-w-lg">{blurb}</p>}
      </div>
      {to && (
        <Link to={to} className="group flex shrink-0 items-center gap-2 pb-1">
          <span className="text-[14.5px] font-semibold text-saffron-deep">
            <span className="underline-grow">सर्व {count} पहा</span>
          </span>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-saffron transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  )
}
