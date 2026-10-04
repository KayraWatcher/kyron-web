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
    </LegalLayout>
  )
}
