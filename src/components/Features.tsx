"use client";
import { Target, Brain, BookOpen, TrendingUp, MessageCircle, BarChart3, Shield } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  {
    icon: Shield,
    title: "Privacy & Trust",
    description: "AES-256 encryption, full data control, zero third-party sharing. Your money, your rules.",
  },
];

const featureHighlights = [
  { label: "Financial Goals Reached", value: "52M+" },
  { label: "Users Supported", value: "110K+" },
  { label: "Coach Interactions / day", value: "900K" },
];

const Features = () => {
  return (
    <section id="features" className="relative overflow-hidden py-28 px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(173,80%,40%,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsla(221,69%,33%,0.12),transparent_60%)]" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,transparent,hsla(0,0%,100%,0.05)_1px,transparent_1px),linear-gradient(to_bottom,transparent,hsla(0,0%,100%,0.05)_1px,transparent_1px)] bg-[size:18px_18px]" />
        </div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Badge className="mb-4 bg-white/10 text-sm font-medium text-green/80 backdrop-blur-sm">
            The XPENSIFY Advantage
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-green/90">
            Everything You Need to
            <span className="block gradient-text mt-3">Master Your Money</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-green/70">
            Seven intelligent modules, beautifully integrated to turn financial anxiety into confident progress.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-16">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border border-white/10 bg-card/70 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_60px_rgba(22,172,186,0.2)]"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <CardHeader className="relative pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gradient-accent)] shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="block gradient-text mt-3" />
                </div>
                <CardTitle className="mt-4 text-xl font-semibold text-green/90">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-base text-green/65">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-2xl p-10 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <Badge className="bg-primary/20 text-primary-foreground/90">
                Real-time XPENSIFY Dashboard
              </Badge>
              <h3 className="text-3xl font-semibold text-green/90">
                Insights that feel like magic, yet rooted in data you can trust.
              </h3>
              <p className="text-green/70">
                From the first milestone to long-term wealth strategies, XPENSIFY connects your progress into one intuitive
                workspace. Visualize the path forward with AI forecasts, momentum analytics, and a compassionate coach.
              </p>
              <div className="flex flex-wrap gap-6">
                {featureHighlights.map((highlight) => (
                  <div key={highlight.label}>
                    <p className="text-2xl font-semibold text-primary">
                      {highlight.value}
                    </p>
                    <p className="text-sm uppercase tracking-widest text-green/60">
                      {highlight.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative w-full overflow-hidden rounded-3xl border border-primary/10 bg-card/80 p-6 shadow-[0_40px_80px_rgba(22,172,186,0.15)]">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 opacity-80" />
              <div className="relative space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                  <div className="flex items-center justify-between text-sm text-green/70">
                    <span>Goal Progress</span>
                    <span>82%</span>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                    <div className="h-full w-[82%] rounded-full bg-[var(--gradient-accent)]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-green/60">AI Coach</p>
                      <p className="mt-2 text-lg font-semibold text-green/90">“Allocate 15% to your emergency fund.”</p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary-foreground/90">
                      Live suggestion
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                  <p className="text-sm uppercase tracking-wide text-green/60">Wellness Score</p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-4xl font-semibold text-primary">92</span>
                    <span className="text-sm text-green/60">+7 this week</span>
                  </div>
                  <div className="mt-6 grid grid-cols-6 gap-2 text-xs text-green/50">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="h-12 rounded-md bg-gradient-to-t from-primary/20 via-primary/10 to-transparent"
                      >
                        <span className="flex h-full items-end justify-center pb-1">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
