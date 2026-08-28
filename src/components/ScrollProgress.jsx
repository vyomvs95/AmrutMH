import { useEffect, useState } from 'react'

/** A hairline reading-progress bar across the very top of the page. */
export default function ScrollProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const de = document.documentElement
      const max = de.scrollHeight - de.clientHeight
      setPct(max > 0 ? Math.min(1, de.scrollTop / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]" aria-hidden="true">
      <div
        className="h-full bg-saffron"
        style={{ width: `${pct * 100}%`, transition: 'width 90ms linear' }}
      />
    </div>
  )
}
