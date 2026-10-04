import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="empty-state">
        <div className="container">
          <h1>Sayfa bulunamadı</h1>
          <p>Aradığın sayfa mevcut değil.</p>
          <a className="btn btn--primary" href="#/">
            Ana sayfaya dön
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
