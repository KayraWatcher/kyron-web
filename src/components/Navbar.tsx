import { useEffect, useState } from 'react'
import { APP_NAME, NAV_LINKS } from '../config/appConfig'
import DownloadButton from './DownloadButton'

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const close = () => setOpen(false)

  return (
    <header className="nav" style={scrolled ? { boxShadow: '0 12px 30px -24px rgba(0,0,0,0.9)' } : undefined}>
      <div className="container nav__inner">
        <a className="brand" href="#/" onClick={close} aria-label={`${APP_NAME} ana sayfa`}>
          <BrandMark />
          <span>{APP_NAME}</span>
        </a>

        <nav className="nav__links" aria-label="Ana menü">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="nav__link" href={link.href} onClick={close}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <DownloadButton className="nav__cta" />
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-drawer"
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      <div id="nav-drawer" className="nav__drawer" hidden={!open}>
        <div className="container" style={{ padding: 0 }}>
          <ul className="nav__drawer-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a className="nav__drawer-link" href={link.href} onClick={close}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <DownloadButton className="btn--lg" />
        </div>
      </div>
    </header>
  )
}

function BrandMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0c1119" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" fill="none" stroke="#26313f" />
      <path d="M20 16v32" stroke="#3d8bfd" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M44 16L24 32l20 16"
        stroke="#e9eef6"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
