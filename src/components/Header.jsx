import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categories, byRegister, img, org, schemes, schemeUrl } from '../lib/content'

const emblem = img('components/assets/india_transperent.png')
const logoLeft = img('components/assets/Amrutmh.png')
const logoRight = img('components/assets/Amrut.jpeg')

const GROUPS = [
  { mr: 'माणसं', en: 'people', hint: 'योजनांनी बदललेली आयुष्यं' },
  { mr: 'संस्था', en: 'record', hint: 'अमृतच्या घडामोडी आणि योजना' },
  { mr: 'संचित', en: 'archive', hint: 'लेख, परंपरा आणि वारसा' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.navOpen = open ? 'true' : 'false'
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-ink focus:text-cream focus:px-4 focus:py-2 focus:text-sm"
      >
        मुख्य मजकुराकडे जा
      </a>

      {/* Government identity strip — kept, but reduced to a quiet line */}
      <div className="bg-ink text-cream/85">
        <div className="mx-auto flex max-w-[86rem] items-center gap-2.5 px-5 py-1.5 sm:px-8">
          {emblem && (
            <img
              src={emblem.src}
              alt="भारताचे राष्ट्रीय चिन्ह"
              className="h-4 w-auto opacity-90 sm:h-[18px]"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          )}
          <p className="truncate text-[11px] leading-tight sm:text-[12.5px]">
            {org.mr} <span className="text-cream/50">— {org.sub}</span>
          </p>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          solid ? 'border-warm-200 bg-paper/95 backdrop-blur-md' : 'border-transparent bg-paper'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[86rem] items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center" aria-label="अमृत महाराष्ट्र — मुख्य पृष्ठ">
            {logoLeft && <img src={logoLeft.src} alt="अमृत महाराष्ट्र" className="h-9 w-auto sm:h-10" />}
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            {logoRight && (
              <img
                src={logoRight.src}
                alt="AMRUT — Academy of Maharashtra Research, Upliftment & Training"
                className="hidden h-9 w-auto md:block"
              />
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-nav"
              className="group flex items-center gap-2.5 rounded-full border border-warm-300 py-1.5 pl-4 pr-3 transition-colors hover:border-saffron-deep"
            >
              <span className="text-[14px] font-semibold text-ink">{open ? 'बंद करा' : 'विभाग'}</span>
              <span className="relative flex h-4 w-4 flex-col justify-center gap-[3px]">
                <span
                  className={`block h-[1.5px] w-4 bg-ink transition-transform duration-300 ${
                    open ? 'translate-y-[2.25px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-4 bg-ink transition-transform duration-300 ${
                    open ? '-translate-y-[2.25px] -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full overlay navigation */}
      <div
        id="site-nav"
        data-nav-open={open ? 'true' : 'false'}
        className={`fixed inset-0 z-40 overflow-y-auto bg-cream transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ paddingTop: 'calc(4rem + 30px)' }}
        aria-hidden={!open}
      >
        <div className="mx-auto max-w-[86rem] px-5 pb-24 pt-10 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-20">
            <div className="grid gap-11 sm:grid-cols-3 sm:gap-8">
              {GROUPS.map((g, gi) => (
                <div key={g.en}>
                  <div className="mb-5 border-b border-peach pb-2.5">
                    <p className="font-serif text-[1.35rem] leading-snug text-ink">{g.mr}</p>
                    <p className="meta mt-0.5">{g.hint}</p>
                  </div>
                  <ul className="flex flex-col gap-3.5">
                    {byRegister(g.en).map((c, i) => (
                      <li
                        key={c.slug}
                        className="nav-item"
                        style={{ '--d': `${120 + gi * 60 + i * 45}ms` }}
                      >
                        <Link to={`/${c.slug}`} className="group flex items-baseline gap-2.5">
                          <span className="font-serif text-[1.0625rem] leading-snug text-ink transition-colors group-hover:text-saffron-deep">
                            <span className="underline-grow">{c.mr}</span>
                          </span>
                          <span className="meta shrink-0 text-warm-400">{c.total}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Schemes get a permanent home in the navigation — the one
                thing a reader most often arrives looking for. */}
            <div
              className="nav-item rounded-lg bg-paper p-6 ring-1 ring-peach"
              style={{ '--d': '340ms' }}
            >
              <p className="label">अर्ज करा</p>
              <p className="mt-1 font-serif text-[1.3rem] leading-snug text-ink">अमृतच्या योजना</p>
              <p className="meta mt-1.5">अर्ज अमृतच्या अधिकृत पोर्टलवर स्वीकारले जातात.</p>
              <ul className="mt-5 flex flex-col divide-y divide-warm-100">
                {schemes.map((s) => (
                  <li key={s.id}>
                    <a
                      href={schemeUrl(s.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="font-serif text-[0.975rem] leading-snug text-ink-2 transition-colors group-hover:text-saffron-deep">
                        {s.mr}
                      </span>
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-warm-400 transition-colors group-hover:text-saffron" aria-hidden="true">
                        <path d="M4 12L12 4M12 4H6M12 4v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-warm-100 pt-4">
                <p className="meta">थेट संपर्क</p>
                <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="mt-0.5 block font-serif text-[1.05rem] text-saffron-deep">
                  {org.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
