import { CTASection } from '@/components/CTASection';
import { FeatureSection } from '@/components/FeatureSection';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { Navbar } from '@/components/Navbar';
import { TestimonialSection } from '@/components/TestimonialSection';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeatureSection />
        <HowItWorksSection />
        <TestimonialSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
