import Img from './Img'
import Reveal from './Reveal'
import { img, schemes, schemeUrl, org } from '../lib/content'

const ArrowOut = ({ className = '' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path d="M4 12L12 4M12 4H6M12 4v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ------------------------------------------------------------------
   The homepage scheme band.
   This is where the saffron is spent — the one place on the page it
   runs at full strength, because it marks the one action the site
   most wants a reader to be able to take.
   ------------------------------------------------------------------ */
export function SchemeBand() {
  return (
    <section className="bg-ink py-16 text-cream sm:py-20" aria-labelledby="schemes-head">
      <div className="mx-auto max-w-[86rem] px-5 sm:px-8">
        <Reveal className="mb-10 max-w-2xl">
          <p className="text-[13px] font-semibold text-saffron">अर्ज सुरू आहेत</p>
          <h2 id="schemes-head" className="mt-2.5 font-serif text-[clamp(1.7rem,3.6vw,2.5rem)] leading-[1.28] text-cream">
            अमृतच्या योजना — प्रशिक्षण, व्याज परतावा आणि बरेच काही
          </h2>
          <p className="mt-4 max-w-xl font-serif text-[1.0625rem] leading-relaxed text-cream/70">
            खुल्या प्रवर्गातील आर्थिकदृष्ट्या दुर्बल घटकांसाठी. वार्षिक उत्पन्न आठ लाखांपेक्षा कमी असल्यास अर्ज करता येतो.
          </p>
        </Reveal>

        <ul className="grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {schemes.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 80} className="bg-ink">
              <a
                href={schemeUrl(s.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col"
              >
                <div className="zoom-wrap aspect-[5/2] w-full overflow-hidden bg-white/5">
                  <Img
                    data={img(s.image)}
                    alt={s.mr}
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-[1.125rem] leading-snug text-cream transition-colors group-hover:text-saffron">
                    {s.mr}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-cream/55">{s.note}</p>
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-[13.5px] font-semibold text-saffron">
                    अर्ज करा
                    <ArrowOut className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </ul>

        <p className="mt-6 text-[13px] text-cream/40">
          अर्ज अमृतच्या अधिकृत पोर्टलवर स्वीकारले जातात — mahaamrut.org.in
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------
   The bridge.
   Every story on the live site ends by telling the reader they may
   qualify, then leaving them to find AMRUT on their own. This closes
   that gap: the scheme the story is actually about, the eligibility
   line the article already carries, and a way to reach someone.
   No article text is changed — this sits after it.
   ------------------------------------------------------------------ */
export function SchemeBridge({ scheme, article }) {
  if (!scheme) return null

  return (
    <Reveal
      as="aside"
      className="mt-14 overflow-hidden rounded-xl bg-cream ring-1 ring-peach"
      aria-labelledby="bridge-head"
    >
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="p-7 sm:p-9">
          <p className="label">या गोष्टीतली योजना</p>
          <h2 id="bridge-head" className="mt-2.5 font-serif text-[clamp(1.35rem,2.6vw,1.85rem)] leading-[1.3] text-ink">
            {scheme.mr}
          </h2>
          <p className="lede mt-3.5 text-[1.0625rem]">{scheme.note}</p>

          <dl className="mt-7 grid gap-x-6 gap-y-4 border-t border-peach pt-6 sm:grid-cols-2">
            <div>
              <dt className="meta text-warm-600">कोणासाठी</dt>
              <dd className="mt-0.5 font-serif text-[1rem] leading-snug text-ink-2">
                खुल्या प्रवर्गातील आर्थिकदृष्ट्या दुर्बल घटक
              </dd>
            </div>
            <div>
              <dt className="meta text-warm-600">उत्पन्न मर्यादा</dt>
              <dd className="mt-0.5 font-serif text-[1rem] leading-snug text-ink-2">
                वार्षिक ₹८ लाखांपेक्षा कमी
              </dd>
            </div>
            {article?.districtMr && (
              <div>
                <dt className="meta text-warm-600">जिल्हा कार्यालय</dt>
                <dd className="mt-0.5 font-serif text-[1rem] leading-snug text-ink-2">
                  {article.districtMr}
                </dd>
              </div>
            )}
            <div>
              <dt className="meta text-warm-600">चौकशी</dt>
              <dd className="mt-0.5 font-serif text-[1rem] leading-snug">
                <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="text-saffron-deep underline-grow">
                  {org.phone}
                </a>
              </dd>
            </div>
          </dl>

          <a
            href={schemeUrl(scheme.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-saffron px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-saffron-deep"
          >
            या योजनेसाठी अर्ज करा
            <ArrowOut className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div className="hidden items-center bg-cream-2/60 p-6 md:flex">
          <Img
            data={img(scheme.image)}
            alt={scheme.mr}
            sizes="40vw"
            className="w-full rounded-md object-contain"
          />
        </div>
      </div>
    </Reveal>
  )
}
