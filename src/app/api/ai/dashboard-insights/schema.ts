import { z } from "zod";

export const insightsSchema = z.object({
    todaysFocus: z.string(),
    motivationalMessage: z.string(),
    financialWellnessScore: z.number().min(0).max(100),
    nextMilestone: z.string(),
});


export type DashboardInsights = z.infer<typeof insightsSchema>;
