'use client'
import Navbar from './Navbar'
import HeroSection from './HeroSection'
import StatsBar from './StatsBar'
import PainSection from './PainSection'
import MisiPintarSection from './MisiPintarSection'
import PahlawanRumahSection from './PahlawanRumahSection'
import TabunganSection from './TabunganSection'
import HowItWorks from './HowItWorks'
import TestimoniSection from './TestimoniSection'
import FaqSection from './FaqSection'
import PricingBanner from './PricingBanner'
import Footer from './Footer'
import CoinTrail from './CoinTrail'

export default function LandingPage() {
  return (
    <>
      <CoinTrail />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <PainSection />
      <MisiPintarSection />
      <PahlawanRumahSection />
      <TabunganSection />
      <HowItWorks />
      <TestimoniSection />
      <FaqSection />
      <PricingBanner />
      <Footer />
    </>
  )
}
