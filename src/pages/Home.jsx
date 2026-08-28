import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import CategoryRail from '../components/CategoryRail'
import Reveal from '../components/Reveal'
import { SchemeBand } from '../components/Scheme'
import { StoryFeature, StoryCard, RecordRow, CompactRow, SectionHead } from '../components/Cards'
import { byRegister, categoryBySlug, hasArticle, districts } from '../lib/content'

/* The rotating leads: one story from each People category, preferring
   ones we hold in full so the reader can actually open them, and only
   ones with artwork strong enough to carry a full-bleed frame. */
function pickLeads(n = 5) {
  const picked = []
  for (const c of byRegister('people')) {
    const item = c.items.find((i) => hasArticle(i.id)) || c.items[0]
    if (item) picked.push(item)
  }
  return picked.slice(0, n)
}

export default function Home() {
  const leads = pickLeads()
  const lead = leads[0]

  const peopleCats = byRegister('people')
  const recordCats = byRegister('record')
  const archiveCats = byRegister('archive')

  /* Stories for the editorial rhythm — one strong item from each of the
     People categories, the lead excluded. */
  const features = peopleCats
    .map((c) => c.items.find((i) => i.id !== lead.id && hasArticle(i.id)) || c.items.find((i) => i.id !== lead.id))
    .filter(Boolean)
    .slice(0, 4)

  const beneficiary = categoryBySlug('beneficiary-story')
  const moreStories = beneficiary.items
    .filter((i) => i.id !== lead.id && !features.some((f) => f.id === i.id))
    .slice(0, 3)

  return (
    <>
      <Hero items={leads} />

      <CategoryRail />

      {/* ============================================================
          माणसं — the People strand. Editorial rhythm, alternating,
          plenty of air. This is the half of the portal worth reading
          slowly.
          ============================================================ */}
      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="people-head">
        <Reveal className="mb-12 max-w-2xl">
          <p className="label">माणसं</p>
          <h2 id="people-head" className="mt-2.5 font-serif text-[clamp(1.65rem,3.4vw,2.5rem)] leading-[1.28] text-ink">
            योजनांनी बदललेली आयुष्यं
          </h2>
          <p className="lede mt-4">
            शेतकरी, उद्योजक, विद्यार्थी आणि महिला — अमृतच्या योजनांचा लाभ घेत स्वतःच्या पायावर उभ्या राहिलेल्या माणसांच्या गोष्टी.
          </p>
        </Reveal>

        <div className="flex flex-col gap-16 sm:gap-20">
          {features.map((item, i) => (
            <Reveal key={item.id}>
              <StoryFeature item={item} flip={i % 2 === 1} />
            </Reveal>
          ))}
        </div>

        {moreStories.length > 0 && (
          <div className="mt-20">
            <SectionHead
              mr={beneficiary.mr}
              blurb={beneficiary.blurb}
              to={`/${beneficiary.slug}`}
              count={beneficiary.total}
            />
            <div className="grid gap-x-8 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
              {moreStories.map((item, i) => (
                <Reveal key={item.id} delay={i * 90}>
                  <StoryCard item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* The one place the saffron runs at full strength */}
      <SchemeBand />

      {/* ============================================================
          संस्था — the Record. Denser, quicker, built to scan.
          ============================================================ */}
      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="record-head">
        <Reveal className="mb-11 max-w-2xl">
          <p className="label">संस्था</p>
          <h2 id="record-head" className="mt-2.5 font-serif text-[clamp(1.65rem,3.4vw,2.5rem)] leading-[1.28] text-ink">
            अमृतच्या घडामोडी
          </h2>
        </Reveal>

        <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
          {recordCats.map((c, ci) => (
            <Reveal key={c.slug} delay={ci * 70}>
              <SectionHead mr={c.mr} blurb={c.blurb} to={`/${c.slug}`} count={c.total} />
              <div>
                {c.items.slice(0, 4).map((item) => (
                  <RecordRow key={item.id} item={item} showCat={false} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================
          संचित — archive. Text-forward, because much of the artwork
          here is posters and graphics rather than photographs.
          ============================================================ */}
      <section className="border-t border-warm-200 bg-cream/60">
        <div className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="archive-head">
          <Reveal className="mb-11 max-w-2xl">
            <p className="label">संचित</p>
            <h2 id="archive-head" className="mt-2.5 font-serif text-[clamp(1.65rem,3.4vw,2.5rem)] leading-[1.28] text-ink">
              लेख, परंपरा आणि वारसा
            </h2>
          </Reveal>

          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {archiveCats.map((c, ci) => (
              <Reveal as="div" key={c.slug} delay={ci * 60}>
                <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-peach pb-2.5">
                  <Link to={`/${c.slug}`} className="font-serif text-[1.2rem] leading-snug text-ink transition-colors hover:text-saffron-deep">
                    <span className="underline-grow">{c.mr}</span>
                  </Link>
                  <span className="meta shrink-0 text-warm-400">{c.total}</span>
                </div>
                <div>
                  {c.items.slice(0, 4).map((item) => (
                    <CompactRow key={item.id} item={item} />
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Districts — the first sketch of the office directory the site
          has never had. Built from the districts the stories name. */}
      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-20">
        <Reveal className="rounded-xl border border-warm-200 p-7 sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
            <div>
              <p className="label">राज्यभर</p>
              <h2 className="mt-2.5 font-serif text-[clamp(1.4rem,2.8vw,1.95rem)] leading-[1.3] text-ink">
                महाराष्ट्रातील ३६ जिल्ह्यांत अमृतची कार्यालये
              </h2>
              <p className="lede mt-3.5 text-[1.0625rem]">
                योजनांच्या माहितीसाठी आणि अर्जासाठी आपल्या जिल्ह्यातील कार्यालयाशी संपर्क साधता येतो.
              </p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {districts.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-warm-200 px-3.5 py-1.5 text-[13.5px] text-ink-2"
                >
                  {d}
                </span>
              ))}
              <span className="rounded-full bg-warm-100 px-3.5 py-1.5 text-[13.5px] text-warm-600">
                आणि इतर जिल्हे
              </span>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
