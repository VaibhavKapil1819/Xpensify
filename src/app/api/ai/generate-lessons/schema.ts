import { z } from "zod";

export const articleSchema = z.object({
    article: z.object({
        title: z.string(),
        content: z.string(),
        keyTakeaways: z.array(z.string()),
        quiz: z.object({
            question: z.string(),
            options: z
                .array(z.string())
                .length(4, "Exactly 4 options are required"),
            correctAnswer: z
                .number()
                .int()
                .nonnegative()
                .refine((val) => val >= 0 && val < 4, {
                    message: "correctAnswer must be between 0 and 3",
                }),
        }),
    }),
});
