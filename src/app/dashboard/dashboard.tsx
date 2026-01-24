"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import {
  Target,
  Plus,
  MessageCircle,
  Activity,
  Zap,
  Award,
  Flame,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DashboardNav from "@/components/DashboardNav";
import { DashboardSkeleton } from "@/components/DashboardSkeletons";
import FinancialNews from "@/components/FinancialNews";

import type {
  DashboardProfile,
  DashboardGoal,
  DashboardStreak,
} from "@/types/dashboard";

import { experimental_useObject as useObject } from "@ai-sdk/react";

import { insightsSchema } from "../api/ai/dashboard-insights/schema";
import { progressClassName } from "@/models/constants";

// Cache configuration

const DASHBOARD_CACHE_KEY = "dashboard_cache";

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CachedDashboardData {
  timestamp: number;

  profile: DashboardProfile;

  goals: DashboardGoal[];

  streak: DashboardStreak;

  insights: InsightsType;
}


const getCachedDashboardData = (): CachedDashboardData | null => {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY);

    if (!cached) return null;

    const parsedCache: CachedDashboardData = JSON.parse(cached);

    // Validate cache structure

    if (
      !parsedCache.timestamp ||
      !parsedCache.profile ||
      !parsedCache.insights
    ) {
      sessionStorage.removeItem(DASHBOARD_CACHE_KEY);

      return null;
    }

    // Check if cache is expired (older than 30 minutes)

    const now = Date.now();

    if (now - parsedCache.timestamp > CACHE_DURATION_MS) {
      sessionStorage.removeItem(DASHBOARD_CACHE_KEY);

      return null;
    }

    return parsedCache;
  } catch {
    // Remove corrupted cache

    sessionStorage.removeItem(DASHBOARD_CACHE_KEY);

    return null;
  }
};

/**

 * Stores dashboard data in sessionStorage with current timestamp

 */

const setCachedDashboardData = (
  data: Omit<CachedDashboardData, "timestamp">
): void => {
  if (typeof window === "undefined") return;

  try {
    const cacheData: CachedDashboardData = {
      ...data,

      timestamp: Date.now(),
    };

    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Silently fail if sessionStorage is unavailable or quota exceeded
  }
};

interface InsightsType {
  todaysFocus: string;

  motivationalMessage: string;

  financialWellnessScore: number;

  nextMilestone: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const navigate = useRouter();

  const [profile, setProfile] = useState<DashboardProfile | null>(null);

  const [goals, setGoals] = useState<DashboardGoal[]>([]);

  const [streak, setStreak] = useState<DashboardStreak | null>(null);

  const [insights, setInsights] = useState<InsightsType | null>(null);

  const [loading, setLoading] = useState(true);
  const [focusExpanded, setFocusExpanded] = useState(false);

  // Track whether we need to cache data (true when fetching fresh data)

  const pendingCacheRef = useRef(false);

  const { submit, object, isLoading, error, stop } = useObject({
    api: "/api/ai/dashboard-insights",

    schema: insightsSchema,
  });

  // Check cache first, only fetch from API if cache is empty/expired

