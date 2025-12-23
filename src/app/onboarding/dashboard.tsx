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
import { Target, TrendingUp, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonClassName } from "@/models/constants";

const Dashboard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [riskLevel, setRiskLevel] = useState<
    "conservative" | "moderate" | "aggressive"
  >("moderate");
  const [learningPreference, setLearningPreference] = useState<
    "visual" | "text" | "interactive" | "mixed"
  >("mixed");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useRouter();


  const handleComplete = async () => {
    if (!user) {
      toast.error("You must be logged in to complete onboarding");
      navigate.push("/auth");
      return;
    }

    setLoading(true);
    try {
      // Call the onboarding completion API
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          primaryGoal,
          riskLevel,
          learningPreference,
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

  return (
    <div className="min-h-screen flex items-center justify-center mac-bg p-4">
      <Card className="w-full max-w-2xl p-8 mac-card animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold mac-text-primary">
              Let's Get Started
            </h2>
            <span className="text-sm mac-text-secondary">Step {step} of 3</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-semibold mac-text-primary">
                What's your primary financial goal?
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal" className="mac-text-primary">
                Tell us what you want to achieve
              </Label>
              <Input
                id="goal"
                type="text"
                placeholder="e.g., Save ₹1,00,000 for emergency fund"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                className="text-lg p-6"
              />
              <p className="text-sm mac-text-secondary">
                Don't worry, you can add more goals later!
              </p>
            </div>
            <Button
              onClick={() => setStep(2)}
              variant="default"
              size="lg"
              disabled={!primaryGoal.trim()}
              className={`w-full ${buttonClassName}`}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-semibold mac-text-primary">
                What's your risk tolerance?
              </h3>
            </div>
            <RadioGroup
              value={riskLevel}
              onValueChange={(value: any) => setRiskLevel(value)}
            >
              <div className="space-y-3">
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="conservative" id="conservative" />
                    <Label
                      htmlFor="conservative"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-semibold mac-text-primary">
                        Conservative
                      </div>
                      <p className="text-sm mac-text-secondary">
                        I prefer safety over higher returns
                      </p>
                    </Label>
                  </div>
                </Card>
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                      <div className="font-semibold mac-text-primary">
                        Moderate
                      </div>
                      <p className="text-sm mac-text-secondary">
                        I want balanced growth with some risk
                      </p>
                    </Label>
                  </div>
                </Card>
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="aggressive" id="aggressive" />
                    <Label
                      htmlFor="aggressive"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-semibold mac-text-primary">
                        Aggressive
                      </div>
                      <p className="text-sm mac-text-secondary">
                        I'm comfortable with high risk for potential high
                        returns
                      </p>
                    </Label>
                  </div>
                </Card>
              </div>
            </RadioGroup>
            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                size="lg"
                className={`flex-1 ${buttonClassName}`}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                variant="default"
                size="lg"
                className={`flex-1 ${buttonClassName}`}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-semibold mac-text-primary">
                How do you prefer to learn?
              </h3>
            </div>
            <RadioGroup
              value={learningPreference}
              onValueChange={(value: any) => setLearningPreference(value)}
            >
              <div className="space-y-3">
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="visual" id="visual" />
                    <Label htmlFor="visual" className="flex-1 cursor-pointer">
                      <div className="font-semibold mac-text-primary">
                        Visual
                      </div>
                      <p className="text-sm mac-text-secondary">
                        Charts, graphs, and infographics
                      </p>
                    </Label>
                  </div>
                </Card>
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="flex-1 cursor-pointer">
                      <div className="font-semibold mac-text-primary">
                        Text-based
                      </div>
                      <p className="text-sm mac-text-secondary">
                        Articles and written explanations
                      </p>
                    </Label>
                  </div>
                </Card>
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="interactive" id="interactive" />
                    <Label
                      htmlFor="interactive"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-semibold mac-text-primary">
                        Interactive
                      </div>
                      <p className="text-sm mac-text-secondary">
                        Quizzes and hands-on exercises
                      </p>
                    </Label>
                  </div>
                </Card>
                <Card className="p-4 mac-card cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="mixed" id="mixed" />
                    <Label htmlFor="mixed" className="flex-1 cursor-pointer">
                      <div className="font-semibold mac-text-primary">
                        Mixed
                      </div>
                      <p className="text-sm mac-text-secondary">
                        A combination of everything
                      </p>
                    </Label>
                  </div>
                </Card>
              </div>
            </RadioGroup>
            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                size="lg"
                className={`flex-1 ${buttonClassName}`}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                variant="default"
                size="lg"
                className={`flex-1 ${buttonClassName}`}
                disabled={loading}
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
