// types/learning.ts

export interface LearningProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  lesson_title: string;
  category: string | null;
  completed: boolean;
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_lessons_completed: number;
  badges: any;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types

export interface SaveProgressRequest {
  lessonId: string;
  lessonTitle: string;
  category: string;
  completed: boolean;
  score: number;
  isCorrect: boolean;
}

export interface SaveProgressResponse {
  success: boolean;
  progress: LearningProgress;
  streak: {
    current_streak: number;
    longest_streak: number;
    total_lessons_completed: number;
  };
  message: string;
}

export interface GetProgressResponse {
  success: boolean;
  progress: LearningProgress[];
  count: number;
}

export interface GetStreakResponse {
  success: boolean;
  streak: UserStreak | null;
}

export interface ApiError {
  error: string;
  details?: string;
}



