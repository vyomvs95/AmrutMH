import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Img from './Img'
import { leadImage, dateMr, hasArticle } from '../lib/content'

const DURATION = 7000

/**
 * Rotating lead.
 *
 * Full-bleed photograph with a heavy scrim from the ink colour. The scrim
 * is doing real work here, not decoration: the source photography is
 * uneven — group shots under fluorescent light, GPS watermarks — and a
 * strong gradient makes an ordinary frame read as deliberate while
 * guaranteeing the headline stays legible over anything.
 *
 * Auto-advance pauses on hover, on keyboard focus, and when the tab is
 * hidden. Under prefers-reduced-motion it does not advance at all and the
 * reader drives it with the controls.
 */
export default function Hero({ items }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = useRef(false)
  const timer = useRef(null)

  useEffect(() => {
    reduced.current =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const go = useCallback(
    (n) => setActive((prev) => (n + items.length) % items.length),
    [items.length]
  )

  useEffect(() => {
    if (paused || reduced.current || items.length < 2) return
    timer.current = setTimeout(() => go(active + 1), DURATION)
    return () => clearTimeout(timer.current)
  }, [active, paused, go, items.length])

  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(active + 1)
    if (e.key === 'ArrowLeft') go(active - 1)
  }

  const current = items[active]

  return (
    <section
      className="relative isolate flex h-[clamp(30rem,80vh,46rem)] flex-col justify-end overflow-hidden bg-ink"
      aria-roledescription="carousel"
      aria-label="प्रमुख गोष्टी"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKey}
    >
      {/* Frames */}
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== active}
        >
          <Img
            data={leadImage(item)}
            alt=""
            priority={i === 0}
            sizes="100vw"
            className={`h-full w-full object-cover ${i === active ? 'hero-zoom' : ''}`}
          />
        </div>
      ))}

      {/* Scrim — bottom-up for the text, plus a left wash on wide screens */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(26,22,19,.92) 0%, rgba(26,22,19,.66) 32%, rgba(26,22,19,.24) 62%, rgba(26,22,19,.04) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(to right, rgba(26,22,19,.55) 0%, rgba(26,22,19,.14) 48%, rgba(26,22,19,0) 74%)',
        }}
        aria-hidden="true"
      />

      {/* Copy */}
      <div className="relative mx-auto w-full max-w-[86rem] px-5 pb-8 sm:px-8 sm:pb-12">
        <div key={current.id} className="hero-copy max-w-[46rem]">
          <p className="text-[13px] font-semibold text-saffron">{current.catMr}</p>

          <h1 className="mt-3 font-serif text-[clamp(1.85rem,4.6vw,3.5rem)] leading-[1.2] text-white drop-shadow-sm">
            {hasArticle(current.id) ? (
              <Link to={current.href} className="transition-colors hover:text-saffron">
                {current.title}
              </Link>
            ) : (
              current.title
            )}
          </h1>

          <p className="mt-4 hidden max-w-[38rem] font-serif text-[1.0625rem] leading-relaxed text-white/75 sm:block sm:text-[1.15rem]">
            {current.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            {hasArticle(current.id) && (
              <Link
                to={current.href}
                className="group inline-flex items-center gap-2.5 rounded-full bg-saffron px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-saffron-deep"
              >
                पूर्ण गोष्ट वाचा
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
            <p className="text-[13.5px] text-white/60">
              <span className="text-white/80">{current.author}</span>
              <span className="mx-2 text-white/30" aria-hidden="true">·</span>
              <span>{dateMr(current.date)}</span>
            </p>
          </div>
        </div>

        {/* Controls — the progress bars are the pagination */}
        <div className="mt-8 flex items-center gap-4 border-t border-white/15 pt-4">
          <ul className="flex flex-1 items-center gap-2 sm:gap-3">
            {items.map((item, i) => (
              <li key={item.id} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`गोष्ट ${i + 1}: ${item.title.slice(0, 40)}`}
                  aria-current={i === active}
                  className="group block w-full py-2"
                >
                  <span
                    className={`block h-[3px] w-full overflow-hidden rounded-full transition-colors ${
                      i === active ? 'bg-white/40' : 'bg-white/15'
                    }`}
                  >
                    <span
                      key={`${active}-${i}-${paused}`}
                      className={`block h-full rounded-full bg-saffron ${
                        i === active ? 'hero-progress' : 'w-0'
                      } ${i < active ? '!w-full !bg-white/35' : ''}`}
                      style={i === active ? { animationPlayState: paused ? 'paused' : 'running' } : undefined}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="मागील गोष्ट"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-saffron hover:text-saffron"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="पुढील गोष्ट"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-saffron hover:text-saffron"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
