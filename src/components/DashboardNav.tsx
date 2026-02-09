"use client";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Target,
  MessageCircle,
  GraduationCap,
  TrendingUp,
  User as UserIcon,
  LogOut,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from 'react';

export default function DashboardNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/learning', icon: GraduationCap, label: 'Learn' },
    { path: '/budget', icon: TrendingUp, label: 'Budget' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      {/* Elegant background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-transparent to-[hsl(var(--secondary))/0.08] blur-2xl" />

      {/* Glass morphism nav bar */}
      <div className="border-b border-white/20 backdrop-blur-xl bg-background/60 transition-all duration-500 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            {/* Logo with enhanced styling */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
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
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`group relative transition-all duration-300 ${isActive
                        ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20'
                        : 'text-foreground/80 hover:text-blue-600 hover:bg-blue-600/5'
                        }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span className="relative z-10">{item.label}</span>
                      {!isActive && (
                        <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-blue-600/5 transition-all duration-300 border border-transparent hover:border-blue-600/20"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-white/20">
                  {getInitials(user?.full_name || "")}
                </div>
                <ChevronDown className={`w-4 h-4 text-foreground/40 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-card border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-[60]">
                  <div className="p-4 border-b border-foreground/5 bg-foreground/[0.02]">
                    <p className="text-sm font-bold text-foreground/90 truncate">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-foreground/40 truncate">{user?.email}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 w-full p-3 rounded-xl text-sm text-foreground/70 hover:text-blue-600 hover:bg-blue-600/10 transition-all duration-200"
                    >
                      <UserIcon size={18} />
                      <span>View Profile</span>
                    </Link>
                  </div>

                  <div className="p-2 border-t border-foreground/5 bg-foreground/[0.01]">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 w-full p-3 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
