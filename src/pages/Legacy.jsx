import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { categories } from '../lib/content'
import { loadArticle } from '../lib/articles'
import NotFound from './NotFound'

/**
 * Old addresses from the PHP site — shared on WhatsApp, indexed by search
 * engines, printed on posters — keep working after the switch:
 *   news.php?id=123                  → the story's new page
 *   category_news.php?category=News  → the category page
 *   about_us.php                     → /about-us
 *   amrut_family_registration.php    → /amrut-parivar-survey
 *   index.php                        → /
 */
export default function Legacy({ kind }) {
  const { search } = useLocation()
  const q = new URLSearchParams(search)
  const [to, setTo] = useState(undefined)

  useEffect(() => {
    if (kind !== 'news') return
    let live = true
    loadArticle(q.get('id') || '').then((a) => live && setTo(a ? a.href : null))
    return () => {
      live = false
    }
  }, [kind, search])

  if (kind === 'home') return <Navigate to="/" replace />
  if (kind === 'about') return <Navigate to="/about-us" replace />
  if (kind === 'survey') return <Navigate to="/amrut-parivar-survey" replace />
  if (kind === 'category') {
    const c = categories.find((x) => x.key === q.get('category'))
    return c ? <Navigate to={`/${c.slug}`} replace /> : <NotFound />
  }
  if (to === undefined) return <div className="min-h-[60vh]" aria-busy="true" />
  return to ? <Navigate to={to} replace /> : <NotFound />
}
