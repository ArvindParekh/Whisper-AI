import { HeroSection } from "@/components/home/hero-section"
import { HowItWorks } from "@/components/home/how-it-works"
import { PricingSection } from "@/components/home/pricing-section"
import { TrustSection } from "@/components/home/trust-section"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <HowItWorks />
      <PricingSection />
      <TrustSection />
    </div>
  )
}
