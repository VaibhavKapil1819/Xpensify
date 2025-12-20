import { z } from "zod";

export const transactionSchema = z.object({
    amount: z.number(),
    type: z.enum(['income', 'expense']),
    category: z.string(),
    description: z.string().optional(),
    date: z.string(), // YYYY-MM-DD
});

export const parseTransactionsSchema = z.object({
    transactions: z.array(transactionSchema),
});

export type ParsedTransactions = z.infer<typeof parseTransactionsSchema>;
