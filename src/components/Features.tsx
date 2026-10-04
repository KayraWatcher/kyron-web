import FeatureCard, { type Feature } from './FeatureCard'
import { Icons } from './icons'
import { useReveal } from '../hooks/useReveal'

const FEATURES: Feature[] = [
  {
    title: 'Piyasalar',
    text: 'BIST, döviz, altın, gümüş ve fonları tek ekrandan takip et.',
    icon: <Icons.markets />,
  },
  {
    title: 'Portföy',
    text: 'Takip ettiğin varlıkları tek yerde düzenle.',
    icon: <Icons.portfolio />,
  },
  {
    title: 'Haberler',
    text: 'Piyasaları etkileyebilecek haberleri takip et.',
    icon: <Icons.news />,
  },
  {
    title: 'Ekonomik Takvim',
    text: 'Önemli ekonomik gelişmeleri takip et.',
    icon: <Icons.calendar />,
  },
  {
    title: 'Profesyonel Grafikler',
    text: "Varlıkların fiyat hareketlerini detaylı grafiklerle incele.",
    icon: <Icons.chart />,
  },
  {
    title: 'Kişiselleştirme',
    text: 'Ana sayfandaki varlıkları kendi kullanımına göre düzenle.',
    icon: <Icons.personalize />,
  },
]

export default function Features() {
  const ref = useReveal<HTMLElement>()

  return (
    <section className="section" id="ozellikler" ref={ref}>
      <div className="container">
        <header className="section__head reveal">
          <span className="eyebrow">Özellikler</span>
          <h2 className="section__title">Piyasa takibi için gereken her şey</h2>
          <p className="section__lead">
            KYRON, günlük piyasa takibini tek uygulamada toplar; gereksiz adımları azaltıp bilgiye
            daha hızlı ulaşmanı sağlar.
          </p>
        </header>

        <div className="grid grid--3">
          {FEATURES.map((feature) => (
            <div className="reveal" key={feature.title}>
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
