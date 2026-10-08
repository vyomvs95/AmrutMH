import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tickerLines } from '../lib/office'

/**
 * The band under the navigation: six lines of news or scheme links running
 * round and round, each divided by a bar.
 *
 * The lines come from the back office, so the head office can change them
 * without a deploy. If none are set the band does not render at all, which is
 * why the portal looked the same before this existed.
 *
 * It scrolls with a CSS animation and the content is repeated once, so the loop
 * has no seam. It pauses when pointed at, and stands still for anyone who has
 * asked their system to reduce motion.
 */
export default function Ticker() {
  const [lines, setLines] = useState([])

  useEffect(() => {
    let live = true
    tickerLines().then((l) => live && setLines(Array.isArray(l) ? l : []))
    return () => { live = false }
  }, [])

  if (!lines.length) return null

  const item = (l, i) => {
    const body = <span className="px-1">{l.text}</span>
    if (!l.href) return <span key={`${i}-t`} className="opacity-95">{body}</span>
    const external = /^https?:/i.test(l.href)
    return external ? (
      <a key={`${i}-t`} href={l.href} target="_blank" rel="noopener noreferrer"
         className="underline-offset-4 hover:underline">{body}</a>
    ) : (
      <Link key={`${i}-t`} to={l.href} className="underline-offset-4 hover:underline">{body}</Link>
    )
  }

  /* repeated once so the loop joins invisibly */
  const run = (copy) => (
    <div className="ticker-run" aria-hidden={copy === 1 ? 'true' : undefined}>
      {lines.map((l, i) => (
        <span key={`${copy}-${i}`} className="inline-flex items-center">
          {item(l, `${copy}-${i}`)}
          <span className="px-3 text-white/45" aria-hidden="true">|</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="ticker-band" role="region" aria-label="ताज्या घडामोडी">
      <div className="ticker-window">
        {run(0)}
        {run(1)}
      </div>
    </div>
  )
}
