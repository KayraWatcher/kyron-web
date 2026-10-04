import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

type Route = 'home' | 'privacy' | 'terms' | 'not-found'

/**
 * Minimal hash tabanlı router.
 * Ekstra routing dependency eklememek için sadece hash yolları kullanılır:
 *   #/                -> Ana sayfa
 *   #/gizlilik        -> Gizlilik
 *   #/kullanim-kosullari -> Kullanım koşulları
 *   #/#section        -> Ana sayfada bölüm kaydırma
 */
function parseHash(): { route: Route; anchor: string | null } {
  const raw = window.location.hash.replace(/^#/, '')
  const [path, anchor] = raw.split('#')

  if (path === '' || path === '/') return { route: 'home', anchor: anchor ?? null }
  if (path === '/gizlilik') return { route: 'privacy', anchor: null }
  if (path === '/kullanim-kosullari') return { route: 'terms', anchor: null }

  return { route: 'not-found', anchor: null }
}

export default function App() {
  const [current, setCurrent] = useState(parseHash)

  useEffect(() => {
    const onHashChange = () => setCurrent(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (current.anchor) {
      const el = document.getElementById(current.anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [current])

  switch (current.route) {
    case 'privacy':
      return <Privacy />
    case 'terms':
      return <Terms />
    case 'not-found':
      return <NotFound />
    default:
      return <Home />
  }
}
