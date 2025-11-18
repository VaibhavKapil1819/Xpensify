// types/goals.ts
import { GoalStatus } from '@prisma/client';

export interface Goal {
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

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  target_amount: number | null;
  completed: boolean;
  due_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  category?: string;
  currency?: string;
}

export interface GoalsResponse {
  success: boolean;
  goals: Goal[];
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    currency: string;
  };
}

export interface MilestonesResponse {
  success: boolean;
  milestones: Milestone[];
}

export interface CreateGoalResponse {
  success: boolean;
  goal: Goal;
  message: string;
}




