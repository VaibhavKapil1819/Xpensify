"use client";
import { Target, Brain, BookOpen, TrendingUp, MessageCircle, BarChart3, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: Target,
    title: "Smart Financial Goals",
    description: "AI breaks down your big dreams into achievable milestones with daily action plans and motivational tracking.",
  },
  {
    icon: Brain,
    title: "AI Financial Coach",
    description: "Your 24/7 conversational mentor explaining concepts, analyzing behaviors, and keeping you financially healthy.",
  },
  {
    icon: BookOpen,
    title: "Financial Literacy Hub",
    description: "Gamified lessons on budgeting, saving, and investing with quizzes, badges, and achievement streaks.",
  },
  {
    icon: TrendingUp,
    title: "Smart Spending Insights",
    description: "Invisible tracking that analyzes patterns and suggests optimizations without showing raw expense lists.",
  },
  {
    icon: MessageCircle,
    title: "Goal Chat Assistant",
    description: "Accountability partner checking progress, offering motivation, and adapting to your emotional state.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description: "Gamified visual home with progress rings, goal heatmaps, and financial wellness scores.",
  },
  // {
  //   icon: Shield,
  //   title: "Privacy & Trust",
  //   description: "AES-256 encryption, full data control, zero third-party sharing. Your money, your rules.",
  // },
];

const featureHighlights = [
  { label: "Financial Goals Reached", value: "52M+" },
  { label: "Users Supported", value: "110K+" },
  { label: "Coach Interactions / day", value: "900K" },
];

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

const Features = () => {
  return (
    <section id="features" className="relative overflow-hidden py-32 px-6 pattern-grid">
      {/* Enhanced background with multiple layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 artistic-bg" />
        <div className="absolute inset-0 artistic-overlay animate-gradient" />
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]">
          <div className="h-full w-full pattern-grid opacity-30" />
        </div>
      </div>

      <div className="container mx-auto relative z-10">
        <ScrollReveal>
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <Badge className="mb-6 bg-[hsl(var(--glass-bg))] backdrop-blur-xl border border-[hsl(var(--glass-border))] text-sm font-semibold text-foreground/90 px-4 py-1.5 shadow-[var(--shadow-soft)]">
              The XPENSIFY Advantage
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground/95 leading-tight">
              Everything You Need to
              <span className="block gradient-text mt-3">Master Your Money</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-foreground/75 max-w-2xl leading-relaxed">
              Seven intelligent modules, beautifully integrated to turn financial anxiety into confident progress.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-20">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 100}>
              <Card className="glass-card group relative overflow-hidden h-full hover:scale-[1.02] transition-all duration-500">
                {/* Animated glow on hover */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[hsl(var(--secondary))]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <CardHeader className="relative pb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gradient-accent)] shadow-[var(--shadow-glow)] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[var(--shadow-intense)]">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <CardTitle className="mt-5 text-xl font-bold text-foreground/95 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-base text-foreground/70 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={700}>
          <div className="mt-24 rounded-3xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] backdrop-blur-2xl p-10 md:p-12 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-intense)] transition-all duration-500">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6 animate-fade-in-up">
                <Badge className="bg-blue-600/20 text-blue-600 border border-blue-600/30 font-semibold px-4 py-1.5">
                  Real-time XPENSIFY Dashboard
                </Badge>
                <h3 className="text-3xl md:text-4xl font-bold text-foreground/95 leading-tight">
                  Insights that feel like magic, yet rooted in data you can trust.
                </h3>
                <p className="text-foreground/75 text-lg leading-relaxed">
                  From the first milestone to long-term wealth strategies, XPENSIFY connects your progress into one intuitive
                  workspace. Visualize the path forward with AI forecasts, momentum analytics, and a compassionate coach.
                </p>
                <div className="flex flex-wrap gap-8 pt-4">
                  {featureHighlights.map((highlight, idx) => (
                    <div key={highlight.label} className="animate-scale-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <p className="text-3xl md:text-4xl font-bold gradient-text">
                        {highlight.value}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 mt-1 font-medium">
                        {highlight.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative w-full overflow-hidden rounded-3xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-8 shadow-[var(--shadow-elegant)]">
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/15 via-transparent to-[hsl(var(--secondary))/0.15] opacity-60" />
                <div className="relative space-y-6">
                  <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-6 backdrop-blur-xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
                    <div className="flex items-center justify-between text-sm text-foreground/80 font-medium mb-4">
                      <span>Goal Progress</span>
                      <span className="text-blue-600 font-bold">82%</span>
                    </div>
                    <div className="mt-4 h-2.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                      <div className="h-full w-[82%] rounded-full bg-[var(--gradient-green)] shadow-[var(--shadow-green-glow)] animate-shimmer-green" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-6 backdrop-blur-xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-wider text-foreground/60 font-semibold mb-2">AI Coach</p>
                        <p className="text-lg font-semibold text-foreground/95 leading-relaxed">"Allocate 15% to your emergency fund."</p>
                      </div>
                      <span className="rounded-full bg-blue-600/20 border border-blue-600/40 px-3 py-1.5 text-xs text-blue-600 font-semibold whitespace-nowrap">
                        Live suggestion
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-6 backdrop-blur-xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
                    <p className="text-xs uppercase tracking-wider text-foreground/60 font-semibold mb-4">Wellness Score</p>
                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-5xl font-bold gradient-text">92</span>
                      <span className="text-sm text-blue-600 font-medium pb-1">+7 this week</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-xs text-foreground/50">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                        <div
                          key={day}
                          className="h-14 rounded-lg bg-gradient-to-t from-blue-600/25 via-blue-600/15 to-transparent border border-[hsl(var(--glass-border))] flex items-end justify-center pb-2 hover:from-blue-600/35 transition-all duration-300"
                        >
                          <span>{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Features;
