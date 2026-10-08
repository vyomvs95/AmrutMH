import { useEffect, useRef, useState } from 'react'
import { siteVisits } from '../lib/office'

/**
 * The visitor total, above the footer.
 *
 * It carries on from the count the existing portal already shows, and counts
 * the same thing it counts: every visit, not unique people. The figure comes
 * from the back office — nothing is invented here, which is the whole point on
 * a portal whose old counter was found inventing its traffic.
 *
 * It counts up once, when it is scrolled into view, the way the existing site
 * does. Anyone who has asked for reduced motion simply sees the number.
 */
export default function VisitorCount() {
  const ref = useRef(null)
  const [total, setTotal] = useState(null)
  const [shown, setShown] = useState(null)

  useEffect(() => {
    let live = true
    siteVisits().then((n) => live && typeof n === 'number' && setTotal(n))
    return () => { live = false }
  }, [])

  /* Count up to the real figure once it comes into view, then stop. */
  useEffect(() => {
    if (total == null) return
    const el = ref.current
    if (!el) return

    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') { setShown(total); return }

    let raf = 0
    let backstop = 0
    let done = false
    const settle = () => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      clearTimeout(backstop)
      setShown(total)          // the true figure always lands, whatever happens
    }

    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io.disconnect()
      const started = performance.now()
      const span = 1600
      const tick = (now) => {
        const t = Math.min(1, (now - started) / span)
        const eased = 1 - Math.pow(1 - t, 3)
        setShown(Math.round(total * eased))
        if (t < 1) raf = requestAnimationFrame(tick)
        else settle()
      }
      raf = requestAnimationFrame(tick)
      backstop = setTimeout(settle, span + 600)
    }, { threshold: 0.4 })

    io.observe(el)
    document.addEventListener('visibilitychange', settle)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', settle)
      cancelAnimationFrame(raf)
      clearTimeout(backstop)
    }
  }, [total])

  if (total == null) return null

  return (
    <section ref={ref} aria-label="भेटींची संख्या" className="border-t border-warm-100 bg-cream-2/60">
      <div className="mx-auto flex max-w-[86rem] flex-col items-center gap-2 px-5 py-12 text-center sm:px-8">
        <span className="meta text-warm-600">एकूण भेटी</span>
        <span
          translate="no"
          className="font-serif text-[clamp(2.2rem,5.5vw,3.4rem)] leading-none text-saffron-deep"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {(shown ?? 0).toLocaleString('en-IN')}
        </span>
        <span className="h-px w-16 bg-saffron/40" aria-hidden="true" />
        <p className="max-w-md text-[0.9rem] leading-relaxed text-warm-600">
          या संकेतस्थळाला आजवर मिळालेल्या एकूण भेटी
          <span className="mt-1 block text-[0.8rem] text-warm-400">Total visits to this portal</span>
        </p>
      </div>
    </section>
  )
}
