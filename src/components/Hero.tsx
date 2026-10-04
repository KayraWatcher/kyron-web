import DownloadButton from './DownloadButton'
import { APP_TAGLINE } from '../config/appConfig'
import { useReveal } from '../hooks/useReveal'

const COVERAGE = ['BIST', 'Döviz', 'Altın', 'Gümüş', 'Fonlar', 'Haberler']

export default function Hero() {
  const ref = useReveal<HTMLElement>()

  return (
    <section className="hero" ref={ref}>
      <div className="container hero__inner">
        <div>
          <span className="hero__badge">
            <span className="hero__badge-dot" />
            Türkiye piyasaları için finans uygulaması
          </span>

          <h1 className="hero__title">{APP_TAGLINE}</h1>

          <p className="hero__lead">
            KYRON; piyasa verilerini, altın, döviz, BIST, gümüş, haberleri, ekonomik takvimi ve
            portföyü tek uygulamada bir araya getirir. Piyasayı tek ekrandan, sade ve hızlı bir
            şekilde takip et.
          </p>

          <div className="hero__meta">
            {COVERAGE.map((item) => (
              <span className="chip" key={item}>
                {item}
              </span>
            ))}
          </div>

          <div className="hero__cta">
            <DownloadButton size="lg" />
            <a className="btn btn--ghost btn--lg" href="#/#ozellikler">
              Özellikleri keşfet
            </a>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <AppMockup />
        </div>
      </div>
    </section>
  )
}

/**
 * Gerçek olmayan fiyat üretmez. Yalnızca uygulama arayüzünü temsil eden
 * soyut bir CSS mockup'tır. Gerçek screenshot geldiğinde `AppShowcase`
 * içindeki placeholder alanlarıyla değiştirilebilir.
 */
function AppMockup() {
  const rows = [
    { label: 'Endeks & Borsa', code: 'BIST', width: '72%' },
    { label: 'Döviz', code: 'FX', width: '58%' },
    { label: 'Kıymetli Madenler', code: 'METAL', width: '64%' },
    { label: 'Fonlar', code: 'FUND', width: '46%' },
    { label: 'Haberler & Takvim', code: 'NEWS', width: '38%' },
  ]

  return (
    <div className="terminal">
      <div className="terminal__bar">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__label">KYRON · Piyasa Ekranı</span>
      </div>

      <div className="terminal__body">
        {rows.map((row) => (
          <div className="trow" key={row.code}>
            <div>
              <div className="trow__name">{row.label}</div>
              <div className="trow__sub">{row.code}</div>
            </div>
            <div className="trow__bar">
              <span style={{ width: row.width }} />
            </div>
          </div>
        ))}
      </div>

      <div className="terminal__foot">
        <span>Veri görselleştirme · placeholder</span>
        <span className="terminal__note">Gerçek veri değil</span>
      </div>
    </div>
  )
}
