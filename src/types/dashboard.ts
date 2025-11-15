// types/dashboard.ts
import { RiskLevel, LearningPreference, GoalStatus } from '@prisma/client';

export interface DashboardProfile {
  id: string;
  email: string;
  full_name: string | null;
  primary_goal: string | null;
  risk_level: RiskLevel | null;
  learning_preference: LearningPreference | null;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number | null;
  current_amount: number;
  target_date: Date | null;
  category: string | null;
  status: GoalStatus;
  ai_completion_probability: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
  total_lessons_completed: number;
  badges: any[];
  created_at: Date;
  updated_at: Date;
}

export interface DashboardData {
  profile: DashboardProfile;
  goals: DashboardGoal[];
  streak: DashboardStreak | null;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

