import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Preloader from './components/Preloader'
import ScrollProgress from './components/ScrollProgress'
import Assistant from './components/Assistant'
import Home from './pages/Home'

/* Everything beyond the homepage is split out; article bodies and full
   category lists are fetched as JSON when those pages open. */
const Category = lazy(() => import('./pages/Category'))
const About = lazy(() => import('./pages/About'))
const Survey = lazy(() => import('./pages/Survey'))
const Legacy = lazy(() => import('./pages/Legacy'))
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
            <Route path="/about-us" element={<About />} />
            <Route path="/amrut-parivar-survey" element={<Survey />} />
            <Route path="/news.php" element={<Legacy kind="news" />} />
            <Route path="/category_news.php" element={<Legacy kind="category" />} />
            <Route path="/about_us.php" element={<Legacy kind="about" />} />
            <Route path="/amrut_family_registration.php" element={<Legacy kind="survey" />} />
            <Route path="/index.php" element={<Legacy kind="home" />} />
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
