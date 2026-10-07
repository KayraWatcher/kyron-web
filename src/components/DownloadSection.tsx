import { APK_RELEASE, APP_NAME } from '../config/appConfig'
import { DownloadIcon } from './DownloadButton'
import { useReveal } from '../hooks/useReveal'

/**
 * APK indirme bölümü.
 *
 * `APK_RELEASE` içindeki alanlar null ise sahte değer gösterilmez:
 *  - url yoksa  -> buton "yakında" durumuna geçer, link basılmaz
 *  - version yoksa -> sürüm satırı hiç gösterilmez
 *  - fileSize yoksa -> boyut satırı hiç gösterilmez
 */
export default function DownloadSection() {
  const ref = useReveal<HTMLElement>()

  const { url, version, fileSize } = APK_RELEASE
  const available = Boolean(url)
  const href = url ? (url.startsWith('/') ? '/kyron-web' + url : url) : null

  const facts: Array<{ label: string; value: string }> = []
  if (version) facts.push({ label: 'Sürüm', value: version })
  if (fileSize) facts.push({ label: 'Dosya boyutu', value: fileSize })
  facts.push({ label: 'Platform', value: 'Android' })

  return (
    <section className="section" id="indir" ref={ref}>
      <div className="container">
        <div className="download reveal">
          <div>
            <span className="eyebrow">İndir</span>
            <h2 className="download__title">{APP_NAME}’u Android’e indir</h2>
            <p className="download__lead">
              En güncel Android sürümünü indir ve Türkiye piyasalarını takip etmeye başla.
              Uygulama APK olarak dağıtılır.
            </p>

            <div className="download__facts">
              {facts.map((fact) => (
                <span className="fact" key={fact.label}>
                  {fact.label}: <strong>{fact.value}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="download__panel">
            <span className="download__panel-title">En güncel Android sürümü</span>

            {available ? (
              <a className="btn btn--primary btn--lg download__btn" href={href!} download>
                <DownloadIcon />
                APK indir
              </a>
            ) : (
              <button type="button" className="btn btn--lg download__btn" disabled aria-disabled="true">
                <DownloadIcon />
                APK indir
              </button>
            )}

            <p className="download__status">
              {available
                ? 'Dosya indirmeye hazır.'
                : 'İndirme bağlantısı henüz yayında değil. APK yayınlandığında bu buton aktif olacak.'}
            </p>

            {!version && !fileSize && (
              <p className="download__status" style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                Sürüm ve dosya boyutu bilgisi yayınlandığında burada listelenecek.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
