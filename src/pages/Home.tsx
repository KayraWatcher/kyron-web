import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Markets from '../components/Markets'
import AppShowcase from '../components/AppShowcase'
import DownloadSection from '../components/DownloadSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Markets />
        <AppShowcase />
        <DownloadSection />
      </main>
      <Footer />
    </>
  )
}
