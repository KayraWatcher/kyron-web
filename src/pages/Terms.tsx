import LegalLayout, { LegalBlock } from './LegalLayout'
import { LEGAL_PAGES } from '../config/appConfig'

export default function Terms() {
  const { title, updatedAt } = LEGAL_PAGES.terms

  return (
    <LegalLayout title={title} updatedAt={updatedAt}>
      <LegalBlock
        heading="Metin hazırlanıyor"
        text="Kullanım koşulları metni henüz hazırlanmadı. Bu alan, yasal metin onaylandığında doldurulacaktır."
      />
      <span className="legal__placeholder">Placeholder içerik</span>
    </LegalLayout>
  )
}
