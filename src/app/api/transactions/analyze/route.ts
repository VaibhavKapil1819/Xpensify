import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { analysisSchema } from "./schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { transactions } = await req.json();

        if (!transactions || transactions.length === 0) {
            return NextResponse.json({ error: "No transactions to analyze" }, { status: 400 });
        }

        const systemPrompt = `You are Finley, XPENSIFY's AI financial coach. Analyze the user's spending data and provide:
    - A concise summary of their financial situation.
    - 3-5 key insights based on their spending patterns.
    - 3 actionable recommendations to improve their financial health.
    - 2-3 specific savings opportunities.

    Brevity is key. Be encouraging but direct.
    User's Transactions: ${JSON.stringify(transactions)}`;

        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: analysisSchema,
            system: "You are Finley, XPENSIFY's AI financial coach. Analyze the user's spending data and provide financial insights.",
            messages: [
                {
                    role: "user",
                    content: `Analyze these transactions: ${JSON.stringify(transactions)}
                    
                    Please provide:
                    - A concise summary of their financial situation.
                    - 3-5 key insights based on their spending patterns.
                    - 3 actionable recommendations to improve their financial health.
                    - 2-3 specific savings opportunities.

                    Brevity is key. Be encouraging but direct.`,
                },
            ],
        });
        console.log("object1----->", object);
        return NextResponse.json({
            success: true,
            analysis: object,

        });
    } catch (error: any) {
        console.error("Error analyzing spending:", error);
        return NextResponse.json(
            { error: "Failed to analyze spending", message: error.message },
            { status: 500 }
        );
    }
}
