"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/hero-bg.jpg"
          width={1920}
          height={1080}
          alt="XPENSIFY Dashboard"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(173,80%,40%,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/85 to-background" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-primary/25 rounded-full blur-3xl animate-pulse [animation-duration:3s]" />
      <div className="absolute bottom-24 right-12 w-48 h-48 bg-accent/25 rounded-full blur-3xl animate-pulse [animation-duration:4s]" />
      <div className="absolute -top-10 right-1/3 w-[56rem] h-[56rem] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-[120px] opacity-60" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-md border border-primary/20 shadow-[var(--shadow-glow)] mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI-Powered Financial Companion</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
          <span className="block text-green/90">Get Closer to Your</span>
          <span className="block mt-2 gradient-text drop-shadow-[0_6px_32px_hsl(173_80%_40%/.45)]">
            Financial Goals
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-green/80 mb-10 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Master money through smart goal-setting, personalized AI coaching, and continuous learning. XPENSIFY empowers you to understand finance and achieve your dreams.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link href="/auth">
            <Button size="lg" className="group bg-[var(--gradient-accent)] text-[hsl(var(--secondary-foreground))] hover:opacity-90 shadow-[var(--shadow-glow)]">
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="backdrop-blur-md glass-input">
              Learn More
            </Button>
          </a>
        </div>

        {/* Trust Badge */}
        <p className="mt-12 text-sm text-green/70 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          🔒 Your data stays private. No ads. No tracking. Just personal growth.
        </p>
      </div>
    </section>
  );
};

export default Hero;
