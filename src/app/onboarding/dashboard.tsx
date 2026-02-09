"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Target, TrendingUp, GraduationCap, DollarSign, BrainCircuit, Sparkles, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonClassName } from "@/models/constants";

const Dashboard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [knowledgeLevel, setKnowledgeLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useRouter();

  const totalSteps = 5;

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error("You must be logged in to complete onboarding");
      navigate.push("/auth");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          primaryGoal,
          riskLevel,
          knowledgeLevel,
          interests,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      toast.success("Welcome to XPENSIFY! 🎉");
      navigate.push("/dashboard");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const interestOptions = [
    { id: 'budgeting', label: 'Budgeting', icon: '📊' },
    { id: 'investing', label: 'Investing', icon: '📈' },
    { id: 'saving', label: 'Saving', icon: '💰' },
    { id: 'taxes', label: 'Taxes', icon: '📝' },
    { id: 'crypto', label: 'Crypto', icon: '🪙' },
    { id: 'real-estate', label: 'Real Estate', icon: '🏠' },
  ];

  const currencyOptions = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background pattern-grid py-12">
      {/* Background elements to match auth page */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 artistic-bg opacity-50" />
        <div className="absolute inset-0 artistic-overlay animate-gradient" />
      </div>

      <Card className="w-full max-w-2xl p-8 glass-card animate-fade-in relative z-10 mx-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground/90 tracking-tight">
                Step {step}
              </h2>
              <p className="text-foreground/60 text-sm mt-1">
                {step === 1 && "Start with your target"}
                {step === 2 && "Understand your appetite"}
                {step === 3 && "Assess your foundation"}
                {step === 4 && "Choose your focus"}
                {step === 5 && "Select your region"}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-blue-500 mb-2">{Math.round((step / totalSteps) * 100)}% Complete</span>
              <div className="w-32 bg-foreground/5 h-2 rounded-full overflow-hidden border border-foreground/10">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: GOAL */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground/90 leading-tight">
                What's your primary<br />financial goal?
              </h3>
            </div>
            <div className="space-y-3">
              <Label htmlFor="goal" className="text-sm font-medium text-foreground/70">
                Define your first milestone
              </Label>
              <div className="relative group">
                <Input
                  id="goal"
                  type="text"
                  placeholder="e.g., Save ₹1,00,000 for emergency fund"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="glass-input h-14 text-lg pl-4 pr-12 transition-all focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/40 group-focus-within:text-blue-500 transition-colors">
                  <Sparkles size={20} />
                </div>
              </div>
              <p className="text-xs text-foreground/40 italic">
                Our AI coaches will build a personalized path around this goal.
              </p>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!primaryGoal.trim()}
              className="w-full btn-premium h-14 text-lg font-semibold shadow-[var(--shadow-glow)] group"
            >
              Continue
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* STEP 2: RISK */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground/90 leading-tight">
                What's your risk<br />tolerance?
              </h3>
            </div>
            <div className="grid gap-3">
              {[
                { id: 'conservative', title: 'Conservative', desc: 'Prioritize safety and stability' },
                { id: 'moderate', title: 'Moderate', desc: 'Balanced growth with controlled risk' },
                { id: 'aggressive', title: 'Aggressive', desc: 'Maximum potential for long-term wealth' },
              ].map((option) => (
                <div
                  key={option.id}
                  onClick={() => setRiskLevel(option.id as any)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${riskLevel === option.id
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                      : 'bg-foreground/[0.02] border-foreground/5 hover:border-foreground/20'
                    }`}
                >
                  <div className="flex-1">
                    <div className="font-bold text-foreground/90">{option.title}</div>
                    <div className="text-sm text-foreground/50">{option.desc}</div>
                  </div>
                  {riskLevel === option.id && (
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white scale-110 animate-in zoom-in-50 duration-300">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setStep(1)} variant="ghost" className="h-14 flex-1 hover:bg-foreground/5 text-foreground/60 transition-colors">
                <ChevronLeft className="mr-2" size={20} /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="h-14 flex-[2] btn-premium font-semibold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: KNOWLEDGE */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
                <BrainCircuit size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground/90 leading-tight">
                Your financial<br />foundation?
              </h3>
            </div>
            <div className="grid gap-3">
              {[
                { id: 'beginner', title: 'Beginner', desc: 'Just starting my financial journey' },
                { id: 'intermediate', title: 'Intermediate', desc: 'Know the basics, looking to grow' },
                { id: 'advanced', title: 'Advanced', desc: 'Experienced in managing wealth' },
              ].map((option) => (
                <div
                  key={option.id}
                  onClick={() => setKnowledgeLevel(option.id as any)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${knowledgeLevel === option.id
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                      : 'bg-foreground/[0.02] border-foreground/5 hover:border-foreground/20'
                    }`}
                >
                  <div className="flex-1">
                    <div className="font-bold text-foreground/90">{option.title}</div>
                    <div className="text-sm text-foreground/50">{option.desc}</div>
                  </div>
                  {knowledgeLevel === option.id && (
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white scale-110 animate-in zoom-in-50 duration-300">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setStep(2)} variant="ghost" className="h-14 flex-1 hover:bg-foreground/5 text-foreground/60">
                <ChevronLeft className="mr-2" size={20} /> Back
              </Button>
              <Button onClick={() => setStep(4)} className="h-14 flex-[2] btn-premium font-semibold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: INTERESTS */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
                <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground/90 leading-tight">
                What interests<br />you most?
              </h3>
            </div>
            <p className="text-sm text-foreground/60 -mt-2">Select topics to personalize your learning feeds.</p>
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleInterest(option.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${interests.includes(option.id)
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.05)]'
                      : 'bg-foreground/[0.02] border-foreground/5 hover:border-foreground/20'
                    }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div className={`font-semibold text-sm ${interests.includes(option.id) ? 'text-blue-500' : 'text-foreground/70'}`}>
                    {option.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setStep(3)} variant="ghost" className="h-14 flex-1 hover:bg-foreground/5 text-foreground/60">
                <ChevronLeft className="mr-2" size={20} /> Back
              </Button>
              <Button onClick={() => setStep(5)} className="h-14 flex-[2] btn-premium font-semibold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: CURRENCY */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-inner">
                <DollarSign size={28} />
              </div>
              <h3 className="text-2xl font-bold text-foreground/90 leading-tight">
                Set your primary<br />currency?
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {currencyOptions.map((option) => (
                <div
                  key={option.code}
                  onClick={() => setCurrency(option.code)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${currency === option.code
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                      : 'bg-foreground/[0.02] border-foreground/5 hover:border-foreground/20'
                    }`}
                >
                  <span className={`text-3xl font-bold ${currency === option.code ? 'text-blue-500' : 'text-foreground/30'}`}>{option.symbol}</span>
                  <div className="text-center">
                    <div className="font-bold text-foreground/90">{option.code}</div>
                    <div className="text-[10px] uppercase tracking-wider text-foreground/40">{option.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setStep(4)} variant="ghost" className="h-14 flex-1 hover:bg-foreground/5 text-foreground/60">
                <ChevronLeft className="mr-2" size={20} /> Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="h-14 flex-[2] btn-premium font-semibold"
              >
                {loading && <Sparkles className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Completing Setup..." : "Launch XPENSIFY"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
