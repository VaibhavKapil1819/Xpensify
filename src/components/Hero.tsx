"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Reusable inline components as local functions
const AnimatedBadge = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[hsl(var(--glass-bg))] backdrop-blur-xl border border-[hsl(var(--glass-border))] shadow-[var(--shadow-elegant)] transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      <Sparkles className="w-4 h-4 text-blue-600 animate-glow-pulse" />
      <span className="text-sm font-semibold tracking-wide text-foreground/90">{children}</span>
    </div>
  );
};

const GradientText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span
      className={`gradient-text inline-block ${className} ${isVisible ? 'animate-text-reveal' : 'opacity-0'
        }`}
    >
      {children}
    </span>
  );
};

const FloatingBlob = ({
  size,
  color,
  top,
  left,
  right,
  bottom,
  delay = "0s",
  blur = "blur-3xl",
}: {
  size: string;
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: string;
  blur?: string;
}) => (
  <div
    className={`absolute rounded-full ${blur} animate-float opacity-60`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
      top,
      left,
      right,
      bottom,
      animationDelay: delay,
    }}
  />
);

const ShineButton = ({ children, ...props }: { children: React.ReactNode } & React.ComponentProps<"button">) => (
  <button
    className="btn-premium group relative overflow-hidden rounded-xl px-10 py-4 text-primary-foreground font-semibold shadow-[var(--shadow-glow)] text-base tracking-wide"
    {...props}
  >
    <span className="relative z-10 flex items-center gap-2">
      {children} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
    </span>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 transition-transform duration-700 group-hover:translate-x-full" />
  </button>
);

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("inview");
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="scroll-fade"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const TrustLine = () => (
  <p className="mt-12 text-sm text-foreground/70 flex items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
    <Zap className="w-4 h-4 text-blue-600 animate-glow-pulse" />
    <span>Your data stays private</span>
    <span className="text-foreground/40">•</span>
    <span>No ads</span>
    <span className="text-foreground/40">•</span>
    <span>No tracking</span>
    <span className="text-foreground/40">•</span>
    <span>Just personal growth</span>
  </p>
);

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pattern-grid">
      {/* Premium Background with Multiple Layers */}
      <div className="absolute inset-0 -z-10">
        {/* Artistic base gradient */}
        <div className="absolute inset-0 artistic-bg" />

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 artistic-overlay animate-gradient" />

        {/* Pattern overlay */}
        <div className="absolute inset-0 pattern-dots opacity-30" />

        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
      </div>

      {/* Enhanced Floating Blobs with better positioning - Blue */}
      <FloatingBlob size="18rem" color="hsl(217,91%,60%,0.12)" top="8%" left="5%" delay="0s" blur="blur-[120px]" />
      <FloatingBlob size="22rem" color="hsl(221,83%,53%,0.1)" bottom="10%" right="8%" delay="2s" blur="blur-[140px]" />
      <FloatingBlob size="28rem" color="hsl(217,91%,60%,0.08)" top="45%" left="-10%" delay="4s" blur="blur-[160px]" />
      <FloatingBlob size="16rem" color="hsl(217,91%,65%,0.08)" top="20%" right="15%" delay="1s" blur="blur-[100px]" />

      {/* Content with enhanced animations */}
      <div className="container mx-auto px-6 text-center max-w-5xl z-10">
        {/* Badge */}
        <ScrollReveal>
          <div className="mb-10">
            <AnimatedBadge>AI-Powered Financial Companion</AnimatedBadge>
          </div>
        </ScrollReveal>

        {/* Headline with staggered animation - Reduced sizes */}
        <ScrollReveal delay={100}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-foreground/95 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Get Closer to Your
            </span>
            <GradientText className="block mt-2 text-5xl md:text-6xl lg:text-7xl font-extrabold">
              Financial Goals
            </GradientText>
          </h1>
        </ScrollReveal>

        {/* Subline with refined typography */}
        <ScrollReveal delay={200}>
          <p className="text-base md:text-lg lg:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            Master money through{" "}
            <span className="text-blue-600 font-semibold">smart goal-setting</span>,{" "}
            <span className="text-blue-600 font-semibold">personalized AI coaching</span>, and continuous learning.{" "}
            <span className="block mt-2 text-sm md:text-base text-foreground/70">
              XPENSIFY empowers you to understand finance and achieve your dreams.
            </span>
          </p>
        </ScrollReveal>

        {/* CTA Buttons with enhanced styling */}
        <ScrollReveal delay={300}>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <Link href="/auth" className="w-full sm:w-auto group">
              <ShineButton>Start Your Journey </ShineButton>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <button className="px-10 py-4 rounded-xl bg-[hsl(var(--glass-bg))] backdrop-blur-xl border border-[hsl(var(--glass-border))] text-foreground hover:bg-blue-600/15 hover:border-blue-600/50 transition-all duration-300 font-semibold text-base shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)]">
                Learn More
              </button>
            </a>
          </div>
        </ScrollReveal>

        {/* Trust Line */}
        <ScrollReveal delay={400}>
          <TrustLine />
        </ScrollReveal>
      </div>
    </section>
  );
}