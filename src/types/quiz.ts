// types/quiz.ts
export interface QuizSubmitRequest {
  lessonId: string;
  lessonTitle: string;
  category: string;
  level: string;
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
}

export interface QuizSubmitResponse {
  success: boolean;
  isCorrect: boolean;
  score: number;
  feedback: string;
  explanation: string;
  encouragement: string;
  progress: {
    id: string;
    completed: boolean;
    score: number;
  };
  streak?: {
    totalLessonsCompleted: number;
    currentStreak: number;
  };
}

export interface QuizApiError {
  error: string;
  message?: string;
  details?: any;
}



