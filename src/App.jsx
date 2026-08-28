import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Preloader from './components/Preloader'
import ScrollProgress from './components/ScrollProgress'
import Assistant from './components/Assistant'
import Home from './pages/Home'

/* The 32 full article bodies are the heaviest part of the payload and
   only the article route needs them, so that route is split out. */
const Category = lazy(() => import('./pages/Category'))
const Article = lazy(() => import('./pages/Article'))
const NotFound = lazy(() => import('./pages/NotFound'))

const Loading = () => <div className="min-h-[60vh]" aria-hidden="true" />

export default function App() {
  const { pathname } = useLocation()

  return (
    <>
      <Preloader />
      <ScrollProgress />
      <Header />

      {/* keyed on the path so each route enters rather than snapping in */}
      <main id="main" key={pathname} className="page-in">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:catSlug" element={<Category />} />
            <Route path="/:catSlug/:id/:slug?" element={<Article />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <Assistant />
    </>
  )
}
