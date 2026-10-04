import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Props {
  title: string
  updatedAt: string | null
  children: ReactNode
}

/**
 * Yasal sayfalar için ortak iskelet.
 * İçerik placeholder olarak bırakılmıştır; gerçek hukuki metin
 * sonraki aşamada buraya eklenecektir.
 */
export default function LegalLayout({ title, updatedAt, children }: Props) {
  return (
    <>
      <Navbar />
      <main className="section section--plain">
        <div className="container legal">
          <h1 className="legal__title">{title}</h1>
          <p className="legal__updated">
            {updatedAt ? `Son güncelleme: ${updatedAt}` : 'Son güncelleme: —'}
          </p>
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}

export function LegalBlock({ heading, text }: { heading: string; text: string }) {
  return (
    <section className="legal__block">
      <h3>{heading}</h3>
      <p>{text}</p>
    </section>
  )
}
