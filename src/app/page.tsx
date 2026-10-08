import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
