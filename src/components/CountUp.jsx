import { useEffect, useRef, useState } from 'react'

/**
 * Counts a number up once it scrolls into view.
 *
 * The displayed value must never be wrong, even for a moment longer than
 * the animation. requestAnimationFrame stops ticking in a background tab,
 * which can strand the counter partway and leave a plainly false figure on
 * screen — on a portal whose current counter already invents its traffic,
 * that is the one failure worth engineering against.
 *
 * So: a hard timeout always lands the true value, hiding the tab snaps to
 * it immediately, and unmounting cannot leave it stranded.
 */
export default function CountUp({ to, duration = 1100, className = '' }) {
  const ref = useRef(null)
  const [n, setN] = useState(to)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setN(to)
      return
    }

    let raf = 0
    let backstop = 0
    let settled = false

    const settle = () => {
      if (settled) return
      settled = true
      cancelAnimationFrame(raf)
      clearTimeout(backstop)
      setN(to)
    }

    const onHide = () => {
      if (document.hidden) settle()
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()

        // Drop to zero only now — if this never fires, the true number
        // stays on screen rather than a stranded 0.
        setN(0)
        const start = performance.now()
        const tick = (now) => {
          if (settled) return
          const t = Math.min(1, Math.max(0, (now - start) / duration))
          // ease-out, so it settles rather than stopping dead
          setN(Math.round(to * (1 - Math.pow(1 - t, 3))))
          if (t < 1) raf = requestAnimationFrame(tick)
          else settled = true
        }
        raf = requestAnimationFrame(tick)

        // whatever happens to rAF, the true number lands
        backstop = setTimeout(settle, duration + 400)
        document.addEventListener('visibilitychange', onHide)
      },
      { threshold: 0.4 }
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(backstop)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [to, duration])

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {n}
    </span>
  )
}
