// Type definitions for course structure
export interface Course {
    id?: string;
    title: string;
    description: string;
    duration?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    modules: Module[];
    createdAt?: Date;
    completedAt?: Date;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: Lesson[];
    quiz?: Quiz;
    completed: boolean;
    locked: boolean;
}

export interface Lesson {
    id: string;
    title: string;
    content: string;
    order: number;
    examples?: Example[];
    keyTakeaways?: string[];
    resources?: Resource[];
    completed: boolean;
    duration?: string;
    note?: string; // User's personal notes for this lesson
}

export interface Example {
    title: string;
    description: string;
    scenario?: string;
}

export interface Resource {
    type: 'video' | 'article' | 'book' | 'tool';
    title: string;
    url?: string;
    description?: string;
}

export interface Quiz {
    id: string;
    moduleId: string;
    questions: Question[];
    passingScore: number;
    completed: boolean;
    score?: number;
}

export interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    userAnswer?: number;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    category?: string;
    mastered: boolean;
}

export interface CourseProgress {
    courseId: string;
    currentModuleId: string;
    currentLessonId: string;
    completedLessons: string[];
    completedModules: string[];
    completedQuizzes: string[];
    overallProgress: number; // 0-100
    timeSpent: number; // in minutes
    lastAccessedAt: Date;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
}
