
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <section
        id="features"
        className="relative py-20"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(173,80%,40%,0.08),transparent_60%)]" />
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
            <div className="h-full w-full bg-[linear-gradient(to_right,transparent,hsla(0,0%,100%,0.05)_1px,transparent_1px),linear-gradient(to_bottom,transparent,hsla(0,0%,100%,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
          </div>
        </div>
        <Features />
      </section>
      <section className="relative py-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <HowItWorks />
      </section>
      <Footer />
    </div>
  );
}
