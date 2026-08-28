import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categories } from '../lib/content'

/**
 * The section rail.
 *
 * Sits under the hero, then sticks directly beneath the masthead once it
 * reaches it, so from that point on it reads as the second row of the
 * navigation.
 *
 * Sixteen sections do not fit on most screens, so the rail scrolls — but
 * a scroller with no affordance just looks like it has been cut off.
 * Three things fix that: a fade at whichever edge has more content behind
 * it, arrows that appear only when there is somewhere to go, and the
 * current section scrolled into view on arrival so you can always see
 * where you are.
 */
export default function CategoryRail({ items = categories, label = 'विभाग' }) {
  const { pathname } = useLocation()
  const scroller = useRef(null)
  const activeRef = useRef(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({
      left: el.scrollLeft > 4,
      right: max > 4 && el.scrollLeft < max - 4,
    })
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      ro?.disconnect()
    }
  }, [measure])

  /* Bring the current section into view — without scrolling the page. */
  useEffect(() => {
    const el = scroller.current
    const active = activeRef.current
    if (!el || !active) return
    const target = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2
    el.scrollTo({ left: Math.max(0, target), behavior: 'auto' })
    measure()
  }, [pathname, measure])

  const nudge = (dir) => {
    const el = scroller.current
    if (!el) return
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({
      left: dir * el.clientWidth * 0.65,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  const Arrow = ({ dir, show }) => (
    <button
      type="button"
      onClick={() => nudge(dir)}
      aria-label={dir < 0 ? 'मागील विभाग' : 'पुढील विभाग'}
      tabIndex={show ? 0 : -1}
      className={`absolute top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-warm-200 bg-paper text-ink-2 shadow-sm transition-all duration-200 hover:border-saffron hover:text-saffron-deep sm:flex ${
        dir < 0 ? 'left-1.5' : 'right-1.5'
      } ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d={dir < 0 ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )

  return (
    <nav
      aria-label={label}
      className="sticky top-16 z-30 border-b border-warm-200 bg-paper/95 backdrop-blur-md"
    >
      <div className="relative mx-auto max-w-[86rem]">
        {/* Fades — sized to clear the arrows so nothing sits half-hidden */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 transition-opacity duration-200 ${
            edges.left ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to right, var(--color-paper) 30%, transparent 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 transition-opacity duration-200 ${
            edges.right ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to left, var(--color-paper) 30%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <Arrow dir={-1} show={edges.left} />
        <Arrow dir={1} show={edges.right} />

        <div
          ref={scroller}
          className="no-bar flex gap-6 overflow-x-auto scroll-smooth px-5 py-3 sm:px-11"
        >
          {items.map((c) => {
            const active = pathname === `/${c.slug}`
            return (
              <Link
                key={c.slug}
                to={`/${c.slug}`}
                ref={active ? activeRef : undefined}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap text-[14.5px] font-semibold transition-colors ${
                  active ? 'text-saffron-deep' : 'text-ink-2 hover:text-saffron-deep'
                }`}
              >
                <span className={active ? '' : 'underline-grow'}>{c.mr}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
