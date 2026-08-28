import { Link } from 'react-router-dom'
import { categories } from '../lib/content'

/**
 * The live site sends every wrong URL to a stock third-party template
 * with no masthead, no Marathi and no way back. This one stays inside
 * the site and offers the reader somewhere to go.
 */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 sm:py-28">
      <div className="max-w-2xl">
        <p className="label">पृष्ठ सापडले नाही</p>
        <h1 className="mt-3 font-serif text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.26] text-ink">
          हे पान उपलब्ध नाही
        </h1>
        <p className="lede mt-4">
          आपण शोधत असलेले पान हलवले गेले असावे किंवा दुवा चुकीचा असावा. खालील विभागांतून पुढे जाता येईल.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-cream transition-colors hover:bg-saffron-deep"
        >
          मुख्य पृष्ठाकडे जा
        </Link>
      </div>

      <div className="mt-14 border-t border-warm-200 pt-8">
        <p className="label mb-5">सर्व विभाग</p>
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/${c.slug}`}
              className="text-[15px] font-semibold text-ink-2 transition-colors hover:text-saffron-deep"
            >
              <span className="underline-grow">{c.mr}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