  useEffect(() => {
    if (user) {
      const cachedData = getCachedDashboardData();

      if (cachedData) {
        // Valid cache exists - use cached data

        setProfile(cachedData.profile);

        setGoals(cachedData.goals);

        setStreak(cachedData.streak);

        setInsights(cachedData.insights);

        setLoading(false);
      } else {
        // No valid cache - fetch fresh data from API

        pendingCacheRef.current = true;

        loadDashboardData();
      }
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Call dashboard API endpoint

      const response = await fetch("/api/dashboard", {
        method: "GET",

        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to load dashboard data");
      }

      const { data } = await response.json();

      setProfile(data.profile);

      setGoals(data.goals || []);

      setStreak(data.streak);

      submit({
        profile: data.profile,

        goals: data.goals,

        streak: data.streak,
      });
    } catch (error: any) {
      console.error("Error loading dashboard:", error);

      toast.error(error.message || "Failed to load dashboard data");

      // If unauthorized, redirect to login

      if (error.message === "Unauthorized") {
        navigate.push("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update insights when AI response streams in

  useEffect(() => {
    if (object) {
      setInsights(object as InsightsType);
    }
  }, [object]);

  // Cache data when AI response is complete (only for fresh fetches)

  useEffect(() => {
    if (
      pendingCacheRef.current &&
      !isLoading &&
      profile &&
      streak &&
      insights
    ) {
      setCachedDashboardData({
        profile,

        goals,

        streak,

        insights,
      });

      pendingCacheRef.current = false;
    }
  }, [isLoading, profile, goals, streak, insights]);

  if (loading || !insights) {
    return <DashboardSkeleton />;
  }

  const wellnessScore = insights?.financialWellnessScore || 50;

  return (
    <>
      {insights && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
          {/* Animated background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/10 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200/10 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse" />
          </div>

          <DashboardNav />

          <main className="relative z-10 container mx-auto px-4 py-8 pt-24">
            {/* Hero Welcome Section */}
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Welcome Back
                  </span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-900 via-blue-600 to-blue-700 dark:from-blue-100 dark:via-blue-300 dark:to-blue-200 bg-clip-text text-transparent">
                  Hello, {profile?.full_name?.split(" ")[0] || "there"}!
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
                  {insights?.motivationalMessage ||
                    "Let's continue building your financial future together."}
                </p>
              </div>
            </div>

            {/* Key Metrics Grid - Premium Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-top-6 duration-700">
              {/* Wellness Score Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-600">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Wellness Score
                    </h3>
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {wellnessScore}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      out of 100
                    </div>
                    <Progress
                      value={wellnessScore}
                      className="h-2 bg-slate-200 dark:bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Learning Streak Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-600">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Learning Streak
                    </h3>
                    <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                      {streak?.current_streak || 0}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Days • Best: {streak?.longest_streak || 0} days
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Goals Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-green-400 dark:hover:border-green-600">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Active Goals
                    </h3>
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {goals.length}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Goals in progress
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Focus Card */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-600">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Focus
                    </h3>
                    <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed cursor-pointer transition-all duration-300",
                              !focusExpanded && "line-clamp-3"
                            )}
                            onClick={() => setFocusExpanded(!focusExpanded)}
                          >
                            {insights?.todaysFocus ||
                              "Set your first financial goal to get started!"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-3 text-sm">
                          {focusExpanded ? "Click to collapse" : "Click to expand / Hover for detail"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Today's Priority
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left duration-700">
                {/* Active Goals Section */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-700 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur border shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          Your Goals
                        </h2>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                        size="sm"
                        onClick={() => navigate.push("/goals")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Goal
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    {goals.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <Target className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium mb-4">
                          No active goals yet
                        </p>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          onClick={() => navigate.push("/goals")}
                        >
                          Create Your First Goal
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {goals.slice(0, 5).map((goal, index) => {
                          const targetAmount = Number(goal.target_amount || 0);
                          const currentAmount = Number(goal.current_amount);
                          const progress =
                            targetAmount > 0
                              ? (currentAmount / targetAmount) * 100
                              : 0;

                          return (
                            <div
                              key={goal.id}
                              className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer"
                              onClick={() => navigate.push("/goals")}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-blue-600/0 rounded-xl transition-all duration-300" />

                              <div className="relative space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {goal.title}
                                      </h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1">
                                        {goal.category}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                    {progress.toFixed(0)}%
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <Progress
                                    value={progress}
                                    className="h-2.5 bg-slate-200 dark:bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-blue-500 rounded-full"
                                  />
                                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>
                                      {profile?.currency || "USD"}{" "}
                                      {currentAmount.toLocaleString()}
                                    </span>
                                    <span className="font-medium">
                                      / {targetAmount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {goals.length > 5 && (
                          <div className="pt-2">
                            <Button
                              variant="ghost"
                              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
                              onClick={() => navigate.push("/goals")}
                            >
                              View All Goals ({goals.length})
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Next Milestone Card */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-700 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur border shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-600/10 dark:bg-amber-600/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Next Milestone
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
                          🎯{" "}
                          {insights?.nextMilestone ||
                            "Complete your onboarding to unlock personalized milestones!"}
                        </p>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full group"
                          onClick={() => navigate.push("/milestones")}
                        >
                          View All Milestones
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Financial News */}
              <div className="lg:col-span-1 animate-in fade-in slide-in-from-right duration-700">
                <div className="sticky top-24">
                  <FinancialNews />
                </div>
              </div>
            </div>
          </main>

          {/* Floating Action Button */}
          <div className="fixed bottom-6 right-6 z-40 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
            <Button
              size="lg"
              className="relative rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-2xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110"
              onClick={() => navigate.push("/chat")}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Finley
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
