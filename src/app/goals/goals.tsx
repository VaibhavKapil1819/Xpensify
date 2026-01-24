"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  Sparkles,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  PiggyBank,
  TrendingUpIcon,
  CreditCard,
  Shield,
  GraduationCap,
  Home,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/DashboardSkeletons";
import { buttonClassName, progressClassName } from "@/models/constants";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category: string;
  status: string;
  ai_completion_probability: number | null;
  created_at: string;
  user_id: string;
}

interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  currency: string;
  risk_level?: string;
  primary_goal?: string;
  learning_preference?: string;
}

export default function Goals() {
  const { user } = useAuth();
  const navigate = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [generatingMilestones, setGeneratingMilestones] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  const completedCount = milestones.filter((m) => m.completed).length;
  const totalCount = milestones.length;
  const completionRate =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
    category: "savings",
    currency: "USD",
  });

  useEffect(() => {
    if (user) {
      loadGoalsData();
    }
  }, [user]);

  // Get category icon and color
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "savings":
        return {
          icon: Target,
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-50",
        };
      case "investment":
        return {
          icon: TrendingUpIcon,
          color: "from-green-500 to-green-600",
          bgColor: "bg-green-50",
        };
      case "debt":
        return {
          icon: CreditCard,
          color: "from-red-500 to-red-600",
          bgColor: "bg-red-50",
        };
      case "emergency":
        return {
          icon: Shield,
          color: "from-orange-500 to-orange-600",
          bgColor: "bg-orange-50",
        };
      case "education":
        return {
          icon: GraduationCap,
          color: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-50",
        };
      case "retirement":
        return {
          icon: Home,
          color: "from-indigo-500 to-indigo-600",
          bgColor: "bg-indigo-50",
        };
      default:
        return {
          icon: Wallet,
          color: "from-gray-500 to-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  const loadGoalsData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load goals");
      }

      const data = await response.json();
      setProfile(data.profile);
      setGoals(data.goals || []);
    } catch (error: any) {
      console.error("Error loading goals:", error);
      toast.error(error.message || "Failed to load goals");

      if (error.message === "Unauthorized") {
        navigate.push("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async (goalId: string): Promise<Milestone[]> => {
    try {
      setLoadingMilestones(true);

      const response = await fetch(`/api/goals/${goalId}/milestones`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load milestones");
      }

      const data = await response.json();
      const loadedMilestones = data.milestones || [];

      setMilestones(loadedMilestones);
      console.log("Milestones set in state:", loadedMilestones.length);

      return loadedMilestones;
    } catch (error: any) {
      console.error("Error loading milestones:", error);
      toast.error(error.message || "Failed to load milestones");
      return [];
    } finally {
      setLoadingMilestones(false);
    }
  };

  /**
   * Generates AI milestones for a goal that has no milestones
   */
  const generateMilestonesForGoal = async (goal: Goal): Promise<void> => {
    setGeneratingMilestones(true);
    toast.info("Generating achievement roadmap for this goal...");

    try {
      // Step 1: Generate milestones with AI
      const aiResponse = await fetch("/api/ai/generate-milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          goal: {
            ...goal,
            currency: profile?.currency || "USD",
          },
          profile: profile || {},
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI generation failed:", errorText);
        throw new Error("Failed to generate AI milestones");
      }

      const aiData = await aiResponse.json();
      console.log("AI Response:", aiData);

      if (!aiData.milestones || !Array.isArray(aiData.milestones)) {
        console.error("Invalid AI response format:", aiData);
        throw new Error("Invalid AI response format");
      }

      // Step 2: Save milestones to database
      const milestonesToInsert = aiData.milestones.map((m: any) => ({
        goal_id: goal.id,
        title: m.title,
        description: `${m.description}\n\nAdvice: ${m.advice}`,
        target_amount: m.target_amount,
        due_date: m.due_date,
      }));

      console.log("Saving milestones:", milestonesToInsert);

      const saveMilestonesResponse = await fetch("/api/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ milestones: milestonesToInsert }),
      });

      if (!saveMilestonesResponse.ok) {
        const errorData = await saveMilestonesResponse.json();
        console.error("Failed to save milestones:", errorData);
        throw new Error(errorData.error || "Failed to save milestones");
      }

      const savedMilestonesData = await saveMilestonesResponse.json();
      console.log("Milestones saved:", savedMilestonesData);

      // Step 3: Update goal with AI completion probability (if not already set)
      if (!goal.ai_completion_probability && aiData.completion_probability) {
        console.log(
          "Updating goal with probability:",
          aiData.completion_probability,
        );

        const patchResponse = await fetch(`/api/goals/${goal.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ai_completion_probability: aiData.completion_probability,
          }),
        });

        if (!patchResponse.ok) {
          const patchError = await patchResponse.json();
          console.error("Failed to update goal probability:", patchError);
        } else {
          const patchData = await patchResponse.json();
          console.log("Goal updated:", patchData);

          // Update the selected goal state with new probability
          setSelectedGoal((prev) =>
            prev
              ? {
                  ...prev,
                  ai_completion_probability: aiData.completion_probability,
                }
              : null,
          );

          // Refresh goals list to show updated probability
          await loadGoalsData();
        }
      }

      toast.success("Achievement roadmap generated! 🎉");

      // Reload milestones to show the newly created ones
      await loadMilestones(goal.id);
    } catch (aiError: any) {
      console.error("AI generation error:", aiError);
      toast.error(aiError.message || "Failed to generate AI milestones");
    } finally {
      setGeneratingMilestones(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.target_amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingGoal(true);

    try {
      // Step 1: Create the goal
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description || undefined,
          target_amount: parseFloat(newGoal.target_amount),
          current_amount: parseFloat(newGoal.current_amount),
          target_date: newGoal.target_date || undefined,
          category: newGoal.category,
          currency: newGoal.currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create goal");
      }

      const createdGoal = data.goal;
      toast.success("Target set! Creating your achievement roadmap...");
      setShowCreateDialog(false);

      // Step 2: Generate milestones with AI using the reusable function
      await generateMilestonesForGoal(createdGoal);

      // Reload goals to get updated data
      await loadGoalsData();

      // Reset form
      setNewGoal({
        title: "",
        description: "",
        target_amount: "",
        current_amount: "0",
        target_date: "",
        category: "savings",
        currency: "USD",
      });

      // Auto-select the new goal
      setSelectedGoal(createdGoal);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      toast.error(error.message || "Failed to create goal");
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleSelectGoal = async (goal: Goal) => {
    setSelectedGoal(goal);
    const loadedMilestones = await loadMilestones(goal.id);

    // If no milestones exist for this goal, automatically generate them
    if (loadedMilestones.length === 0) {
      await generateMilestonesForGoal(goal);
    }
  };

  const toggleMilestone = async (milestone: Milestone) => {
    try {
      const response = await fetch(`/api/milestones/${milestone.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await response.json();
      console.log("Toggle response:", data);

      if (!response.ok) {
        console.error("Toggle failed:", data);
        throw new Error(data.error || "Failed to update milestone");
      }

      toast.success(data.message);

      // Update milestones state directly with the updated milestone from response
      if (data.milestone) {
        setMilestones((prevMilestones) =>
          prevMilestones.map((m) =>
            m.id === data.milestone.id ? data.milestone : m,
          ),
        );
      } else {
        // Fallback: Reload milestones if response doesn't include updated milestone
        if (selectedGoal) {
          await loadMilestones(selectedGoal.id);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update milestone");
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mac-text-primary mb-2">
              Financial Goals
            </h1>
            <p className="mac-text-secondary">
              Set targets, track progress, and achieve your financial dreams
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:text-white hover:shadow-lg transition-all"
                variant="default"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Set New Target
              </Button>
            </DialogTrigger>
            <DialogContent className="mac-card max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl mac-text-primary">
                  Set Your Financial Target
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">What do you want to achieve? *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Build $10,000 Emergency Fund"
                    value={newGoal.title}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">
                    Why is this important to you?
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., To have financial security for unexpected expenses"
                    value={newGoal.description}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="target_amount">Target Amount *</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      placeholder="10000"
                      value={newGoal.target_amount}
                      onChange={(e) =>
                        setNewGoal({
                          ...newGoal,
                          target_amount: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="current_amount">Current Amount</Label>
                    <Input
                      id="current_amount"
                      type="number"
                      placeholder="0"
                      value={newGoal.current_amount}
                      onChange={(e) =>
                        setNewGoal({
                          ...newGoal,
                          current_amount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newGoal.category}
                      onValueChange={(value) =>
                        setNewGoal({ ...newGoal, category: value })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="debt">Debt Repayment</SelectItem>
                        <SelectItem value="emergency">
                          Emergency Fund
                        </SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="target_date">Target Date</Label>
                    <Input
                      id="target_date"
                      type="date"
                      value={newGoal.target_date}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, target_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreateGoal}
                variant="default"
                className={`w-full ${buttonClassName}`}
                disabled={creatingGoal}
              >
                {creatingGoal ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Setting up your target...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Set Target & Generate Roadmap
                  </>
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {generatingMilestones && (
          <Card className="mac-card p-6 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <h3 className="font-semibold mac-text-primary">
                  Creating your achievement roadmap...
                </h3>
                <p className="text-sm mac-text-secondary">
                  AI is breaking down your target into actionable steps to help
                  you succeed
                </p>
              </div>
            </div>
          </Card>
        )}

        {goals.length === 0 ? (
          <Card className="mac-card p-16 text-center animate-fade-in">
            <div className="max-w-lg mx-auto">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Target className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold mb-3 mac-text-primary">
                Start Achieving Your Goals
              </h2>
              <p className="mac-text-secondary mb-8 text-base leading-relaxed">
                Set your financial targets and let our AI create a personalized
                roadmap to help you achieve them step by step.
              </p>
              <Button
                variant="default"
                size="lg"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Set Your First Target
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Goals List */}
            <div className="lg:col-span-1 space-y-4">
              {goals.map((goal) => {
                const targetAmount = Number(goal.target_amount || 0);
                const currentAmount = Number(goal.current_amount);
                const progress =
                  targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

                const {
                  icon: CategoryIcon,
                  color,
                  bgColor,
                } = getCategoryIcon(goal.category);

                return (
                  <Card
                    key={goal.id}
                    className={`mac-card p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedGoal?.id === goal.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => handleSelectGoal(goal)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}
                        >
                          <CategoryIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mac-text-primary truncate">
                              {goal.title}
                            </h3>
                            <p className="text-xs mac-text-secondary capitalize">
                              {goal.category}
                            </p>
                          </div>
                          {goal.ai_completion_probability && (
                            <div className="ml-2 shrink-0">
                              <div className="text-xs font-semibold text-blue-600">
                                {goal.ai_completion_probability}%
                              </div>
                              <div className="text-[10px] mac-text-tertiary text-right">
                                likely
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={progress}
                      className={`h-2 mb-2 ${progressClassName}`}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="mac-text-secondary text-xs">
                        {profile?.currency || "USD"}{" "}
                        {currentAmount.toLocaleString()}
                      </span>
                      <span className="font-semibold mac-text-primary text-xs">
                        {profile?.currency || "USD"}{" "}
                        {targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Goal Details */}
            <div className="lg:col-span-2">
              {selectedGoal ? (
                <div className="space-y-6 animate-fade-in">
                  <Card className="mac-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 mac-text-primary">
                          {selectedGoal.title}
                        </h2>
                        <p className="mac-text-secondary">
                          {selectedGoal.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {selectedGoal.ai_completion_probability && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-2">
                            <TrendingUp className="w-4 h-4" />
                            {selectedGoal.ai_completion_probability}% Success
                            Rate
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 mac-text-tertiary" />
                        <div>
                          <div className="text-xs mac-text-tertiary">
                            Target
                          </div>
                          <div className="font-semibold mac-text-primary">
                            {profile?.currency || "USD"}{" "}
                            {Number(
                              selectedGoal.target_amount || 0,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 mac-text-tertiary" />
                        <div>
                          <div className="text-xs mac-text-tertiary">
                            Current
                          </div>
                          <div className="font-semibold mac-text-primary">
                            {profile?.currency || "USD"}{" "}
                            {Number(
                              selectedGoal.current_amount,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {selectedGoal.target_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 mac-text-tertiary" />
                          <div>
                            <div className="text-xs mac-text-tertiary">Due</div>
                            <div className="font-semibold mac-text-primary">
                              {new Date(
                                selectedGoal.target_date,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Progress
                      value={completionRate}
                      className={`h-2 mb-2 ${progressClassName}`}
                    />
                  </Card>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 mac-text-primary">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Steps to Achieve Your Target
                    </h3>

                    {loadingMilestones ? (
                      <Card className="mac-card p-8 text-center">
                        <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
                      </Card>
                    ) : milestones.length === 0 ? (
                      <Card className="mac-card p-8 text-center">
                        <Clock className="w-12 h-12 mac-text-tertiary mx-auto mb-3" />
                        <p className="mac-text-secondary">No milestones yet</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                          <Card
                            key={milestone.id}
                            className={`mac-card p-4 transition-all ${
                              milestone.completed ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleMilestone(milestone)}
                                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  milestone.completed
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300 hover:border-blue-600"
                                }`}
                              >
                                {milestone.completed && (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                )}
                              </button>

                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h4
                                    className={`font-semibold mac-text-primary ${milestone.completed ? "line-through" : ""}`}
                                  >
                                    {index + 1}. {milestone.title}
                                  </h4>
                                  {milestone.target_amount && (
                                    <span className="text-sm font-medium text-blue-600">
                                      {profile?.currency || "USD"}{" "}
                                      {Number(
                                        milestone.target_amount,
                                      ).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm mac-text-secondary whitespace-pre-line">
                                  {milestone.description}
                                </p>
                                {milestone.due_date && (
                                  <div className="flex items-center gap-1 mt-2 text-xs mac-text-tertiary">
                                    <Calendar className="w-3 h-3" />
                                    Due:{" "}
                                    {new Date(
                                      milestone.due_date,
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="mac-card p-12 text-center h-[60vh] flex items-center justify-center animate-fade-in">
                  <div className="max-w-md">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-6">
                      <Target className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mac-text-primary mb-2">
                      Choose Your Target
                    </h3>
                    <p className="mac-text-secondary text-sm leading-relaxed">
                      Select a goal to view your progress, complete milestones,
                      and stay on track to achieve your target
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
