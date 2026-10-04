import { useReveal } from '../hooks/useReveal'

const GROUPS = [
  {
    label: 'Borsa',
    items: ['BIST 100', 'BIST 30', 'Sektör endeksleri', 'Hisse senetleri'],
  },
  {
    label: 'Döviz',
    items: ['USD/TRY', 'EUR/TRY', 'GBP/TRY', 'Serbest piyasa'],
  },
  {
    label: 'Kıymetli madenler',
    items: ['Gram altın', 'Çeyrek altın', 'Gümüş', 'Ons altın'],
  },
  {
    label: 'Diğer',
    items: ['Fonlar', 'Haberler', 'Ekonomik takvim', 'Portföy'],
  },
]

/**
 * Piyasa kapsamını gösteren bölüm.
 * Fiyat veya değişim değeri göstermez — gerçek veri bağlantısı henüz yok.
 */
export default function Markets() {
  const ref = useReveal<HTMLElement>()

  return (
    <section className="section" id="piyasalar" ref={ref}>
      <div className="container">
        <header className="section__head reveal">
          <span className="eyebrow">Piyasalar</span>
          <h2 className="section__title">Takip edebileceğin piyasa grupları</h2>
          <p className="section__lead">
            KYRON; borsa, döviz, kıymetli madenler ve fonları tek çatı altında toplar.
          </p>
        </header>

        <div className="markets">
          {GROUPS.map((group) => (
            <div className="market reveal" key={group.label}>
              <div className="market__label">{group.label}</div>
              <div className="market__items">
                {group.items.map((item) => (
                  <span className="market__tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="markets__note">
          Bu bölüm yalnızca kapsamı gösterir. Fiyat ve değişim verisi bu sitede gösterilmez; canlı
          veriler KYRON uygulamasında yer alır.
        </p>
      </div>
    </section>
  )
}
