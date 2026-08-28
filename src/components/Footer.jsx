import { Link } from 'react-router-dom'
import { byRegister, org, schemes, schemeUrl, img } from '../lib/content'

const logoLeft = img('components/assets/Amrutmh.png')

function Column({ title, children }) {
  return (
    <div>
      <p className="mb-4 border-b border-white/10 pb-2 text-[13px] font-semibold text-saffron">{title}</p>
      {children}
    </div>
  )
}

function Links({ items }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((c) => (
        <li key={c.slug}>
          <Link to={`/${c.slug}`} className="text-[14.5px] leading-snug text-cream/70 transition-colors hover:text-cream">
            {c.mr}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.5fr] lg:gap-10">
          <div>
            {logoLeft && (
              <img
                src={logoLeft.src}
                alt="अमृत महाराष्ट्र"
                className="h-11 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <p className="mt-5 max-w-xs font-serif text-[1.0625rem] leading-relaxed text-cream/80">
              सकारात्मक बातम्या आणि माहितीचे अधिकृत संकेतस्थळ
            </p>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-cream/50">{org.mr}</p>
          </div>

          <Column title="माणसं">
            <Links items={byRegister('people')} />
          </Column>

          <Column title="संस्था व संचित">
            <Links items={[...byRegister('record'), ...byRegister('archive').slice(0, 3)]} />
          </Column>

          <div className="flex flex-col gap-8">
            <Column title="योजनांसाठी अर्ज">
              <ul className="flex flex-col gap-2">
                {schemes.map((s) => (
                  <li key={s.id}>
                    <a
                      href={schemeUrl(s.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14.5px] leading-snug text-cream/70 transition-colors hover:text-cream"
                    >
                      {s.mr} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Column>

            <Column title="संपर्क">
              <address className="flex flex-col gap-1.5 not-italic text-[14px] leading-relaxed text-cream/70">
                <a href={`mailto:${org.email}`} className="transition-colors hover:text-cream">{org.email}</a>
                <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-cream">{org.phone}</a>
                <span className="mt-1 text-cream/50">{org.address}</span>
              </address>
            </Column>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-7 text-[13px] text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 अमृत महाराष्ट्र. सर्व हक्क राखीव.</p>
          <p>महाराष्ट्र शासनाचे अधिकृत संकेतस्थळ</p>
        </div>
      </div>
    </footer>
  )
}
