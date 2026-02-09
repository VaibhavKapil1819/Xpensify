"use client";
import { Heart, Linkedin, Mail, Twitter, Lock } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-gray-800 bg-black py-20 px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Subtle matte texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid gap-12 lg:grid-cols-3 mb-12">
          {/* Brand Section */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 border border-gray-800 text-2xl transition-transform duration-300 hover:scale-110 hover:border-gray-700">
                💸
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </span>
              <div>
                <p className="text-xl font-bold text-white">XPENSIFY</p>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Financial Intelligence</p>
              </div>
            </div>
            <p className="mb-6 max-w-sm text-base text-gray-300 leading-relaxed">
              Your AI-powered companion for mastering money. Learn, plan, and grow with clarity while XPENSIFY safeguards
              your data.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Private by design.</span>
            </div>
          </div>

          {/* Security & Trust Section - Fills the center with values */}
          <div className="animate-fade-in-up lg:px-8" style={{ animationDelay: '100ms' }}>
            <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-300 mb-6 font-mono">Our Principles</h4>
            <div className="space-y-4">
              {[
                { label: "Privacy First", desc: "Your data is encrypted and never sold." },
                { label: "AI Transparency", desc: "Logic rooted in verified financial data." },
                { label: "Zero Ads", desc: "A clean experience focused on your growth." },
                { label: "Data Control", desc: "You own your information, always." },
              ].map((item) => (
                <div key={item.label} className="group">
                  <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="animate-fade-in-up lg:text-right" style={{ animationDelay: '200ms' }}>
            <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-300 mb-6 font-mono">Contact Support</h4>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Reach out to our experts for personalized guidance.
            </p>
            <div className="flex flex-col gap-3 lg:items-end">
              <a
                href="mailto:xpensify.financialguide@gmail.com"
                className="group inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gray-900 border border-gray-800 text-white hover:border-emerald-500/50 hover:bg-gray-800 transition-all duration-300 font-medium shadow-[var(--shadow-soft)]"
              >
                <Mail className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                xpensify.financialguide@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-800 pt-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p className="font-medium">© {new Date().getFullYear()} XPENSIFY. All rights reserved.</p>
          <p className="flex items-center gap-2 font-medium">
            Crafted with <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500 animate-pulse" /> to unlock financial freedom.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
