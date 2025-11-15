
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  Target, 
  MessageCircle, 
  GraduationCap, 
  TrendingUp,
  LogOut 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from "next/navigation";

export default function DashboardNav() {
  const { signOut } = useAuth();
    const pathname = usePathname();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/learning', icon: GraduationCap, label: 'Learn' },
    { path: '/budget', icon: TrendingUp, label: 'Budget' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <header className="glass-card sticky top-0 z-50 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={"/dashboard"} className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold gradient-text">XPENSIFY</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
               const isActive = pathname === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={isActive ? 'bg-accent/20 text-accent' : ''}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Button onClick={signOut} variant="ghost" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
