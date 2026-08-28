import { useEffect, useRef, useState } from 'react'

/** Counts a number up once it scrolls into view. Static under reduced motion. */
export default function CountUp({ to, duration = 1100, className = '' }) {
  const ref = useRef(null)
  const [n, setN] = useState(to)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') return

    setN(0)
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration)
          // ease-out so it settles rather than stopping dead
          setN(Math.round(to * (1 - Math.pow(1 - t, 3))))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {n}
    </span>
  )
}
