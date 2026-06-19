import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TrustedBy } from "@/components/TrustedBy";
import { Ecosystem } from "@/components/Ecosystem";
import { Screenshots } from "@/components/Screenshots";
import { Features } from "@/components/Features";
import { Workflow } from "@/components/Workflow";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <Ecosystem />
        <Screenshots />
        <Features />
        <Workflow />
        <Stats />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
