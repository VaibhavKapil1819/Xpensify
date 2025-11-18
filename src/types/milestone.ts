// types/milestone.ts
export interface Milestone {
    id: string;
    goal_id: string;
    title: string;
    description: string | null;
    target_amount: number | null;
    completed: boolean;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    goal?: {
        id: string;
        title: string;
        user_id?: string;
    } | null;
}

export interface MilestonesResponse {
    success: boolean;
    milestones: Milestone[];
    count: number;
}

export interface MilestoneToggleResponse {
    success: boolean;
    milestone: Milestone;
    message: string;
}

export interface ApiError {
    error: string;
    details?: string;
}

