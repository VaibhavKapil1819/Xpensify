"use client";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  // { label: "Features", href: "#features" },
  // { label: "How It Works", href: "#how-it-works" },
  // { label: "Pricing", href: "#pricing" },
  // { label: "About", href: "#about" },
];

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      {/* Elegant background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-transparent to-[hsl(var(--secondary))/0.08] blur-2xl" />

      {/* Glass morphism nav bar */}
      <div
        className={`border-b backdrop-blur-xl transition-all duration-500 ${scrolled
          ? 'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] shadow-[var(--shadow-elegant)]'
          : 'border-white/10 bg-background/60'
          }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Logo with enhanced styling */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gradient-accent)] text-xl font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[var(--shadow-intense)]">
                💸
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-foreground/95 group-hover:text-blue-600 transition-colors duration-300 tracking-tight">
                  XPENSIFY
                </span>
                <span className="text-[10px] uppercase tracking-[0.35em] text-foreground/50 group-hover:text-foreground/70 transition-colors duration-300">
                  Finance Reimagined
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with elegant hover effects */}
            {/* <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative text-foreground/80 transition-all duration-300 hover:text-blue-600"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
                  <span className="absolute inset-0 -z-10 bg-blue-600/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
                </a>
              ))}
            </div> */}

            {/* Actions with premium buttons */}
            <div className="flex items-center gap-3">
              <Link href="/auth" className="hidden md:inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-[hsl(var(--glass-bg))] backdrop-blur-md border border-[hsl(var(--glass-border))] hover:bg-blue-600/10 hover:border-blue-600/40 transition-all duration-300 text-foreground/90 font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="sm"
                  className="btn-premium text-primary-foreground font-semibold shadow-[var(--shadow-glow)] px-6 py-2.5"
                >
                  Get Started
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden bg-[hsl(var(--glass-bg))] backdrop-blur-md border border-[hsl(var(--glass-border))] hover:bg-blue-600/10 transition-all duration-300"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
