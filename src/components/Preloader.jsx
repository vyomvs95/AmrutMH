import { useEffect, useState } from 'react'

/**
 * Opening sequence.
 *
 * An octagonal seal in the Rajmudra tradition — the eight-sided form and
 * the radiating sun, drawn in saffron — resolving into the अमृत महाराष्ट्र
 * wordmark.
 *
 * Deliberately a stylised interpretation, not a reproduction: the actual
 * royal seal carries a specific Sanskrit shloka, and setting that by hand
 * on a government site risks getting a revered inscription wrong. If the
 * client supplies official artwork it drops straight in here.
 *
 * Runs once per browser session, and not at all for a reader who has
 * asked for reduced motion.
 */

const SEEN_KEY = 'amrut:intro'

const oct = (r) =>
  Array.from({ length: 8 }, (_, k) => {
    const a = ((-90 + k * 45) * Math.PI) / 180
    return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

export default function Preloader() {
  /* Decided once, in a pure initialiser, so React's double-invoked effects
     in development cannot race with themselves. The "seen" flag is written
     when the sequence finishes, never when it starts. */
  const [phase, setPhase] = useState(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === '1') return 'done'
    } catch {
      /* private mode — just play it */
    }
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'done'
    }
    return 'run'
  })

  useEffect(() => {
    if (phase !== 'run') return

    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setPhase('out'), 2150)
    const t2 = setTimeout(() => {
      setPhase('done')
      document.body.style.overflow = ''
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* ignore */
      }
    }, 2800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.body.style.overflow = ''
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink transition-opacity duration-[650ms] ${
        phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-label="अमृत महाराष्ट्र सुरू होत आहे"
    >
      {/* warm bloom behind the seal */}
      <div
        className="pointer-events-none absolute h-[34rem] w-[34rem] rounded-full opacity-70 intro-bloom"
        style={{
          background:
            'radial-gradient(circle, rgba(249,115,22,.28) 0%, rgba(249,115,22,.10) 42%, rgba(249,115,22,0) 70%)',
        }}
        aria-hidden="true"
      />

      <svg viewBox="0 0 200 200" className="relative h-40 w-40 sm:h-48 sm:w-48" aria-hidden="true">
        {/* radiating sun */}
        <g className="intro-rays" stroke="#f97316" strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 16 }, (_, i) => {
            const a = ((i * 22.5 - 90) * Math.PI) / 180
            const x1 = 100 + 27 * Math.cos(a)
            const y1 = 100 + 27 * Math.sin(a)
            const x2 = 100 + (i % 2 ? 40 : 47) * Math.cos(a)
            const y2 = 100 + (i % 2 ? 40 : 47) * Math.sin(a)
            return (
              <line
                key={i}
                x1={x1.toFixed(1)} y1={y1.toFixed(1)}
                x2={x2.toFixed(1)} y2={y2.toFixed(1)}
                style={{ animationDelay: `${700 + i * 34}ms` }}
                className="intro-ray"
              />
            )
          })}
        </g>

        {/* inner disc */}
        <circle cx="100" cy="100" r="19" fill="#f97316" className="intro-core" />

        {/* inner octagon */}
        <polygon
          points={oct(64)}
          fill="none"
          stroke="#f97316"
          strokeWidth="1.6"
          strokeOpacity="0.55"
          className="intro-oct-in"
        />

        {/* outer octagon */}
        <polygon
          points={oct(82)}
          fill="none"
          stroke="#f97316"
          strokeWidth="2.6"
          strokeLinejoin="round"
          className="intro-oct-out"
        />
      </svg>

      <div className="relative mt-7 text-center">
        <p className="intro-word font-serif text-[1.75rem] leading-tight text-cream sm:text-[2.1rem]">
          अमृत महाराष्ट्र
        </p>
        <p className="intro-sub mt-1.5 text-[12.5px] text-cream/45">
          महाराष्ट्र शासनाची स्वायत्त संस्था
        </p>
      </div>
    </div>
  )
}
