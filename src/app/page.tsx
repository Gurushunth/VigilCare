import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";
import {
  ArchitectureSection,
  CompareSection,
  DemoTeaserSection,
  HowItWorksSection,
  PrinciplesSection,
  ProblemSection,
} from "@/components/landing/Sections";
import { Footer } from "@/components/landing/Footer";

// Team section intentionally omitted: team details in the brief are still placeholders.
export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <ProblemSection />
        <HowItWorksSection />
        <DemoTeaserSection />
        <CompareSection />
        <ArchitectureSection />
        <PrinciplesSection />
      </main>
      <Footer />
    </>
  );
}
