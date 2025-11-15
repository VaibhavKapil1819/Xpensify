import { z } from "zod";

export const financialNewsSchema = z.array(
    z.object({
        title: z.string().max(60),
        description: z.string().max(120),
        category: z.enum([
            "Markets",
            "Savings",
            "Investing",
            "Crypto",
            "Economy",
            "Personal Finance"
        ]),
        content: z.string(),
    })
);
