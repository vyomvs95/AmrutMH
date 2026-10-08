import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tickerLines } from '../lib/office'

/* The band under the navigation: six lines of news or scheme links running round and. */
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

  /* repeated once so the loop joins invisibly. */
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
