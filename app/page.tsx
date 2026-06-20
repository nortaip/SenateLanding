import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TrustedBy } from "@/components/TrustedBy";
import { Ecosystem } from "@/components/Ecosystem";
import { Screenshots } from "@/components/Screenshots";
import { Spotlight } from "@/components/Spotlight";
import { Features } from "@/components/Features";
import { Workflow } from "@/components/Workflow";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";
import { About } from "@/components/About";
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
        <Spotlight />
        <Features />
        <Workflow />
        <Stats />
        <Testimonials />
        <About />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
