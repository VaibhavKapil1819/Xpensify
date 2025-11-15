"use client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    title: "Set Your Goals",
    description: "Tell us your financial dreams. Our AI breaks them into achievable milestones.",
    detail: "Define monthly, quarterly, and long-range ambitions with confidence.",
  },
  {
    number: "02",
    title: "Get Personalized Coaching",
    description: "Receive daily insights, explanations, and nudges tailored to your journey.",
    detail: "Chat naturally with an AI coach fluent in finance and your own habits.",
  },
  {
    number: "03",
    title: "Learn & Grow",
    description: "Master financial concepts through gamified lessons and interactive quizzes.",
    detail: "Earn XP, unlock badges, and build knowledge muscle memory the fun way.",
  },
  {
    number: "04",
    title: "Track Your Progress",
    description: "Watch your financial wellness score improve as you hit milestones.",
    detail: "Visual dashboards and proactive alerts keep you aligned without overwhelm.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-28 px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(173,80%,40%,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,hsla(221,69%,33%,0.15))]" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,transparent,hsla(0,0%,100%,0.04)_1px,transparent_1px)] bg-[size:20px_100%]" />
        </div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-primary/20 text-primary-foreground/90">
            How XPENSIFY Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-green/90">
            Your Path to <span className="gradient-text">Financial Freedom</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-green/70">
            Simple, powerful, and compassionate. XPENSIFY removes friction so you can focus on momentum.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute left-[30px] top-0 hidden h-full w-px bg-gradient-to-b from-primary via-primary/50 to-transparent md:block" />
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex flex-col gap-6 md:flex-row md:items-start"
              >
                <div className="relative flex w-full items-center gap-4 md:w-auto md:flex-col md:items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gradient-accent)] text-gray-800 text-lg font-semibold shadow-[var(--shadow-glow)] md:h-16 md:w-16">
                    {step.number}
                  </span>


                  <span className="hidden h-full w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent md:block" />
                </div>
                <div className="flex-1 rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl transition duration-300 hover:border-primary/40 hover:shadow-[0_25px_60px_rgba(22,172,186,0.18)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-green/80">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <h3 className="text-2xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="mt-3 text-base text-green/65">{step.description}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-green/65 backdrop-blur-lg md:max-w-xs">
                      {step.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-3xl border border-primary/20 bg-card/70 p-10 text-center shadow-[0_35px_80px_rgba(22,172,186,0.22)] backdrop-blur-2xl">
          <h3 className="text-3xl font-semibold text-green/90">Ready to Take Control?</h3>
          <p className="mt-3 text-green/65">
            Join thousands already mastering their finances with a coach that speaks your language.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-left">
            {[
              { label: "Active Users", value: "110K+" },
              { label: "Goals Achieved", value: "$52M+" },
              { label: "Average Rating", value: "4.9★" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-semibold text-primary">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-green/60">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[var(--gradient-accent)] text-[hsl(var(--secondary-foreground))] shadow-[var(--shadow-glow)] hover:opacity-90">
              Start for Free
            </Button>
            <Button size="lg" variant="outline" className="glass-input backdrop-blur-md text-green/80 hover:text-green">
              Talk to an Expert
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
