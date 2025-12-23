import { z } from "zod";

export const analysisSchema = z.object({
    summary: z.string(),
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
    savingsOpportunities: z.array(z.string()),
});

export type SpendingAnalysis = z.infer<typeof analysisSchema>;
