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
import type { PricingData } from './PricingBanner'
import Footer from './Footer'
import CoinTrail from './CoinTrail'
import LiterasisSection from './LiterasisSection'

interface LandingPageProps {
  pricingData?: PricingData
}

export default function LandingPage({ pricingData }: LandingPageProps) {
  return (
    <>
      <CoinTrail />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <LiterasisSection />
      <PainSection />
      <MisiPintarSection />
      <PahlawanRumahSection />
      <TabunganSection />
      <HowItWorks />
      <TestimoniSection />
      <FaqSection />
      <PricingBanner pricingData={pricingData} />
      <Footer />
    </>
  )
}
