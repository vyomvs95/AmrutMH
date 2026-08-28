import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Img from '../components/Img'
import Reveal from '../components/Reveal'
import { SchemeBridge } from '../components/Scheme'
import { StoryCard } from '../components/Cards'
import { itemById, img, dateMr, schemeFor, hasArticle, org } from '../lib/content'
import { articleById, articleHero } from '../lib/articles'
import NotFound from './NotFound'

function Meta({ article }) {
  const rows = [
    ['लेखक', article.author],
    ['दिनांक', dateMr(article.date)],
    ['जिल्हा', article.districtMr],
    ['वाचन', article.views],
  ].filter(([, v]) => v)

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-1 lg:gap-y-5">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="meta text-warm-400">{k}</dt>
          <dd className="mt-0.5 font-serif text-[1rem] leading-snug text-ink-2">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function Article() {
  const { id } = useParams()
  const article = articleById(id)

  useEffect(() => {
    if (article) document.title = `${article.title} — अमृत महाराष्ट्र`
    window.scrollTo(0, 0)
  }, [article, id])

  if (!article) return <NotFound />

  const hero = articleHero(article)
  const scheme = schemeFor(article)
  const related = article.related.map(itemById).filter(Boolean).filter((i) => hasArticle(i.id)).slice(0, 3)
  const inlineImages = article.images.map(img).filter(Boolean).slice(1)

  return (
    <article>
      {/* Head */}
      <div className="border-b border-warm-200 bg-cream">
        <div className="mx-auto max-w-[86rem] px-5 py-9 sm:px-8 sm:py-12">
          <nav aria-label="मार्ग" className="meta flex flex-wrap items-center gap-2">
            <Link to="/" className="transition-colors hover:text-saffron-deep">मुख्य पृष्ठ</Link>
            <span className="text-warm-300" aria-hidden="true">/</span>
            <Link to={`/${article.catSlug}`} className="transition-colors hover:text-saffron-deep">{article.catMr}</Link>
          </nav>

          <h1 className="mt-5 max-w-[44rem] font-serif text-[clamp(1.75rem,4vw,2.9rem)] leading-[1.26] text-ink">
            {article.title}
          </h1>

          {article.summary && <p className="lede mt-5 max-w-[38rem]">{article.summary}</p>}
        </div>
      </div>

      {/* Hero image, full width but held to a calm ratio */}
      {hero && (
        <div className="mx-auto max-w-[64rem] px-5 sm:px-8">
          <figure className="-mt-px">
            <Img
              data={hero}
              alt={article.title}
              priority
              sizes="(min-width: 1024px) 62rem, 100vw"
              className="aspect-[3/2] w-full rounded-lg object-cover"
            />
          </figure>
        </div>
      )}

      {/* Body + meta rail */}
      <div className="mx-auto max-w-[64rem] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_11rem] lg:gap-14">
          <div className="min-w-0">
            <div className="prose-mr">
              {article.paragraphs.map((p, i) => {
                /* The office address and helpline the article carries in
                   prose are pulled out and set as contact details, not
                   buried mid-paragraph. Words are unchanged. */
                const isOffice = p === article.office
                const isHelp = p === article.helpline
                if (isOffice || isHelp) return null
                return <p key={i}>{p}</p>
              })}
            </div>

            {inlineImages.length > 0 && (
              <div className="mt-10 flex flex-col gap-6">
                {inlineImages.map((im, i) => (
                  <Reveal key={i}>
                    <Img
                      data={im}
                      alt=""
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="w-full rounded-lg object-cover"
                    />
                  </Reveal>
                ))}
              </div>
            )}

            {/* District office — lifted out of the prose */}
            {(article.office || article.helpline) && (
              <aside className="measure mt-10 rounded-lg border border-warm-200 p-6">
                <p className="label">जिल्हा कार्यालय</p>
                {article.office && (
                  <p className="mt-2 font-serif text-[1.0625rem] leading-relaxed text-ink-2">{article.office}</p>
                )}
                {article.helpline && (
                  <p className="mt-2.5 font-serif text-[1.0625rem] text-saffron-deep">{article.helpline}</p>
                )}
              </aside>
            )}

            {/* The bridge — a real next step instead of a dead end */}
            <SchemeBridge scheme={scheme} article={article} />

            {/* Who AMRUT is — identical on every article, so it is set
                once, quietly, as reference rather than as story. */}
            {article.boilerplate && (
              <details className="mt-10 rounded-lg bg-warm-100/70 px-6 py-5">
                <summary className="cursor-pointer font-serif text-[1.0625rem] text-ink marker:text-saffron">
                  अमृत संस्थेविषयी
                </summary>
                <p className="mt-3 text-[15px] leading-[1.85] text-ink-2">
                  {article.boilerplate.replace(/^अमृत संस्थेविषयी\s*:?\s*/, '')}
                </p>
                <a
                  href={org.portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[14px] font-semibold text-saffron-deep"
                >
                  <span className="underline-grow">अधिकृत संकेतस्थळ</span>
                </a>
              </details>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-t border-warm-200 pt-6 lg:border-t-0 lg:border-l lg:pl-7 lg:pt-0">
              <Meta article={article} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-warm-200 bg-cream/60" aria-labelledby="related-head">
          <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-20">
            <h2 id="related-head" className="mb-9 border-b border-peach pb-4 font-serif text-[clamp(1.4rem,2.8vw,1.9rem)] leading-tight text-ink">
              संबंधित गोष्टी
            </h2>
            <div className="grid gap-x-8 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, i) => (
                <Reveal key={item.id} delay={i * 90}>
                  <StoryCard item={item} showCat />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
