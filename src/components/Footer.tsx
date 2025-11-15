"use client";
import { Heart, Linkedin, Mail, Twitter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-transparent via-[hsla(221,69%,33%,0.16)] to-background py-16 px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="absolute -top-24 right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-16 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container mx-auto">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gradient-accent)] text-2xl shadow-[var(--shadow-glow)]">
                💸
              </span>
              <div>
                <p className="text-xl font-semibold text-blue/90">XPENSIFY</p>
                <p className="text-xs uppercase tracking-[0.35em] text-blue/50">Financial Intelligence</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-base text-blue/65">
              Your AI-powered companion for mastering money. Learn, plan, and grow with clarity while XPENSIFY safeguards
              your data and amplifies your financial confidence.
            </p>
            <p className="mt-4 text-sm text-blue/50">
              🔒 Private by design. No ads. No tracking. You’re always in control.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue/60">Explore</h4>
            <ul className="mt-6 space-y-3 text-blue/70">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Pricing", href: "#pricing" },
                { label: "Success Stories", href: "#stories" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
                  >
                    <span className="h-px w-5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue/60">Stay in the Loop</h4>
            <p className="mt-6 text-sm text-blue/65">
              Monthly insights on financial wellness, product updates, and curated learning paths.
            </p>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="you@finance.com"
                className="flex-1 border-white/15 bg-white/5 text-blue placeholder:text-blue/40 focus-visible:ring-primary/60"
              />
              <Button
                type="submit"
                className="bg-[var(--gradient-accent)] text-[hsl(var(--secondary-foreground))] shadow-[var(--shadow-glow)] hover:opacity-90"
              >
                Subscribe
              </Button>
            </form>
            <div className="mt-6 flex gap-4 text-blue/60">
              {[
                { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com" },
                { icon: Twitter, label: "Twitter", href: "https://www.twitter.com" },
                { icon: Mail, label: "Email", href: "mailto:hello@xpensify.ai" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-primary/50 hover:text-primary"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-blue/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} XPENSIFY. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Crafted with <Heart className="h-4 w-4 text-primary fill-primary" /> to unlock financial freedom.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
