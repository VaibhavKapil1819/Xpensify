// types/learning-coach.ts

export interface UserLearningPreferences {
    id: string;
    user_id: string;
    knowledge_level: 'beginner' | 'intermediate' | 'advanced';
    learning_style: 'simple' | 'detailed' | 'examples-based' | 'story-based' | 'fast-track' | 'balanced';
    weak_areas: string[];
    preferred_topics: string[];
    created_at: string;
    updated_at: string;
}

export interface LearningConversation {
    id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        lesson_id?: string;
        quiz_data?: any;
        topic?: string;
    };
    created_at: string;
}

export interface TopicRecommendation {
    id: string;
    user_id: string;
    topic_id: string;
    topic_name: string;
    reason: string;
    priority: number;
    completed: boolean;
    created_at: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface CoachResponse {
    message: string;
    action?: 'quiz' | 'progress_update' | 'recommendation' | 'continue';
    data?: any;
}

export interface TopicSuggestion {
    id: string;
    name: string;
    description: string;
    icon: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// API Request/Response Types

export interface SavePreferencesRequest {
    knowledge_level?: 'beginner' | 'intermediate' | 'advanced';
    learning_style?: 'simple' | 'detailed' | 'examples-based' | 'story-based' | 'fast-track' | 'balanced';
    weak_areas?: string[];
    preferred_topics?: string[];
}

export interface SavePreferencesResponse {
    success: boolean;
    preferences: UserLearningPreferences;
}

export interface GetConversationsResponse {
    success: boolean;
    conversations: LearningConversation[];
    count: number;
}

export interface SaveConversationRequest {
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
}

export interface SaveConversationResponse {
    success: boolean;
    conversation: LearningConversation;
}

export interface GetRecommendationsResponse {
    success: boolean;
    recommendations: TopicRecommendation[];
    count: number;
}

export interface GenerateRecommendationsRequest {
    based_on_progress?: boolean;
}

export interface GenerateRecommendationsResponse {
    success: boolean;
    recommendations: TopicRecommendation[];
    message: string;
}

export interface LearningCoachRequest {
    message: string;
    include_history?: boolean;
}

export interface ApiError {
    error: string;
    details?: string;
}
