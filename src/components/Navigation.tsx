"use client";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-secondary/15 blur-lg" />
      <div className="border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-lg font-semibold text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
                💸
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold text-green/90 group-hover:text-green transition-colors">
                  XPENSIFY
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
                  Finance Reimagined
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative text-green/80 transition-colors hover:text-green"
                >
                  <span>{link.label}</span>
                  <span className="pointer-events-none absolute inset-x-0 -bottom-2 h-px scale-x-0 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/auth" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" className="bg-white/5 backdrop-blur-sm hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-[var(--gradient-accent)] text-[hsl(var(--secondary-foreground))] shadow-[var(--shadow-glow)] hover:opacity-90"
                >
                  Get Started
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden bg-white/5 hover:bg-white/10">
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
