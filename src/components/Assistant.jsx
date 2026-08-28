import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { answer, GREETING } from '../lib/assistant'

/**
 * Site assistant.
 *
 * Answers are generated from this site's own content — the scheme list,
 * the eligibility the articles state, the district data and the 333
 * collected stories. It does not call a model, so it never invents an
 * eligibility rule or an office address, which matters more than
 * fluency on a government portal. Swapping a real model in behind
 * `answer()` is a single change if a key is ever provisioned.
 */

function Bubble({ from, children }) {
  const mine = from === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed ${
          mine
            ? 'rounded-br-sm bg-saffron text-white'
            : 'rounded-bl-sm bg-warm-100 text-ink-2'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [log, setLog] = useState([{ from: 'bot', reply: GREETING }])
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [log, thinking, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 260)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ask = (text) => {
    const q = String(text || '').trim()
    if (!q || thinking) return
    setInput('')
    setLog((l) => [...l, { from: 'user', text: q }])
    setThinking(true)
    // a short beat so the exchange reads as a conversation, not a lookup
    setTimeout(() => {
      setLog((l) => [...l, { from: 'bot', reply: answer(q) }])
      setThinking(false)
    }, 420)
  }

  const lastChips = (() => {
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].from === 'bot' && log[i].reply?.chips) return log[i].reply.chips
    }
    return []
  })()

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        aria-label={open ? 'सहाय्यक बंद करा' : 'सहाय्यकाला विचारा'}
        className="group fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-saffron shadow-lg shadow-ink/25 transition-transform duration-300 hover:scale-105 hover:bg-saffron-deep sm:bottom-7 sm:right-7"
      >
        <span className="assistant-ping" aria-hidden="true" />
        {open ? (
          <svg viewBox="0 0 24 24" className="relative h-6 w-6 text-white" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="relative h-6 w-6 text-white" aria-hidden="true">
            <path
              d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.8 9.8 0 0 1-2.9-.4L4 21l1.4-3.8A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"
              fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
            />
            <circle cx="8.5" cy="11.5" r="1" fill="currentColor" />
            <circle cx="12" cy="11.5" r="1" fill="currentColor" />
            <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Panel */}
      <div
        id="assistant-panel"
        role="dialog"
        aria-label="अमृत सहाय्यक"
        aria-modal="false"
        className={`fixed bottom-24 right-4 z-[59] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl shadow-ink/25 ring-1 ring-warm-200 transition-all duration-300 sm:right-7 ${
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-4 scale-[.97] opacity-0'
        }`}
        style={{ maxHeight: 'min(34rem, calc(100vh - 9rem))' }}
      >
        <header className="flex items-center gap-3 border-b border-warm-200 bg-cream px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron/15">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-saffron-deep" style={{ height: 18, width: 18 }} aria-hidden="true">
              <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3Z" fill="currentColor" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-serif text-[1.05rem] leading-tight text-ink">अमृत सहाय्यक</p>
            <p className="meta text-[12px]">या संकेतस्थळावरील माहितीवर आधारित</p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {log.map((m, i) =>
            m.from === 'user' ? (
              <Bubble key={i} from="user">{m.text}</Bubble>
            ) : (
              <div key={i} className="space-y-2">
                <Bubble from="bot">
                  <span className="whitespace-pre-line">{m.reply.text}</span>
                </Bubble>
                {m.reply.links?.length > 0 && (
                  <ul className="ml-1 flex flex-col gap-1.5">
                    {m.reply.links.map((l, j) => (
                      <li key={j}>
                        {l.external ? (
                          <a
                            href={l.to}
                            target={l.to.startsWith('tel:') ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 rounded-lg border border-warm-200 px-3 py-2 text-[13.5px] leading-snug text-ink-2 transition-colors hover:border-saffron hover:text-saffron-deep"
                          >
                            <span className="flex-1">{l.label}</span>
                            <span className="mt-0.5 shrink-0 text-warm-400 transition-colors group-hover:text-saffron" aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <Link
                            to={l.to}
                            onClick={() => setOpen(false)}
                            className="group flex items-start gap-2 rounded-lg border border-warm-200 px-3 py-2 text-[13.5px] leading-snug text-ink-2 transition-colors hover:border-saffron hover:text-saffron-deep"
                          >
                            <span className="flex-1">{l.label}</span>
                            <span className="mt-0.5 shrink-0 text-warm-400 transition-colors group-hover:text-saffron" aria-hidden="true">→</span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          )}

          {thinking && (
            <Bubble from="bot">
              <span className="flex items-center gap-1 py-0.5" aria-label="विचार करत आहे">
                <i className="dot" /><i className="dot" /><i className="dot" />
              </span>
            </Bubble>
          )}
          <div ref={endRef} />
        </div>

        {lastChips.length > 0 && !thinking && (
          <div className="no-bar flex gap-2 overflow-x-auto border-t border-warm-100 px-4 py-2.5">
            {lastChips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => ask(c)}
                className="shrink-0 whitespace-nowrap rounded-full border border-warm-200 px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-saffron hover:text-saffron-deep"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
          className="flex items-center gap-2 border-t border-warm-200 px-3 py-2.5"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="आपला प्रश्न लिहा…"
            aria-label="आपला प्रश्न"
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-[14.5px] text-ink outline-none placeholder:text-warm-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="पाठवा"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron text-white transition-colors hover:bg-saffron-deep disabled:cursor-not-allowed disabled:bg-warm-300"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </>
  )
}
