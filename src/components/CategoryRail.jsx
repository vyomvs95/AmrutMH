import { Link, useLocation } from 'react-router-dom'
import { categories } from '../lib/content'

/**
 * The section rail.
 *
 * Sits under the hero, then sticks directly beneath the masthead once it
 * reaches it, so from that point on it reads as the second row of the
 * navigation. The live site has no equivalent — its category bar exists
 * only on the homepage and disappears the moment you open anything.
 *
 * `top-16` matches the 4rem masthead. z-30 keeps it under the overlay menu.
 */
export default function CategoryRail({ items = categories, label = 'विभाग' }) {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label={label}
      className="sticky top-16 z-30 border-b border-warm-200 bg-paper/95 backdrop-blur-md"
    >
      <div className="no-bar mx-auto flex max-w-[86rem] gap-6 overflow-x-auto px-5 py-3 sm:px-8">
        {items.map((c) => {
          const active = pathname === `/${c.slug}`
          return (
            <Link
              key={c.slug}
              to={`/${c.slug}`}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap text-[14.5px] font-semibold transition-colors ${
                active ? 'text-saffron-deep' : 'text-ink-2 hover:text-saffron-deep'
              }`}
            >
              <span className={active ? '' : 'underline-grow'}>{c.mr}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
