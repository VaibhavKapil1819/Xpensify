import { z } from "zod";

export const MilestoneSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    target_amount: z.number().nonnegative(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD"),
    advice: z.string().min(1),
});

export const AiSdkResponseSchema = z.object({
    milestones: z.array(MilestoneSchema).min(1),
    completion_probability: z.number().min(0).max(100),
    overall_strategy: z.string().min(1),
    risk_assessment: z.string().min(1),
});

export type AiSdkResponse = z.infer<typeof AiSdkResponseSchema>;

 