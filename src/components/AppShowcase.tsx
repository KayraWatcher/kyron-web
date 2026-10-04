import { Icons } from './icons'
import { useReveal } from '../hooks/useReveal'

const POINTS = [
  'Piyasa verilerini tek ekrandan takip et',
  'Altın, döviz, BIST ve gümüş için hızlı erişim',
  'Portföyünü tek yerden düzenle',
  'Haberler ve ekonomik takvim aynı uygulamada',
]

/**
 * Uygulama görselleri bölümü.
 *
 * Henüz gerçek screenshot yoksa SAHTE ekran görüntüsü üretilmez;
 * bunun yerine temiz CSS placeholder'lar kullanılır ve "placeholder"
 * oldukları açıkça belirtilir. Gerçek screenshot geldiğinde `shots`
 * dizisine `src` eklenerek <img> ile değiştirilebilir.
 */
export default function AppShowcase() {
  const ref = useReveal<HTMLElement>()

  const shots: Array<{ id: string; caption: string; src?: string }> = [
    { id: 'home', caption: 'Ana sayfa · placeholder' },
    { id: 'markets', caption: 'Piyasalar · placeholder' },
    { id: 'chart', caption: 'Grafik · placeholder' },
    { id: 'portfolio', caption: 'Portföy · placeholder' },
  ]

  return (
    <section className="section" ref={ref}>
      <div className="container showcase">
        <div className="reveal">
          <span className="eyebrow">Uygulama</span>
          <h2 className="section__title">Sade, hızlı ve okunabilir arayüz</h2>
          <p className="section__lead">
            KYRON, piyasa verisini gürültüden arındırılmış bir düzen ile sunar; bilgi hızlı taranır,
            önemli olan öne çıkar.
          </p>

          <ul className="showcase__list">
            {POINTS.map((point) => (
              <li className="showcase__item" key={point}>
                <span className="showcase__check">
                  <Icons.check />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="shots reveal" aria-label="Uygulama ekran görüntüleri (placeholder)">
          {shots.map((shot) => (
            <figure className="shot" key={shot.id} style={{ margin: 0 }}>
              {shot.src ? (
                <img src={shot.src} alt={`${shot.caption} ekran görüntüsü`} loading="lazy" />
              ) : (
                <>
                  <span className="shot__bar" />
                  <span className="shot__line" style={{ width: '82%' }} />
                  <span className="shot__line" style={{ width: '64%' }} />
                  <span className="shot__chart" />
                  <figcaption className="shot__caption">{shot.caption}</figcaption>
                </>
              )}
            </figure>
          ))}
          <p className="shots__note">
            Gerçek uygulama ekran görüntüleri henüz eklenmedi; yukarıdaki alanlar temsili
            placeholder’lardır.
          </p>
        </div>
      </div>
    </section>
  )
}
