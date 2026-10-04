import { APP_NAME, FOOTER_LINKS } from '../config/appConfig'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <a className="brand" href="#/">
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
              <span>{APP_NAME}</span>
            </a>
            <p className="footer__about">
              Türkiye piyasalarını takip etmek için modern finans uygulaması.
            </p>
          </div>

          <div>
            <h4 className="footer__col-title">Site</h4>
            <nav className="footer__links" aria-label="Alt menü">
              {FOOTER_LINKS.slice(0, 3).map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="footer__col-title">Yasal</h4>
            <nav className="footer__links" aria-label="Yasal bağlantılar">
              {FOOTER_LINKS.slice(3).map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {APP_NAME}. Tüm hakları saklıdır.
          </span>
          <span>Yatırım tavsiyesi değildir.</span>
        </div>
      </div>
    </footer>
  )
}
