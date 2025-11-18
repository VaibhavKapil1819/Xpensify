
import { NextRequest, NextResponse } from "next/server";
import { streamText, UIMessage, convertToModelMessages, streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { financialNewsSchema } from "./schema";

export async function POST(req: NextRequest, res: NextResponse) {

    const userPrompt = `Generate 3 diverse financial news articles for today. Each article should have:
    - title: A compelling, specific headline (max 60 chars)
    - description: A brief summary explaining the key takeaway (max 120 chars)
    - category: One of ["Markets", "Savings", "Investing", "Crypto", "Economy", "Personal Finance"]
    - content: Full article content (2-3 paragraphs)
    
    Return as JSON array with format: [{ title, description, category, content }]`;
    try {
        const result = streamObject({
            model: google("gemini-2.5-flash"),
            schema: financialNewsSchema,
            messages: [
                {
                    role: "system", content: `You are a financial news analyst. Generate 3 current, relevant financial news articles with realistic titles and descriptions. 
                                            Focus on: market trends, investment opportunities, savings tips, cryptocurrency, economic indicators, and personal finance advice.
                                            Make them sound professional, timely, and actionable for individual investors.`
                },
                {
                    role: "user", content: userPrompt
                }
            ],
            temperature: 0.8
        });
        return result.toTextStreamResponse();
    } catch (error: any) {
        return NextResponse.json(
            { error: "Something went wrong", message: error.message },
            { status: 500 }
        );
    }
}