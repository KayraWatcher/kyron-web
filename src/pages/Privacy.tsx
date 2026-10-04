import LegalLayout, { LegalBlock } from './LegalLayout'
import { LEGAL_PAGES } from '../config/appConfig'

export default function Privacy() {
  const { title, updatedAt } = LEGAL_PAGES.privacy

  return (
    <LegalLayout title={title} updatedAt={updatedAt}>
      <LegalBlock
        heading="Metin hazırlanıyor"
        text="Gizlilik politikası metni henüz hazırlanmadı. Bu alan, yasal metin onaylandığında doldurulacaktır."
      />
      <span className="legal__placeholder">Placeholder içerik</span>
      <LegalBlock
        heading="Uygulama telemetrisi (anonim)"
        text="KYRON, uygulamanın genel kullanımını anlamak için anonim telemetry verisi toplar. Toplanan bilgiler: rastgele üretilen anonim kurulum kimliği (UUID), uygulama sürümü, platform (ör. android), ilk açılış ve son açılış zamanları ile uygulamanın açılması veya sürüm güncellemesi gibi teknik olaylar. Bu verilere ad, e-posta, telefon, konum, IP adresi, reklam kimliği, cihaz içeriği veya finansal bilgi dahil edilmez. Anonim kurulum kimliği gerçek kullanıcı kimliği değildir; uygulama cihazdan silinip yeniden kurulduğunda yenisi üretilir."
      />
    </LegalLayout>
  )
}
