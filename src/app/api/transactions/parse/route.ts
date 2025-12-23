import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { parseTransactionsSchema } from "./schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { file, fileName, fileType } = await req.json();

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const systemPrompt = `You are an expert financial assistant. Extract all transaction details from the provided file (image or text).
    Support multiple transactions if present.
    For each transaction, extract:
    - amount: a positive number
    - type: 'income' or 'expense'
    - category: Choose the most appropriate from: 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Health', 'Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Refund', 'Other'
    - description: A short description of the transaction
    - date: The date in YYYY-MM-DD format. If year is missing, use current year ${new Date().getFullYear()}.

    CRITICAL: Ensure the categories match the provided list exactly.
    Return the results in the specified JSON format.`;

        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: parseTransactionsSchema,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this file: ${fileName}`,
                        },
                        {
                            type: "image",
                            image: file, // Base64 string from SmartUpload
                        },
                    ],
                },
            ],
        });
        console.log("object2----->", object);
        return NextResponse.json({
            success: true,
            transactions: object.transactions,
        });
    } catch (error: any) {
        console.error("Error parsing transactions:", error);
        return NextResponse.json(
            { error: "Failed to parse transactions", message: error.message },
            { status: 500 }
        );
    }
}
